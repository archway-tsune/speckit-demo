/** Orders US1 - createOrder API 統合テスト (AC-4, FR-004) */
import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder, type OrdersContext } from '@/domains/orders/api';
import { OrderSchema } from '@/contracts/orders';
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

describe('createOrder - 統合テスト (FR-004)', () => {
  beforeEach(async () => {
    resetCartStore();
    resetOrderStore();

    // カートに商品を追加
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'ミニマルTシャツ',
      price: 4980,
      quantity: 2,
    });
  });

  const context: OrdersContext = {
    session: createMockSession('buyer'),
    repository: orderRepository,
    cartFetcher,
  };

  describe('Given: カートに商品がある購入者が注文確定 (AC-4)', () => {
    it('Then: Order スキーマに準拠した注文が返され、subtotal/tax/totalAmount が正確', async () => {
      const result = await createOrder({ confirmed: true }, context);

      // Schema.parse() で契約検証
      const parsed = OrderSchema.parse(result);

      expect(parsed.subtotal).toBe(9960);
      expect(parsed.tax).toBe(996); // floor(9960 * 0.1)
      expect(parsed.totalAmount).toBe(10956); // 9960 + 996
      expect(parsed.status).toBe('pending');
      expect(parsed.userId).toBe(BUYER_USER_ID);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].productName).toBe('ミニマルTシャツ');
    });

    it('Then: 注文後カートがクリアされる (FR-005)', async () => {
      await createOrder({ confirmed: true }, context);

      const cart = await cartFetcher.getByUserId(BUYER_USER_ID);
      expect(cart?.items ?? []).toHaveLength(0);
    });
  });
});
