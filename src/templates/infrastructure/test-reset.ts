/**
 * テスト用リセットAPIテンプレート
 *
 * 使用例:
 * - E2Eテスト実行時に状態をリセット
 * - 開発環境でのデータリセット
 *
 * カスタマイズポイント:
 * - resetFunctions: リセット対象のストアをリセットする関数配列
 *
 * 注意:
 * - 本番環境では使用しないこと
 * - NODE_ENV === 'production' 時は404を返す
 */
import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** リセット関数型 */
export type ResetFunction = () => void | Promise<void>;

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

export interface CreateResetHandlerOptions {
  /** グローバルリセット関数 */
  globalReset: ResetFunction;
  /** ワーカー単位リセット関数（E2E 並列実行用、オプション） */
  workerReset?: (workerIndex: number) => void | Promise<void>;
  /** 成功メッセージ */
  successMessage?: string;
  /** 本番環境エラーメッセージ */
  productionErrorMessage?: string;
  /** サーバーエラーメッセージ */
  serverErrorMessage?: string;
}

/**
 * テストリセットハンドラーを生成
 *
 * body に `{ workerIndex: number }` が含まれる場合は workerReset が呼ばれ、
 * それ以外は globalReset が呼ばれる。
 *
 * @example
 * ```typescript
 * export const POST = createResetHandler({
 *   globalReset: () => { resetAllStores(); },
 *   workerReset: (workerIndex) => { resetStoresForWorker(workerIndex); },
 * });
 * ```
 */
export function createResetHandler({
  globalReset,
  workerReset,
  successMessage = 'All stores reset',
  productionErrorMessage = 'Not available in production',
  serverErrorMessage = 'Reset failed',
}: CreateResetHandlerOptions) {
  return async function POST(request: NextRequest) {
    // 開発環境のみ有効
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: productionErrorMessage },
        { status: 404 }
      );
    }

    try {
      // body パース: workerIndex が含まれるか確認
      let workerIndex: number | undefined;
      try {
        const body = await request.json();
        workerIndex = body.workerIndex;
      } catch {
        // 空 body → グローバルリセット（後方互換）
      }

      if (typeof workerIndex === 'number' && workerIndex >= 0 && workerReset) {
        await workerReset(workerIndex);
      } else {
        await globalReset();
      }

      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    } catch (err) {
      console.error('Test reset error:', err);
      return NextResponse.json(
        { error: serverErrorMessage },
        { status: 500 }
      );
    }
  };
}

