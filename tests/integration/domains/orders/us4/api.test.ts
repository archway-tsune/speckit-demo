/** Orders US4 - updateOrderStatus API 統合テスト (AC-3, AC-5) */
import { describe, it, expect, beforeEach } from 'vitest';
import { updateOrderStatus, type OrdersContext } from '@/domains/orders/api';
import { InvalidStatusTransitionError } from '@/domains/orders/api/state-machine';
import { OrderSchema } from '@/contracts/orders';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { resetOrderStore } from '@/infrastructure/repositories/order';
import { resetCartStore } from '@/infrastructure/repositories/cart';
import type { SessionData } from '@/foundation/auth/session';

const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440101';
const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';

function createAdminSession(): SessionData {
  return { userId: ADMIN_USER_ID, role: 'admin' };
}

describe('updateOrderStatus - 統合テスト (FR-012, FR-013)', () => {
  let adminContext: OrdersContext;

  beforeEach(() => {
    resetCartStore();
    resetOrderStore();
    adminContext = {
      session: createAdminSession(),
      repository: orderRepository,
      cartFetcher,
    };
  });

  describe('Given: 管理者が有効なステータス遷移を実行 (AC-3)', () => {
    it('Then: OrderSchema に準拠した更新済み注文が返される', async () => {
      const created = await orderRepository.create({
        userId: BUYER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'pending',
      });

      const result = await updateOrderStatus({ id: created.id, status: 'confirmed' }, adminContext);
      const parsed = OrderSchema.parse(result);

      expect(parsed.status).toBe('confirmed');
      expect(parsed.id).toBe(created.id);
    });
  });

  describe('Given: 管理者が無効なステータス遷移を実行 (AC-3)', () => {
    it('Then: InvalidStatusTransitionError をスローする（delivered → pending）', async () => {
      const created = await orderRepository.create({
        userId: BUYER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'delivered',
      });

      await expect(
        updateOrderStatus({ id: created.id, status: 'pending' }, adminContext)
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  describe('Given: 購入者がステータス更新を試みる (AC-5)', () => {
    it('Then: エラーをスローする', async () => {
      const created = await orderRepository.create({
        userId: BUYER_USER_ID,
        items: [{ productId: PRODUCT_ID, productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
        subtotal: 4980,
        tax: 498,
        totalAmount: 5478,
        status: 'pending',
      });

      const buyerContext: OrdersContext = {
        session: { userId: BUYER_USER_ID, role: 'buyer' },
        repository: orderRepository,
        cartFetcher,
      };

      await expect(
        updateOrderStatus({ id: created.id, status: 'confirmed' }, buyerContext)
      ).rejects.toThrow();
    });
  });
});
