/** Orders US2 - getOrders API 統合テスト (AC-1, AC-2, FR-008) */
import { describe, it, expect, beforeEach } from 'vitest';
import { getOrders, type OrdersContext } from '@/domains/orders/api';
import { GetOrdersOutputSchema } from '@/contracts/orders';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { resetOrderStore } from '@/infrastructure/repositories/order';
import { resetCartStore } from '@/infrastructure/repositories/cart';
import { cartRepository } from '@/infrastructure/repositories';
import type { SessionData } from '@/foundation/auth/session';

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return { userId: BUYER_USER_ID, role };
}

describe('getOrders - 統合テスト (FR-008)', () => {
  beforeEach(async () => {
    resetCartStore();
    resetOrderStore();
  });

  const context: OrdersContext = {
    session: createMockSession('buyer'),
    repository: orderRepository,
    cartFetcher,
  };

  describe('Given: 注文が存在しない購入者', () => {
    it('Then: GetOrdersOutput スキーマに準拠した空の結果が返される', async () => {
      const result = await getOrders({ page: 1, limit: 20 }, context);

      const parsed = GetOrdersOutputSchema.parse(result);
      expect(parsed.orders).toHaveLength(0);
      expect(parsed.pagination.total).toBe(0);
      expect(parsed.pagination.totalPages).toBe(0);
    });
  });

  describe('Given: 購入者が注文を作成した後', () => {
    it('Then: 自分の注文のみ一覧に表示される', async () => {
      // カートに商品を追加して注文作成
      await cartRepository.addItem(BUYER_USER_ID, {
        productId: PRODUCT_ID,
        productName: 'ミニマルTシャツ',
        price: 4980,
        quantity: 1,
      });

      await orderRepository.create({
        userId: BUYER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'pending',
      });

      const result = await getOrders({ page: 1, limit: 20 }, context);
      const parsed = GetOrdersOutputSchema.parse(result);

      expect(parsed.orders).toHaveLength(1);
      expect(parsed.orders[0].userId).toBe(BUYER_USER_ID);
      expect(parsed.pagination.total).toBe(1);
    });
  });
});
