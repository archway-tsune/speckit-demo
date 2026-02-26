/** Orders ドメイン - ユースケース単体テスト */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorizationError } from '@/foundation/auth/authorize';
import { getOrders, getOrderById, createOrder, updateOrderStatus, NotFoundError, EmptyCartError, InvalidStatusTransitionError, type OrderRepository, type CartFetcher } from '@/samples/domains/orders/api';
import { createMockSession, createMockOrder, createMockCart, createMockOrderRepository, createMockCartFetcher } from '@/samples/tests/helpers';

describe('getOrders', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('Given: adminユーザー', () => {
    describe('When: 注文一覧を取得する', () => {
      it('Then: 全注文を取得できる', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);
        await getOrders({ page: 1, limit: 20 }, { session: createMockSession('admin'), repository, cartFetcher });
        expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ userId: undefined }));
      });
    });
  });
});

describe('updateOrderStatus', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('Given: adminユーザーとpending注文', () => {
    describe('When: confirmedに更新する', () => {
      it('Then: ステータスを更新する', async () => {
        const order = createMockOrder({ status: 'pending' });
        const updatedOrder = createMockOrder({ status: 'confirmed' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        vi.mocked(repository.updateStatus).mockResolvedValue(updatedOrder);
        const result = await updateOrderStatus({ id: order.id, status: 'confirmed' }, { session: createMockSession('admin'), repository, cartFetcher });
        expect(result.status).toBe('confirmed');
      });
    });

    describe('When: 無効なステータスに更新しようとする', () => {
      it('Then: InvalidStatusTransitionErrorをスローする', async () => {
        const order = createMockOrder({ status: 'pending' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        await expect(
          updateOrderStatus({ id: order.id, status: 'delivered' }, { session: createMockSession('admin'), repository, cartFetcher })
        ).rejects.toThrow(InvalidStatusTransitionError);
      });
    });
  });

  describe('Given: buyerユーザー', () => {
    describe('When: ステータスを更新しようとする', () => {
      it('Then: AuthorizationErrorをスローする', async () => {
        await expect(
          updateOrderStatus({ id: '550e8400-e29b-41d4-a716-446655440001', status: 'confirmed' }, { session: createMockSession('buyer'), repository, cartFetcher })
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});
