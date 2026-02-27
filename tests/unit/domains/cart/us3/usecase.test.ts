/** Cart US3 - updateCartItem ユースケース単体テスト (AC-1,2 / FR-011,012) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCartItem, type CartContext } from '@/domains/cart/api';
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

function createMockProduct(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    stock: 5,
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    ...overrides,
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

describe('updateCartItem', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  let context: CartContext;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
    context = { session: createMockSession('buyer'), repository, productFetcher };
  });

  describe('Given: 有効な数量（在庫以内）(AC-1, FR-011)', () => {
    it('Then: 数量が更新されたカートを返す', async () => {
      const product = createMockProduct({ stock: 5 });
      const existingCart = createMockCart({
        items: [{
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          addedAt: new Date(),
        }],
        itemCount: 1,
        subtotal: product.price,
      });
      const updatedCart = createMockCart({
        items: [{
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 3,
          addedAt: new Date(),
        }],
        itemCount: 3,
        subtotal: product.price * 3,
      });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
      vi.mocked(repository.updateItemQuantity).mockResolvedValue(updatedCart);

      const result = await updateCartItem({ productId: product.id, quantity: 3 }, context);

      expect(vi.mocked(repository.updateItemQuantity)).toHaveBeenCalledWith(
        context.session.userId,
        product.id,
        3
      );
      expect(result.itemCount).toBe(3);
    });
  });

  describe('Given: 在庫を超える数量 (AC-2, FR-012)', () => {
    it('Then: 在庫不足エラーをスローする', async () => {
      const product = createMockProduct({ stock: 3 });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);

      await expect(
        updateCartItem({ productId: product.id, quantity: 4 }, context)
      ).rejects.toThrow('在庫不足');
    });
  });

  describe('Given: admin ロール', () => {
    it('Then: 認証エラーをスローする', async () => {
      const adminContext: CartContext = {
        ...context,
        session: createMockSession('admin'),
      };
      await expect(
        updateCartItem({ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }, adminContext)
      ).rejects.toThrow();
    });
  });
});
