/**
 * テスト用リセットAPI
 * E2Eテスト実行時に状態をリセットするためのエンドポイント
 * workerIndex 付きリクエストで並列実行時のワーカー単位リセットに対応
 */
import { createResetHandler } from '@/templates/infrastructure/test-reset';
import { resetAllStores, resetStoresForWorker } from '@/samples/infrastructure/repositories/reset';
import { getWorkerUserIds } from '@/samples/infrastructure/auth';

export const POST = createResetHandler({
  globalReset: () => resetAllStores(),
  workerReset: (workerIndex) => {
    const { buyerUserId, adminUserId } = getWorkerUserIds(workerIndex);
    resetStoresForWorker(buyerUserId, adminUserId);
  },
});
