/**
 * リポジトリ状態リセット
 * テスト用：全てのインメモリストアをクリア
 */
import type { Cart } from '@/samples/contracts/cart';
import type { Order } from '@/samples/contracts/orders';
import { createStore } from '@/infrastructure/store';
import { resetCartStore } from './cart';
import { resetOrderStore } from './order';
import { resetProductStore } from './product';

/** 全てのインメモリストアをリセット */
export function resetAllStores(): void {
  resetCartStore();
  resetOrderStore();
  resetProductStore();
}

/** 指定ワーカーの buyer/admin ユーザーデータのみリセット（E2E 並列実行用） */
export function resetStoresForWorker(buyerUserId: string, adminUserId: string): void {
  const cartStore = createStore<Cart>('__sample_cartStore');
  cartStore.delete(buyerUserId);
  cartStore.delete(adminUserId);

  const orderStore = createStore<Order>('__sample_orderStore');
  for (const [id, order] of orderStore) {
    if (order.userId === buyerUserId || order.userId === adminUserId) {
      orderStore.delete(id);
    }
  }

  resetProductStore();
}
