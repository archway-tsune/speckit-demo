/**
 * Next.js Middleware
 * 認証・認可の二重防御（画面遷移レベル）
 */
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 認証が不要なパス
 */
const PUBLIC_PATHS = [
  '/login',
  '/logout',
  '/admin/login',
  '/admin/logout',
  '/sample/login',
  '/sample/logout',
  '/sample/admin/login',
  '/sample/admin/logout',
  '/api/',
  '/sample/api/',
  '/catalog',
  '/sample/catalog',
  '/_next',
  '/favicon.ico',
  '/forbidden',
  '/sample/forbidden',
];

/**
 * 管理者のみアクセス可能なパス
 */
const ADMIN_PATHS = ['/admin', '/sample/admin'];

/**
 * 購入者のみアクセス可能なパス（取引系ページ）
 */
const BUYER_PATHS = ['/cart', '/orders', '/checkout', '/sample/cart', '/sample/orders', '/sample/checkout'];

/**
 * パスが公開パスかどうかをチェック
 */
function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * パスが管理者パスかどうかをチェック
 */
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * パスが購入者パスかどうかをチェック
 */
function isBuyerPath(pathname: string): boolean {
  return BUYER_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * パスがサンプルパスかどうかをチェック
 */
function isSamplePath(pathname: string): boolean {
  return pathname.startsWith('/sample/');
}

/**
 * セッションからロールを取得（モック）
 * 実際の実装では、セッションCookieからセッションデータを復元する
 */
async function getSessionRole(request: NextRequest): Promise<string | null> {
  // セッションCookieからロールを取得（本番実装では暗号化されたセッションを検証）
  const sessionCookie = request.cookies.get('ec_session');

  if (!sessionCookie) {
    return null;
  }

  // デモ用: Cookieの値からロールを判定
  // 本番では暗号化されたセッションを検証し、セッションストアから取得
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData.role || null;
  } catch {
    return null;
  }
}

/**
 * ミドルウェア本体
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // セッション確認
  const role = await getSessionRole(request);

  // 未認証の場合はログインページへリダイレクト
  if (!role) {
    const sample = isSamplePath(pathname);
    const admin = isAdminPath(pathname);
    const loginPath = sample
      ? admin ? '/sample/admin/login' : '/sample/login'
      : admin ? '/admin/login' : '/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者パスへのアクセス制御 — 管理者ログインへリダイレクト
  if (isAdminPath(pathname) && role !== 'admin') {
    const loginPath = isSamplePath(pathname) ? '/sample/admin/login' : '/admin/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 購入者パスへのアクセス制御
  if (isBuyerPath(pathname) && role !== 'buyer') {
    const forbiddenUrl = new URL(
      isSamplePath(pathname) ? '/sample/forbidden' : '/forbidden',
      request.url
    );
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

/**
 * ミドルウェアの適用対象パス
 */
export const config = {
  matcher: [
    /*
     * マッチング対象:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 以外のすべてのパス
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
