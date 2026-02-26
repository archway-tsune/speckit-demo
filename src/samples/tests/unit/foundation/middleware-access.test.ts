/**
 * middleware アクセス制御の単体テスト
 *
 * テスト対象: src/middleware.ts
 * - BUYER_PATHS（cart, orders, checkout）への admin アクセス拒否
 * - catalog の公開化（認証不要）
 * - 既存の admin パスアクセス制御の維持
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// NextResponse のモック
const mockNext = vi.fn(() => ({ type: 'next' }));
const mockRedirect = vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() }));

vi.mock('next/server', () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: URL) => mockRedirect(url),
  },
}));

// middleware を動的インポート（モック適用後）
async function getMiddleware() {
  const mod = await import('@/middleware');
  return mod.middleware;
}

/** テスト用の NextRequest モックを生成 */
function createMockRequest(
  pathname: string,
  role: string | null = null
): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const cookieValue = role ? JSON.stringify({ role }) : undefined;

  return {
    nextUrl: {
      pathname,
      clone: () => ({ pathname }),
    },
    url,
    cookies: {
      get: (name: string) => {
        if (name === 'ec_session' && cookieValue) {
          return { name: 'ec_session', value: cookieValue };
        }
        return undefined;
      },
    },
  } as unknown as NextRequest;
}

describe('middleware アクセス制御', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('購入者パスへのアクセス制御', () => {
    test('admin ロールで /sample/cart にアクセスすると forbidden にリダイレクトされる', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/cart', 'admin'));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/sample/forbidden');
    });

    test('admin ロールで /sample/orders にアクセスすると forbidden にリダイレクトされる', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/orders', 'admin'));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/sample/forbidden');
    });

    test('admin ロールで /sample/checkout にアクセスすると forbidden にリダイレクトされる', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/checkout', 'admin'));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/sample/forbidden');
    });

    test('buyer ロールで /sample/cart にアクセスすると通過する', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/cart', 'buyer'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('未認証で /sample/cart にアクセスするとログインにリダイレクトされる', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/cart'));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/sample/login');
    });
  });

  describe('ルートパスの公開アクセス', () => {
    test('未認証で / にアクセスすると通過する（公開パス）', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('カタログの公開アクセス', () => {
    test('未認証で /sample/catalog にアクセスすると通過する（公開パス）', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/catalog'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('admin ロールで /sample/catalog にアクセスすると通過する（公開パス）', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/catalog', 'admin'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('未認証で /catalog にアクセスすると通過する（公開パス）', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/catalog'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('既存の管理者パスアクセス制御の維持', () => {
    test('admin ロールで /sample/admin にアクセスすると通過する', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/admin', 'admin'));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('buyer ロールで /sample/admin にアクセスすると管理者ログインにリダイレクトされる', async () => {
      const middleware = await getMiddleware();
      await middleware(createMockRequest('/sample/admin', 'buyer'));
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/sample/admin/login');
    });
  });
});
