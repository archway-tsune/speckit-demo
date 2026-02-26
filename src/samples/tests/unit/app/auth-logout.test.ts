/** ログアウトルート - 単体テスト: x-forwarded-host 対応リダイレクトを検証 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// destroyServerSession のモック
vi.mock('@/samples/infrastructure/auth', () => ({
  destroyServerSession: vi.fn(),
}));

// NextResponse.redirect のモック
const mockRedirect = vi.fn((url: URL) => ({
  type: 'redirect',
  url: url.toString(),
  status: 302,
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      redirect: (url: URL) => mockRedirect(url),
    },
  };
});

/** テスト用の NextRequest モックを生成 */
function createMockRequest(options?: {
  forwardedHost?: string;
  forwardedProto?: string;
}) {
  const headers = new Headers();
  if (options?.forwardedHost) {
    headers.set('x-forwarded-host', options.forwardedHost);
  }
  if (options?.forwardedProto) {
    headers.set('x-forwarded-proto', options.forwardedProto);
  }

  return {
    url: 'http://localhost:3000/sample/api/auth/logout',
    headers,
  } as unknown as import('next/server').NextRequest;
}

describe('サンプルログアウトルート', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Given: x-forwarded-host ヘッダーなし（ローカル環境）', () => {
    describe('When: POST でログアウトする', () => {
      it('Then: localhost ベースの /sample/catalog にリダイレクトする', async () => {
        const { POST } = await import('@/app/(samples)/sample/api/auth/logout/route');
        const req = createMockRequest();
        await POST(req);
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
        expect(redirectUrl.pathname).toBe('/sample/catalog');
        expect(redirectUrl.hostname).toBe('localhost');
      });
    });

    describe('When: GET でログアウトする', () => {
      it('Then: localhost ベースの /sample/catalog にリダイレクトする', async () => {
        const { GET } = await import('@/app/(samples)/sample/api/auth/logout/route');
        const req = createMockRequest();
        await GET(req);
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
        expect(redirectUrl.pathname).toBe('/sample/catalog');
        expect(redirectUrl.hostname).toBe('localhost');
      });
    });
  });

  describe('Given: x-forwarded-host ヘッダーあり（Codespaces 環境）', () => {
    describe('When: POST でログアウトする', () => {
      it('Then: フォワードホストベースの /sample/catalog にリダイレクトする', async () => {
        const { POST } = await import('@/app/(samples)/sample/api/auth/logout/route');
        const req = createMockRequest({
          forwardedHost: 'my-codespace-abc123.app.github.dev',
          forwardedProto: 'https',
        });
        await POST(req);
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
        expect(redirectUrl.pathname).toBe('/sample/catalog');
        expect(redirectUrl.hostname).toBe('my-codespace-abc123.app.github.dev');
        expect(redirectUrl.protocol).toBe('https:');
      });
    });

    describe('When: GET でログアウトする', () => {
      it('Then: フォワードホストベースの /sample/catalog にリダイレクトする', async () => {
        const { GET } = await import('@/app/(samples)/sample/api/auth/logout/route');
        const req = createMockRequest({
          forwardedHost: 'my-codespace-abc123.app.github.dev',
          forwardedProto: 'https',
        });
        await GET(req);
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
        expect(redirectUrl.pathname).toBe('/sample/catalog');
        expect(redirectUrl.hostname).toBe('my-codespace-abc123.app.github.dev');
        expect(redirectUrl.protocol).toBe('https:');
      });
    });
  });
});
