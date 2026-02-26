/**
 * createRouteHandler HOF 単体テスト
 *
 * AC1: 認証済みリクエスト → セッション情報がハンドラの引数に渡される
 * AC2: 未認証リクエスト → 401 レスポンス
 * AC3: ハンドラが ValidationError → 400 + fieldErrors
 * AC4: ハンドラが AppError(NOT_FOUND) → 404（handleError 経由）
 * AC4a: ハンドラが plain Error(name含 "NotFound") → 404（name 慣例）
 * AC5: ハンドラが ForbiddenError → 403
 * AC6: ハンドラが未知エラー → 500 + console.error
 * Edge: 同期関数ハンドラ / route params 受け渡し
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  createRouteHandler,
  type RouteSession,
  type RouteHandlerContext,
} from '@/templates/api/route-handler';
import { AppError, ErrorCode } from '@/foundation/errors/handler';
import { ValidationError } from '@/foundation/validation/runtime';
import { ForbiddenError } from '@/foundation/auth/authorize';
import { success } from '@/foundation/errors/response';

const mockSession: RouteSession = { userId: 'user-1', role: 'buyer', expiresAt: new Date('2099-01-01') };
const mockGetSession = vi.fn<[], Promise<RouteSession | null>>();

beforeEach(() => {
  mockGetSession.mockReset();
});

describe('createRouteHandler', () => {
  // AC1: 認証済みリクエスト → セッション情報がハンドラの引数に渡される
  it('should pass session to handler when authenticated', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = vi.fn(async (_req: NextRequest, _ctx: RouteHandlerContext) => {
      return NextResponse.json(success({ id: '1' }));
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(handlerFn).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ session: mockSession }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // AC2: 未認証リクエスト → 401 レスポンス
  it('should return 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = vi.fn();

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(401);
    expect(handlerFn).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // AC3: ValidationError → 400 + fieldErrors
  it('should return 400 with fieldErrors when ValidationError thrown', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = vi.fn(async () => {
      throw new ValidationError([{ field: 'name', message: '必須です' }], 'バリデーションエラー');
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.fieldErrors).toEqual([{ field: 'name', message: '必須です' }]);
  });

  // AC4: AppError(NOT_FOUND) → 404（handleError 経由）
  it('should return 404 when AppError-based NOT_FOUND thrown', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = vi.fn(async () => {
      throw new AppError(ErrorCode.NOT_FOUND, '商品が見つかりません');
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('商品が見つかりません');
  });

  // AC4a: plain Error (name に "NotFound" 含む) → 404（name 慣例マッピング）
  it('should return 404 when plain Error with name containing "NotFound" thrown', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    class DomainNotFoundError extends Error {
      constructor() {
        super('注文が見つかりません');
        this.name = 'NotFoundError';
      }
    }

    const handlerFn = vi.fn(async () => {
      throw new DomainNotFoundError();
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('注文が見つかりません');
  });

  // AC5: ForbiddenError → 403
  it('should return 403 when ForbiddenError thrown', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = vi.fn(async () => {
      throw new ForbiddenError('権限がありません');
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  // AC6: 未知エラー → 500 + console.error
  it('should return 500 and log when unknown error thrown', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const unknownError = new Error('unexpected');
    const handlerFn = vi.fn(async () => {
      throw unknownError;
    });

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  // Edge: 同期関数ハンドラでも正常動作
  it('should work with sync handler function', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    const handlerFn = (_req: NextRequest, _ctx: RouteHandlerContext) => {
      return NextResponse.json(success({ ok: true }));
    };

    const req = new NextRequest('http://localhost/api/test');
    const res = await handler(req, handlerFn);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // Edge: route params の受け渡し
  it('should pass route params to handler context', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const { handler } = createRouteHandler({ getSession: mockGetSession });

    let receivedParams: Record<string, string> = {};
    const handlerFn = vi.fn(async (_req: NextRequest, ctx: RouteHandlerContext) => {
      receivedParams = ctx.params;
      return NextResponse.json(success({ ok: true }));
    });

    const req = new NextRequest('http://localhost/api/test/123');
    await handler(req, handlerFn, { params: Promise.resolve({ id: '123' }) });

    expect(receivedParams).toEqual({ id: '123' });
  });
});
