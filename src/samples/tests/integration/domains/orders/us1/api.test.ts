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

  describe('getOrders', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const validatedInput = GetOrdersInputSchema.parse({ page: '2', limit: '10', status: 'pending' });
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);
      const result = await getOrders(validatedInput, { session: createMockSession(), repository, cartFetcher });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockOrder()]);
      vi.mocked(repository.count).mockResolvedValue(1);
      const result = await getOrders({ page: 1, limit: 20 }, { session: createMockSession(), repository, cartFetcher });
      const validated = GetOrdersOutputSchema.parse(result);
      expect(validated.orders).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });
  });

  describe('getOrderById', () => {
    it('出力スキーマに準拠した注文を返す', async () => {
      const order = createMockOrder();
      vi.mocked(repository.findById).mockResolvedValue(order);
      const result = await getOrderById({ id: order.id }, { session: createMockSession(), repository, cartFetcher });
      const validated = GetOrderByIdOutputSchema.parse(result);
      expect(validated.id).toBe(order.id);
    });
  });

  describe('createOrder', () => {
    it('入力スキーマのバリデーションメッセージを返す', () => {
      const parseResult = CreateOrderInputSchema.safeParse({ confirmed: false });
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toBe('注文内容を確認してください');
      }
    });

    it('出力スキーマに準拠した注文を返す', async () => {
      const cart = createMockCart(POPULATED_CART);
      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(createMockOrder({ totalAmount: cart.subtotal }));
      vi.mocked(cartFetcher.clear).mockResolvedValue();
      const result = await createOrder({ confirmed: true }, { session: createMockSession(), repository, cartFetcher });
      const validated = CreateOrderOutputSchema.parse(result);
      expect(validated.totalAmount).toBe(2000);
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('購入者フロー: カート → 注文作成 → 注文確認', async () => {
      const cart = createMockCart(POPULATED_CART);
      const order = createMockOrder({ totalAmount: cart.subtotal });
      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);
      vi.mocked(cartFetcher.clear).mockResolvedValue();
      vi.mocked(repository.findById).mockResolvedValue(order);
      const buyerSession = createMockSession('buyer');
      const created = await createOrder({ confirmed: true }, { session: buyerSession, repository, cartFetcher });
      expect(cartFetcher.clear).toHaveBeenCalledWith(buyerSession.userId);
      const detail = await getOrderById({ id: created.id }, { session: buyerSession, repository, cartFetcher });
      expect(detail.items).toHaveLength(1);
      expect(detail.totalAmount).toBe(2000);
    });
  });
});
