/**
 * テスト用リセットAPI
 * E2Eテスト実行時に状態をリセットするためのエンドポイント
 * 本番環境では使用しないこと
 */
import { NextResponse } from 'next/server';
import { resetAllStores } from '@/infrastructure/repositories/reset';
import { logger } from '@/foundation/logging/logger';

export async function POST() {
  // 開発環境のみ有効
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    resetAllStores();
    return NextResponse.json({ success: true, message: 'All stores reset' });
  } catch (err) {
    logger.error('Test reset error:', err instanceof Error ? err : undefined);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
