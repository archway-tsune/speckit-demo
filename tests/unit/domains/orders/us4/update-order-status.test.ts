/** Orders US4 - updateOrderStatus ユースケース単体テスト (AC-3, AC-4, AC-5, FR-012, FR-013) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateOrderStatus, type OrdersContext } from '@/domains/orders/api';
import { InvalidStatusTransitionError } from '@/domains/orders/api/state-machine';
import { NotFoundError } from '@/foundation/errors/domain-errors';
import {
  OrderSchema,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';
import type { SessionData } from '@/foundation/auth/session';

const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440101';
const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const ORDER_ID = '550e8400-e29b-41d4-a716-446655440200';

function createMockSession(role: 'buyer' | 'admin' = 'admin'): SessionData {
  return { userId: role === 'admin' ? ADMIN_USER_ID : BUYER_USER_ID, role };
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

describe('updateOrderStatus', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  let context: OrdersContext;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
    context = { session: createMockSession('admin'), repository, cartFetcher };
  });

  describe('Given: 管理者が有効なステータス遷移を実行 (AC-3, FR-012)', () => {
    it('Then: ステータスが更新された注文が返される', async () => {
      const order = createMockOrder({ status: 'pending' });
      const updated = createMockOrder({ status: 'confirmed' });
      vi.mocked(repository.findById).mockResolvedValue(order);
      vi.mocked(repository.updateStatus).mockResolvedValue(updated);

      const result = await updateOrderStatus({ id: ORDER_ID, status: 'confirmed' }, context);

      expect(result.status).toBe('confirmed');
      expect(vi.mocked(repository.updateStatus)).toHaveBeenCalledWith(ORDER_ID, 'confirmed');
    });
  });

  describe('Given: 管理者が無効なステータス遷移を実行 (AC-4, FR-013)', () => {
    it('Then: InvalidStatusTransitionError をスローする（delivered → pending）', async () => {
      const order = createMockOrder({ status: 'delivered' });
      vi.mocked(repository.findById).mockResolvedValue(order);

      await expect(
        updateOrderStatus({ id: ORDER_ID, status: 'pending' }, context)
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('Then: InvalidStatusTransitionError をスローする（cancelled → confirmed）', async () => {
      const order = createMockOrder({ status: 'cancelled' });
      vi.mocked(repository.findById).mockResolvedValue(order);

      await expect(
        updateOrderStatus({ id: ORDER_ID, status: 'confirmed' }, context)
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  describe('Given: 購入者がステータス更新を試みる (AC-5)', () => {
    it('Then: ForbiddenError をスローする', async () => {
      const buyerContext: OrdersContext = {
        session: createMockSession('buyer'),
        repository,
        cartFetcher,
      };

      await expect(
        updateOrderStatus({ id: ORDER_ID, status: 'confirmed' }, buyerContext)
      ).rejects.toThrow();
    });
  });

  describe('Given: 存在しない注文のステータスを更新しようとする', () => {
    it('Then: NotFoundError をスローする', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        updateOrderStatus({ id: ORDER_ID, status: 'confirmed' }, context)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
