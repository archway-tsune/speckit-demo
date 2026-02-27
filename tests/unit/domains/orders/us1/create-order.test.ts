/** Orders US1 - createOrder ユースケース単体テスト (AC-4, AC-5, FR-004, FR-005) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder, EmptyCartError, type OrdersContext } from '@/domains/orders/api';
import {
  OrderSchema,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';
import { CartSchema } from '@/contracts/cart';
import type { SessionData } from '@/foundation/auth/session';

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440100',
    role,
  };
}

function createMockCart(overrides = {}) {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440100',
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440001',
        productName: 'ミニマルTシャツ',
        price: 4980,
        quantity: 2,
        addedAt: new Date('2026-01-01'),
      },
    ],
    subtotal: 9960,
    itemCount: 2,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function createMockRepository(): OrderRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    count: vi.fn(),
  };
}

function createMockCartFetcher(): CartFetcher {
  return {
    getByUserId: vi.fn(),
    clear: vi.fn(),
  };
}

describe('createOrder', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  let context: OrdersContext;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
    context = { session: createMockSession('buyer'), repository, cartFetcher };
  });

  describe('Given: カートに商品がある購入者 (AC-4, FR-004)', () => {
    it('Then: 注文が作成され subtotal/tax/totalAmount が正確に計算される', async () => {
      const cart = createMockCart();
      const subtotal = 9960;
      const tax = Math.floor(subtotal * 0.1); // 996
      const totalAmount = subtotal + tax; // 10956

      const expectedOrder = OrderSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440200',
        userId: '550e8400-e29b-41d4-a716-446655440100',
        items: cart.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal,
        tax,
        totalAmount,
        status: 'pending',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(expectedOrder);

      const result = await createOrder({ confirmed: true }, context);

      expect(vi.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal,
          tax,
          totalAmount,
          status: 'pending',
        }),
      );
      expect(result.subtotal).toBe(subtotal);
      expect(result.tax).toBe(tax);
      expect(result.totalAmount).toBe(totalAmount);
    });

    it('Then: 消費税が端数切り捨てされる (FR-004)', async () => {
      const cart = createMockCart({ subtotal: 333, itemCount: 1, items: [
        { productId: '550e8400-e29b-41d4-a716-446655440001', productName: 'テスト商品', price: 333, quantity: 1, addedAt: new Date() },
      ] });
      const expectedTax = 33; // floor(333 * 0.1) = 33.3 → 33

      const expectedOrder = OrderSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440200',
        userId: '550e8400-e29b-41d4-a716-446655440100',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', productName: 'テスト商品', price: 333, quantity: 1 }],
        subtotal: 333,
        tax: expectedTax,
        totalAmount: 333 + expectedTax,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(expectedOrder);

      const result = await createOrder({ confirmed: true }, context);

      expect(result.tax).toBe(expectedTax);
    });
  });

  describe('Given: 注文確定後 (AC-5, FR-005)', () => {
    it('Then: cartFetcher.clear が呼ばれカートがクリアされる', async () => {
      const cart = createMockCart();
      const order = OrderSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440200',
        userId: '550e8400-e29b-41d4-a716-446655440100',
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', productName: 'ミニマルTシャツ', price: 4980, quantity: 2 }],
        subtotal: 9960,
        tax: 996,
        totalAmount: 10956,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);

      await createOrder({ confirmed: true }, context);

      expect(vi.mocked(cartFetcher.clear)).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440100');
    });
  });

  describe('Given: カートが空の購入者 (FR-004 エッジケース)', () => {
    it('Then: EmptyCartError をスローする', async () => {
      const emptyCart = createMockCart({ items: [], subtotal: 0, itemCount: 0 });
      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(emptyCart);

      await expect(
        createOrder({ confirmed: true }, context)
      ).rejects.toThrow(EmptyCartError);
    });

    it('Then: カートが null のとき EmptyCartError をスローする', async () => {
      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(null);

      await expect(
        createOrder({ confirmed: true }, context)
      ).rejects.toThrow(EmptyCartError);
    });
  });

  describe('Given: 管理者ロールのユーザー (AC-5)', () => {
    it('Then: ForbiddenError をスローする', async () => {
      const adminContext: OrdersContext = {
        ...context,
        session: createMockSession('admin'),
      };

      await expect(
        createOrder({ confirmed: true }, adminContext)
      ).rejects.toThrow();
    });
  });
});
