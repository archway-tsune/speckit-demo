/**
 * リポジトリ状態リセット
 * テスト用：全てのインメモリストアをクリア
 */
import type { Cart } from '@/contracts/cart';
import type { Order } from '@/contracts/orders';
import { resetCartStore } from './cart';
import { resetOrderStore } from './order';
import { resetProductStore } from './product';
import { createStore } from '@/infrastructure/store';

/** 全てのインメモリストアをリセット */
export function resetAllStores(): void {
  resetCartStore();
  resetOrderStore();
  resetProductStore();
}

/** 指定ワーカーの buyer/admin ユーザーデータのみリセット（E2E 並列実行用） */
export function resetStoresForWorker(buyerUserId: string, adminUserId: string): void {
  const cartStore = createStore<Cart>('carts');
  cartStore.delete(buyerUserId);
  cartStore.delete(adminUserId);

  const orderStore = createStore<Order>('orders');
  for (const [id, order] of orderStore) {
    if (order.userId === buyerUserId || order.userId === adminUserId) {
      orderStore.delete(id);
    }
  }
}
