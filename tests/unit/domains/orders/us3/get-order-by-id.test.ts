/** Orders US3 - getOrderById ユースケース単体テスト (AC-1, AC-2, FR-009, FR-010) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrderById, type OrdersContext } from '@/domains/orders/api';
import { NotFoundError } from '@/foundation/errors/domain-errors';
import {
  OrderSchema,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';
import type { SessionData } from '@/foundation/auth/session';

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440102';
const ORDER_ID = '550e8400-e29b-41d4-a716-446655440200';

function createMockSession(role: 'buyer' | 'admin' = 'buyer', userId = BUYER_USER_ID): SessionData {
  return { userId, role };
}

function createMockOrder(overrides = {}) {
  return OrderSchema.parse({
    id: ORDER_ID,
    userId: BUYER_USER_ID,
    items: [{ productId: '550e8400-e29b-41d4-a716-446655440001', productName: 'ミニマルTシャツ', price: 4980, quantity: 1 }],
    subtotal: 4980,
    tax: 498,
    totalAmount: 5478,
    status: 'pending' as const,
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

describe('getOrderById', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  let context: OrdersContext;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
    context = { session: createMockSession('buyer'), repository, cartFetcher };
  });

  describe('Given: 自分の注文IDを指定した購入者 (AC-1, FR-009)', () => {
    it('Then: 注文が返される', async () => {
      const order = createMockOrder();
      vi.mocked(repository.findById).mockResolvedValue(order);

      const result = await getOrderById({ id: ORDER_ID }, context);

      expect(result.id).toBe(ORDER_ID);
      expect(result.userId).toBe(BUYER_USER_ID);
    });
  });

  describe('Given: 他人の注文IDを指定した購入者 (AC-2, FR-010)', () => {
    it('Then: NotFoundError をスローする（他人の注文は見えない）', async () => {
      const otherOrder = createMockOrder({ userId: OTHER_USER_ID });
      vi.mocked(repository.findById).mockResolvedValue(otherOrder);

      const otherContext: OrdersContext = {
        session: createMockSession('buyer', BUYER_USER_ID),
        repository,
        cartFetcher,
      };

      await expect(
        getOrderById({ id: ORDER_ID }, otherContext)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: 存在しない注文IDを指定した購入者 (FR-009)', () => {
    it('Then: NotFoundError をスローする', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getOrderById({ id: ORDER_ID }, context)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: 管理者が任意の注文IDを指定 (AC-1)', () => {
    it('Then: 他人の注文も取得できる', async () => {
      const anyOrder = createMockOrder({ userId: OTHER_USER_ID });
      vi.mocked(repository.findById).mockResolvedValue(anyOrder);

      const adminContext: OrdersContext = {
        session: createMockSession('admin'),
        repository,
        cartFetcher,
      };

      const result = await getOrderById({ id: ORDER_ID }, adminContext);
      expect(result.userId).toBe(OTHER_USER_ID);
    });
  });
});
