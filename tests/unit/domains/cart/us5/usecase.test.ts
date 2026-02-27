/** Cart US5 - カート永続化 単体テスト (AC-1,2 / FR-015) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToCart, getCart, type CartContext } from '@/domains/cart/api';
import {
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

describe('カート永続化', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  let context: CartContext;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
    context = { session: createMockSession('buyer'), repository, productFetcher };
  });

  describe('Given: 商品をカートに追加後に getCart を呼ぶ (AC-1, FR-015)', () => {
    it('Then: 追加したアイテムが保持されている', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440001';
      const cartWithItem = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        userId: context.session.userId,
        items: [{
          productId,
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 1,
          addedAt: new Date(),
        }],
        subtotal: 4980,
        itemCount: 1,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      vi.mocked(productFetcher.findById).mockResolvedValue({
        id: productId, name: 'ミニマルTシャツ', price: 4980, stock: 50,
        imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
      });
      vi.mocked(repository.findByUserId).mockResolvedValueOnce(null);
      vi.mocked(repository.create).mockResolvedValue({ ...cartWithItem, items: [], subtotal: 0, itemCount: 0 });
      vi.mocked(repository.addItem).mockResolvedValue(cartWithItem);
      vi.mocked(repository.findByUserId).mockResolvedValue(cartWithItem);

      await addToCart({ productId, quantity: 1 }, context);
      const cart = await getCart({}, context);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(productId);
    });
  });

  describe('Given: getCart を複数回呼ぶ (AC-2, FR-015)', () => {
    it('Then: 毎回同じカートが返る', async () => {
      const cartData = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        userId: context.session.userId,
        items: [],
        subtotal: 0,
        itemCount: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      vi.mocked(repository.findByUserId).mockResolvedValue(cartData);

      const cart1 = await getCart({}, context);
      const cart2 = await getCart({}, context);

      expect(cart1.id).toBe(cart2.id);
      expect(cart1.userId).toBe(cart2.userId);
    });
  });
});
