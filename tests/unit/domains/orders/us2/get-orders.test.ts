/** Orders US2 - getOrders ユースケース単体テスト (AC-1, AC-2, FR-007, FR-008) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrders, type OrdersContext } from '@/domains/orders/api';
import {
  GetOrdersOutputSchema,
  OrderSchema,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';
import type { SessionData } from '@/foundation/auth/session';

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440102';

function createMockSession(role: 'buyer' | 'admin' = 'buyer', userId = BUYER_USER_ID): SessionData {
  return { userId, role };
}

function createMockOrder(overrides = {}) {
  return OrderSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440200',
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

describe('getOrders', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;
  let context: OrdersContext;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
    context = { session: createMockSession('buyer'), repository, cartFetcher };
  });

  describe('Given: 購入者ロール (AC-1, FR-007)', () => {
    it('Then: 自分のユーザーIDでフィルタされた注文のみ取得できる', async () => {
      const myOrder = createMockOrder();
      vi.mocked(repository.findAll).mockResolvedValue([myOrder]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getOrders({ page: 1, limit: 20 }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ userId: BUYER_USER_ID }),
      );
      const parsed = GetOrdersOutputSchema.parse(result);
      expect(parsed.orders).toHaveLength(1);
    });

    it('Then: ページネーション情報が正確に計算される (FR-008)', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(45);

      const result = await getOrders({ page: 2, limit: 20 }, context);
      const parsed = GetOrdersOutputSchema.parse(result);

      expect(parsed.pagination.page).toBe(2);
      expect(parsed.pagination.limit).toBe(20);
      expect(parsed.pagination.total).toBe(45);
      expect(parsed.pagination.totalPages).toBe(3);
    });
  });

  describe('Given: 管理者ロール (AC-2)', () => {
    it('Then: userId フィルタなしで全注文を取得できる', async () => {
      const adminContext: OrdersContext = {
        session: createMockSession('admin'),
        repository,
        cartFetcher,
      };
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getOrders({ page: 1, limit: 20 }, adminContext);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });

    it('Then: ステータスフィルタが適用される', async () => {
      const adminContext: OrdersContext = {
        session: createMockSession('admin'),
        repository,
        cartFetcher,
      };
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getOrders({ page: 1, limit: 20, status: 'pending' }, adminContext);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });
  });

  describe('Given: 別ユーザーIDで明示的にフィルタしようとしても (FR-007)', () => {
    it('Then: 購入者は自分のIDでのみフィルタされる', async () => {
      const buyerContext: OrdersContext = {
        session: createMockSession('buyer', BUYER_USER_ID),
        repository,
        cartFetcher,
      };
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getOrders({ page: 1, limit: 20, userId: OTHER_USER_ID }, buyerContext);

      // buyer は自分の ID が適用される（OTHER_USER_ID は無視される）
      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ userId: BUYER_USER_ID }),
      );
    });
  });
});
