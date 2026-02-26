/**
 * テストリセットテンプレート 単体テスト
 * US1: createResetHandler に workerReset コールバック・body パース追加
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';

describe('createResetHandler テンプレート', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  describe('globalReset コールバック', () => {
    it('Given globalReset 関数, When body なしで POST, Then globalReset が呼ばれ success が返る', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
      });

      const response = await handler(request);
      const data = await response.json();

      expect(globalReset).toHaveBeenCalledOnce();
      expect(data.success).toBe(true);
    });
  });

  describe('workerReset コールバック', () => {
    it('Given workerReset 関数, When body に workerIndex: 2 を送信, Then workerReset(2) が呼ばれる', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const workerReset = vi.fn();
      const handler = createResetHandler({ globalReset, workerReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
        body: JSON.stringify({ workerIndex: 2 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handler(request);
      const data = await response.json();

      expect(workerReset).toHaveBeenCalledWith(2);
      expect(globalReset).not.toHaveBeenCalled();
      expect(data.success).toBe(true);
    });

    it('Given workerReset なし, When body に workerIndex を送信, Then globalReset が呼ばれる（フォールバック）', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
        body: JSON.stringify({ workerIndex: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handler(request);
      const data = await response.json();

      expect(globalReset).toHaveBeenCalledOnce();
      expect(data.success).toBe(true);
    });
  });

  describe('body パース', () => {
    it('Given 空 body, When POST, Then globalReset が呼ばれる（後方互換）', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
      });

      const response = await handler(request);
      const data = await response.json();

      expect(globalReset).toHaveBeenCalledOnce();
      expect(data.success).toBe(true);
    });

    it('Given 不正な JSON body, When POST, Then globalReset が呼ばれる（フォールバック）', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'text/plain' },
      });

      const response = await handler(request);
      const data = await response.json();

      expect(globalReset).toHaveBeenCalledOnce();
      expect(data.success).toBe(true);
    });
  });

  describe('本番環境ガード', () => {
    it('Given NODE_ENV=production, When POST, Then 404 が返る', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn();
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
      });

      const response = await handler(request);
      expect(response.status).toBe(404);
      expect(globalReset).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('Given globalReset がエラーを投げる, When POST, Then 500 が返る', async () => {
      const { createResetHandler } = await import('@/templates/infrastructure/test-reset');

      const globalReset = vi.fn(() => { throw new Error('Reset failed'); });
      const handler = createResetHandler({ globalReset });

      const request = new NextRequest('http://localhost/api/test/reset', {
        method: 'POST',
      });

      const response = await handler(request);
      expect(response.status).toBe(500);
    });
  });
});
