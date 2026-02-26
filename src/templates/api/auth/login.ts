/**
 * ログインAPIテンプレート
 *
 * 使用例:
 * - POST /api/auth/login
 *
 * カスタマイズポイント:
 * - authenticate: 認証コールバック（body を受け取り AuthResult | null を返す）
 * - createSession: セッション作成コールバック（オプション）
 * - schema: Zod バリデーションスキーマ（オプション）
 */
import { NextRequest, NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** 認証結果 */
export interface AuthResult {
  userId: string;
  role: string;
  name: string;
}

/** ハンドラー生成オプション */
export interface CreateLoginHandlerOptions {
  /** 認証コールバック: パースされた body を受け取り、認証結果を返す */
  authenticate: (body: Record<string, unknown>) => Promise<AuthResult | null>;
  /** セッション作成コールバック（オプション） */
  createSession?: (result: AuthResult) => Promise<void> | void;
  /** バリデーションスキーマ（オプション） */
  schema?: ZodSchema;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * ログインハンドラーを生成
 */
export function createLoginHandler({
  authenticate,
  createSession,
  schema,
}: CreateLoginHandlerOptions) {
  return async function POST(request: NextRequest) {
    try {
      // リクエストボディをパース（空 body は {} として扱う）
      let body: Record<string, unknown> = {};
      try {
        body = await request.json();
      } catch {
        // 空のボディは許容（デモ用自動ログイン）
      }

      // スキーマバリデーション（指定時のみ）
      if (schema) {
        const result = schema.safeParse(body);
        if (!result.success) {
          return NextResponse.json(
            error(ErrorCode.VALIDATION_ERROR, '入力内容に誤りがあります'),
            { status: 400 }
          );
        }
        body = result.data as Record<string, unknown>;
      }

      // 認証
      const authResult = await authenticate(body);
      if (!authResult) {
        return NextResponse.json(
          error(ErrorCode.UNAUTHORIZED, 'メールアドレスまたはパスワードが正しくありません'),
          { status: 401 }
        );
      }

      // セッション作成（オプション）
      if (createSession) {
        await createSession(authResult);
      }

      return NextResponse.json(
        success({
          userId: authResult.userId,
          role: authResult.role,
          name: authResult.name,
        })
      );
    } catch (err) {
      console.error('POST /api/auth/login error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, 'ログインに失敗しました'),
        { status: 500 }
      );
    }
  };
}

export default createLoginHandler;
