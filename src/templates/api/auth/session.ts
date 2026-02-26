/**
 * セッション確認APIテンプレート
 *
 * 使用例:
 * - GET /api/auth/session
 *
 * カスタマイズポイント:
 * - getSession: セッション取得コールバック
 * - getUserName: ユーザー名取得コールバック（オプション）
 */
import { NextResponse } from 'next/server';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** ハンドラー生成オプション */
export interface CreateSessionHandlerOptions {
  /** セッション取得コールバック */
  getSession: () => Promise<Record<string, unknown> | null>;
  /** ユーザー名取得コールバック（オプション） */
  getUserName?: (session: Record<string, unknown>) => string;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * セッション確認ハンドラーを生成
 */
export function createSessionHandler({
  getSession,
  getUserName,
}: CreateSessionHandlerOptions) {
  return async function GET() {
    try {
      const session = await getSession();

      if (!session) {
        return NextResponse.json(
          error(ErrorCode.UNAUTHORIZED, '未認証'),
          { status: 401 }
        );
      }

      const data: Record<string, unknown> = { ...session };
      if (getUserName) {
        data.name = getUserName(session);
      }

      return NextResponse.json(success(data));
    } catch (err) {
      console.error('GET /api/auth/session error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, 'セッション確認に失敗しました'),
        { status: 500 }
      );
    }
  };
}

export default createSessionHandler;
