/** Orders ドメイン - ユースケース単体テスト */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorizationError } from '@/foundation/auth/authorize';
import { getOrders, getOrderById, createOrder, updateOrderStatus, NotFoundError, EmptyCartError, InvalidStatusTransitionError, type OrderRepository, type CartFetcher } from '@/samples/domains/orders/api';
import { createMockSession, createMockOrder, createMockCart, createMockOrderRepository, createMockCartFetcher } from '@/samples/tests/helpers';

describe('getOrders', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('Given: buyerユーザー', () => {
    describe('When: 注文一覧を取得する', () => {
      it('Then: 自分の注文のみを取得する', async () => {
        const orders = [createMockOrder()];
        vi.mocked(repository.findAll).mockResolvedValue(orders);
        vi.mocked(repository.count).mockResolvedValue(1);
        const result = await getOrders({ page: 1, limit: 20 }, { session: createMockSession('buyer'), repository, cartFetcher });
        expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ userId: '550e8400-e29b-41d4-a716-446655440000' }));
        expect(result.orders).toHaveLength(1);
      });
    });
  });
});

describe('getOrderById', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('Given: 存在する注文', () => {
    describe('When: 詳細を取得する', () => {
      it('Then: 注文情報を返す', async () => {
        const order = createMockOrder();
        vi.mocked(repository.findById).mockResolvedValue(order);
        const result = await getOrderById({ id: order.id }, { session: createMockSession('buyer'), repository, cartFetcher });
        expect(result.id).toBe(order.id);
      });
    });
  });

  describe('Given: 他ユーザーの注文', () => {
    describe('When: buyerが詳細を取得しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        const order = createMockOrder({ userId: '550e8400-e29b-41d4-a716-446655440099' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        await expect(
          getOrderById({ id: order.id }, { session: createMockSession('buyer'), repository, cartFetcher })
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Given: 存在しない注文', () => {
    describe('When: 詳細を取得しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);
        await expect(
          getOrderById({ id: '550e8400-e29b-41d4-a716-446655440999' }, { session: createMockSession('buyer'), repository, cartFetcher })
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});

describe('createOrder', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  beforeEach(() => { repository = createMockOrderRepository(); cartFetcher = createMockCartFetcher(); });

  describe('Given: buyerユーザーとカート内商品', () => {
    describe('When: 注文を作成する', () => {
      it('Then: 注文を作成してカートをクリアする', async () => {
        const cart = createMockCart({
          items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 1, addedAt: new Date() }],
          subtotal: 1000, itemCount: 1,
        });
        const order = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(order);
        vi.mocked(cartFetcher.clear).mockResolvedValue();
        const result = await createOrder({ confirmed: true }, { session: createMockSession('buyer'), repository, cartFetcher });
        expect(result.id).toBe(order.id);
        expect(cartFetcher.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Given: 空のカート', () => {
    describe('When: 注文を作成しようとする', () => {
      it('Then: EmptyCartErrorをスローする', async () => {
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(createMockCart());
        await expect(
          createOrder({ confirmed: true }, { session: createMockSession('buyer'), repository, cartFetcher })
        ).rejects.toThrow(EmptyCartError);
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: 注文を作成する', () => {
      it('Then: adminもbuyer権限を持つため注文を作成できる', async () => {
        const cart = createMockCart({
          items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 1, addedAt: new Date() }],
          subtotal: 1000, itemCount: 1,
        });
        const order = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(order);
        vi.mocked(cartFetcher.clear).mockResolvedValue();
        const result = await createOrder({ confirmed: true }, { session: createMockSession('admin'), repository, cartFetcher });
        expect(result.id).toBe(order.id);
      });
    });
  });
});
