/**
 * API Auth テンプレート 単体テスト
 * US3: createLoginHandler / createLogoutHandler / createSessionHandler の再設計テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

describe('createLoginHandler テンプレート', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Given authenticate コールバック, When POST with body, Then authenticate(body) が呼ばれ成功レスポンス', async () => {
    const { createLoginHandler } = await import('@/templates/api/auth/login');

    const authenticate = vi.fn().mockResolvedValue({ userId: 'user-1', role: 'buyer', name: 'テスト購入者' });
    const handler = createLoginHandler({ authenticate });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'buyer@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);
    const data = await response.json();

    expect(authenticate).toHaveBeenCalledWith({ email: 'buyer@test.com' });
    expect(data.success).toBe(true);
    expect(data.data.userId).toBe('user-1');
    expect(data.data.name).toBe('テスト購入者');
  });

  it('Given authenticate + createSession, When POST, Then 両方呼ばれる', async () => {
    const { createLoginHandler } = await import('@/templates/api/auth/login');

    const authenticate = vi.fn().mockResolvedValue({ userId: 'u1', role: 'buyer', name: 'Test' });
    const createSession = vi.fn();
    const handler = createLoginHandler({ authenticate, createSession });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    await handler(request);
    expect(createSession).toHaveBeenCalledWith({ userId: 'u1', role: 'buyer', name: 'Test' });
  });

  it('Given 空 body, When POST, Then authenticate({}) が呼ばれる（デモ互換）', async () => {
    const { createLoginHandler } = await import('@/templates/api/auth/login');

    const authenticate = vi.fn().mockResolvedValue({ userId: 'u1', role: 'buyer', name: 'Test' });
    const handler = createLoginHandler({ authenticate });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
    });

    const response = await handler(request);
    const data = await response.json();

    expect(authenticate).toHaveBeenCalledWith({});
    expect(data.success).toBe(true);
  });

  it('Given schema バリデーション付き, When 不正 body, Then 400 が返る', async () => {
    const { createLoginHandler } = await import('@/templates/api/auth/login');

    const schema = z.object({ email: z.string().email() });
    const authenticate = vi.fn();
    const handler = createLoginHandler({ authenticate, schema });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('Given authenticate が null を返す, When POST, Then 401 が返る', async () => {
    const { createLoginHandler } = await import('@/templates/api/auth/login');

    const authenticate = vi.fn().mockResolvedValue(null);
    const handler = createLoginHandler({ authenticate });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);
    expect(response.status).toBe(401);
  });
});

describe('createLogoutHandler テンプレート', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Given destroySession, When POST, Then セッション破棄して成功', async () => {
    const { createLogoutHandler } = await import('@/templates/api/auth/logout');

    const destroySession = vi.fn();
    const handler = createLogoutHandler({ destroySession });

    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(destroySession).toHaveBeenCalledOnce();
    expect(response.status).toBeLessThan(400);
  });

  it('Given redirectUrl 付き, When POST, Then リダイレクトレスポンス', async () => {
    const { createLogoutHandler } = await import('@/templates/api/auth/logout');

    const destroySession = vi.fn();
    const handler = createLogoutHandler({ destroySession, redirectUrl: '/catalog' });

    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(destroySession).toHaveBeenCalledOnce();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/catalog');
  });

  it('Given redirectUrl + x-forwarded-host, When POST, Then forwarded host でリダイレクト', async () => {
    const { createLogoutHandler } = await import('@/templates/api/auth/logout');

    const destroySession = vi.fn();
    const handler = createLogoutHandler({ destroySession, redirectUrl: '/catalog' });

    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'x-forwarded-host': 'example.com', 'x-forwarded-proto': 'https' },
    });

    const response = await handler(request);
    expect(response.headers.get('location')).toContain('example.com');
  });

  it('Given GET 対応, When GET, Then セッション破棄してレスポンス', async () => {
    const { createLogoutHandler } = await import('@/templates/api/auth/logout');

    const destroySession = vi.fn();
    const { POST, GET } = createLogoutHandler({ destroySession, redirectUrl: '/catalog' });

    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(destroySession).toHaveBeenCalledOnce();
    expect(response.status).toBe(307);
  });
});

describe('createSessionHandler テンプレート', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Given getSession がセッションを返す, When GET, Then 成功レスポンス', async () => {
    const { createSessionHandler } = await import('@/templates/api/auth/session');

    const getSession = vi.fn().mockResolvedValue({ userId: 'user-1', role: 'buyer' });
    const handler = createSessionHandler({ getSession });

    const response = await handler();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.userId).toBe('user-1');
    expect(data.data.role).toBe('buyer');
  });

  it('Given getSession + getUserName, When GET, Then name 付きレスポンス', async () => {
    const { createSessionHandler } = await import('@/templates/api/auth/session');

    const getSession = vi.fn().mockResolvedValue({ userId: 'user-1', role: 'buyer' });
    const getUserName = vi.fn().mockReturnValue('購入者テスト');
    const handler = createSessionHandler({ getSession, getUserName });

    const response = await handler();
    const data = await response.json();

    expect(getUserName).toHaveBeenCalledWith({ userId: 'user-1', role: 'buyer' });
    expect(data.data.name).toBe('購入者テスト');
  });

  it('Given getSession が null, When GET, Then 401 が返る', async () => {
    const { createSessionHandler } = await import('@/templates/api/auth/session');

    const getSession = vi.fn().mockResolvedValue(null);
    const handler = createSessionHandler({ getSession });

    const response = await handler();
    expect(response.status).toBe(401);
  });
});
