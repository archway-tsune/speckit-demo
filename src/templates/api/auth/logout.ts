/**
 * ログアウトAPIテンプレート
 *
 * 使用例:
 * - POST /api/auth/logout
 * - GET /api/auth/logout（リダイレクト対応）
 *
 * カスタマイズポイント:
 * - destroySession: セッション破棄コールバック
 * - redirectUrl: ログアウト後のリダイレクト先（オプション）
 */
import { NextRequest, NextResponse } from 'next/server';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** ハンドラー生成オプション */
export interface CreateLogoutHandlerOptions {
  /** セッション破棄コールバック */
  destroySession: () => Promise<void> | void;
  /** ログアウト後のリダイレクト先パス（オプション） */
  redirectUrl?: string;
}

// ─────────────────────────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────────────────────────

function buildRedirectUrl(path: string, request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.url;
  return new URL(path, baseUrl);
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

/** ログアウトハンドラーの戻り値型 */
export interface LogoutHandlers {
  (request: NextRequest): Promise<NextResponse>;
  POST: (request: NextRequest) => Promise<NextResponse>;
  GET: (request: NextRequest) => Promise<NextResponse>;
}

/**
 * ログアウトハンドラーを生成
 * POST/GET 両対応。redirectUrl 指定時は 307 リダイレクト。
 */
export function createLogoutHandler({
  destroySession,
  redirectUrl,
}: CreateLogoutHandlerOptions): LogoutHandlers {
  async function handleLogout(request: NextRequest): Promise<NextResponse> {
    try {
      await destroySession();

      if (redirectUrl) {
        const url = buildRedirectUrl(redirectUrl, request);
        return NextResponse.redirect(url);
      }

      return NextResponse.json(success({ message: 'ログアウトしました' }));
    } catch (err) {
      console.error('POST /api/auth/logout error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, 'ログアウトに失敗しました'),
        { status: 500 }
      );
    }
  }

  const handler = Object.assign(handleLogout, {
    POST: handleLogout,
    GET: handleLogout,
  });

  return handler;
}

export default createLogoutHandler;
