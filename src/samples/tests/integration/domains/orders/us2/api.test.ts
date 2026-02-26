/** Orders ドメイン - API統合テスト: 契約スキーマとの整合性検証 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetOrdersInputSchema, GetOrdersOutputSchema, GetOrderByIdOutputSchema,
  CreateOrderInputSchema, CreateOrderOutputSchema, ValidStatusTransitions,
} from '@/samples/contracts/orders';
import { getOrders, getOrderById, createOrder, updateOrderStatus, type OrderRepository, type CartFetcher } from '@/samples/domains/orders/api';
import { createMockSession, createMockOrder, createMockCart, createMockOrderRepository, createMockCartFetcher } from '@/samples/tests/helpers';

const POPULATED_CART = {
  items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 2, addedAt: new Date() }],
  subtotal: 2000, itemCount: 2,
};

describe('Orders API統合テスト', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('updateOrderStatus', () => {
    it('有効なステータス遷移を許可する', async () => {
      vi.mocked(repository.findById).mockResolvedValue(createMockOrder({ status: 'pending' }));
      vi.mocked(repository.updateStatus).mockResolvedValue(createMockOrder({ status: 'confirmed' }));
      const result = await updateOrderStatus({ id: '550e8400-e29b-41d4-a716-446655440001', status: 'confirmed' }, { session: createMockSession('admin'), repository, cartFetcher });
      expect(result.status).toBe('confirmed');
    });

    it('全ステータス遷移ルールが定義されている', () => {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
      for (const status of statuses) {
        expect(ValidStatusTransitions[status]).toBeDefined();
        expect(Array.isArray(ValidStatusTransitions[status])).toBe(true);
      }
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('注文作成 → 一覧確認 → 詳細取得 → ステータス更新', async () => {
      const cart = createMockCart(POPULATED_CART);
      const order = createMockOrder({ totalAmount: cart.subtotal, status: 'pending' });
      const confirmedOrder = createMockOrder({ totalAmount: cart.subtotal, status: 'confirmed' });
      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);
      vi.mocked(cartFetcher.clear).mockResolvedValue();
      vi.mocked(repository.findAll).mockResolvedValue([order]);
      vi.mocked(repository.count).mockResolvedValue(1);
      vi.mocked(repository.findById).mockResolvedValue(order);
      vi.mocked(repository.updateStatus).mockResolvedValue(confirmedOrder);
      const created = await createOrder({ confirmed: true }, { session: createMockSession(), repository, cartFetcher });
      expect(created.status).toBe('pending');
      const list = await getOrders({ page: 1, limit: 20 }, { session: createMockSession(), repository, cartFetcher });
      expect(list.orders).toHaveLength(1);
      const detail = await getOrderById({ id: created.id }, { session: createMockSession(), repository, cartFetcher });
      expect(detail.id).toBe(created.id);
      const updated = await updateOrderStatus({ id: created.id, status: 'confirmed' }, { session: createMockSession('admin'), repository, cartFetcher });
      expect(updated.status).toBe('confirmed');
    });
  });
});
