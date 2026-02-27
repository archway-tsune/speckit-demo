/** Cart US4 - removeFromCart ユースケース単体テスト (AC-2,3 / FR-014) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeFromCart, type CartContext } from '@/domains/cart/api';
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

describe('removeFromCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  let context: CartContext;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
    context = { session: createMockSession('buyer'), repository, productFetcher };
  });

  describe('Given: カートに商品がある (AC-2, FR-014)', () => {
    it('Then: 削除成功し CartSchema に準拠した結果を返す', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440001';
      const existingCart = createMockCart({
        items: [{
          productId,
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 1,
          addedAt: new Date(),
        }],
        itemCount: 1,
        subtotal: 4980,
      });
      const emptyCart = createMockCart();

      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
      vi.mocked(repository.removeItem).mockResolvedValue(emptyCart);

      const result = await removeFromCart({ productId }, context);

      expect(vi.mocked(repository.removeItem)).toHaveBeenCalledWith(
        context.session.userId,
        productId
      );
      expect(result.itemCount).toBe(0);
    });
  });

  describe('Given: 最後の商品を削除 (AC-3, FR-014)', () => {
    it('Then: 空カートを返す', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440001';
      const singleItemCart = createMockCart({
        items: [{
          productId,
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 1,
          addedAt: new Date(),
        }],
        itemCount: 1,
        subtotal: 4980,
      });
      const emptyCart = createMockCart();

      vi.mocked(repository.findByUserId).mockResolvedValue(singleItemCart);
      vi.mocked(repository.removeItem).mockResolvedValue(emptyCart);

      const result = await removeFromCart({ productId }, context);

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
    });
  });

  describe('Given: admin ロール', () => {
    it('Then: 認証エラーをスローする', async () => {
      const adminContext: CartContext = {
        ...context,
        session: createMockSession('admin'),
      };
      await expect(
        removeFromCart({ productId: '550e8400-e29b-41d4-a716-446655440001' }, adminContext)
      ).rejects.toThrow();
    });
  });
});
