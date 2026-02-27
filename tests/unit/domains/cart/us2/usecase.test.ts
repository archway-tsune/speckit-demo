/** Cart US2 - getCart ユースケース単体テスト (AC-1,2,3 / FR-008,009,010) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCart, type CartContext } from '@/domains/cart/api';
import {
  CartSchema,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';
import type { SessionData } from '@/foundation/auth/session';

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
  };
}

function createMockCart(overrides = {}) {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [],
    subtotal: 0,
    itemCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function createMockRepository(): CartRepository {
  return {
    findByUserId: vi.fn(),
    create: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
  };
}

function createMockProductFetcher(): ProductFetcher {
  return { findById: vi.fn() };
}

describe('getCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  let context: CartContext;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
    context = { session: createMockSession('buyer'), repository, productFetcher };
  });

  describe('Given: カートが存在しない (AC-1, FR-008)', () => {
    it('Then: 空カートを作成して返す', async () => {
      const newCart = createMockCart();
      vi.mocked(repository.findByUserId).mockResolvedValue(null);
      vi.mocked(repository.create).mockResolvedValue(newCart);

      const result = await getCart({}, context);

      expect(vi.mocked(repository.create)).toHaveBeenCalledWith(context.session.userId);
      expect(result.items).toHaveLength(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe('Given: カートが存在する (AC-1, FR-008)', () => {
    it('Then: 既存のカートを返す', async () => {
      const existingCart = createMockCart({
        items: [{
          productId: '550e8400-e29b-41d4-a716-446655440001',
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 2,
          addedAt: new Date(),
        }],
        subtotal: 9960,
        itemCount: 2,
      });
      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);

      const result = await getCart({}, context);

      expect(vi.mocked(repository.create)).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.subtotal).toBe(9960);
    });
  });

  describe('Given: admin ロール (AC-1, FR-008)', () => {
    it('Then: 認証エラーをスローする', async () => {
      const adminContext: CartContext = { ...context, session: createMockSession('admin') };
      await expect(getCart({}, adminContext)).rejects.toThrow();
    });
  });
});
