/** Orders US3 - getOrderById API 統合テスト (AC-1, AC-2) */
import { describe, it, expect, beforeEach } from 'vitest';
import { getOrderById, type OrdersContext } from '@/domains/orders/api';
import { NotFoundError } from '@/foundation/errors/domain-errors';
import { OrderSchema } from '@/contracts/orders';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { resetOrderStore } from '@/infrastructure/repositories/order';
import { resetCartStore } from '@/infrastructure/repositories/cart';
import type { SessionData } from '@/foundation/auth/session';

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440102';
const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';

function createMockSession(role: 'buyer' | 'admin' = 'buyer', userId = BUYER_USER_ID): SessionData {
  return { userId, role };
}

describe('getOrderById - 統合テスト (FR-009, FR-010)', () => {
  beforeEach(() => {
    resetCartStore();
    resetOrderStore();
  });

  describe('Given: 購入者が自分の注文を取得 (AC-1)', () => {
    it('Then: Order スキーマに準拠した注文が返される', async () => {
      const created = await orderRepository.create({
        userId: BUYER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'pending',
      });

      const context: OrdersContext = {
        session: createMockSession('buyer'),
        repository: orderRepository,
        cartFetcher,
      };

      const result = await getOrderById({ id: created.id }, context);
      const parsed = OrderSchema.parse(result);

      expect(parsed.id).toBe(created.id);
      expect(parsed.userId).toBe(BUYER_USER_ID);
      expect(parsed.subtotal).toBe(4980);
      expect(parsed.tax).toBe(498);
      expect(parsed.totalAmount).toBe(5478);
    });
  });

  describe('Given: 購入者が他人の注文IDにアクセス (AC-2)', () => {
    it('Then: NotFoundError をスローする', async () => {
      const otherOrder = await orderRepository.create({
        userId: OTHER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'pending',
      });

      const context: OrdersContext = {
        session: createMockSession('buyer', BUYER_USER_ID),
        repository: orderRepository,
        cartFetcher,
      };

      await expect(
        getOrderById({ id: otherOrder.id }, context)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
