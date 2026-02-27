/** Cart US1 - addToCart ユースケース単体テスト (AC-1,2,3,5 / FR-001,002,003,007) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToCart, type CartContext } from '@/domains/cart/api';
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
    stock: 10,
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
  return {
    findById: vi.fn(),
  };
}

describe('addToCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  let context: CartContext;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
    context = { session: createMockSession('buyer'), repository, productFetcher };
  });

  describe('Given: ログイン済み購入者が在庫あり商品を追加 (AC-1, FR-001)', () => {
    it('Then: 商品がカートに追加されカートを返す', async () => {
      const product = createMockProduct();
      const expectedCart = createMockCart({ itemCount: 1, subtotal: product.price });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.findByUserId).mockResolvedValue(null);
      vi.mocked(repository.addItem).mockResolvedValue(expectedCart);

      const result = await addToCart({ productId: product.id, quantity: 1 }, context);

      expect(vi.mocked(productFetcher.findById)).toHaveBeenCalledWith(product.id);
      expect(vi.mocked(repository.addItem)).toHaveBeenCalled();
      expect(result.itemCount).toBe(1);
    });
  });

  describe('Given: 同一商品がカートに1点ある状態で再追加 (AC-2, FR-002)', () => {
    it('Then: addItem が呼ばれ数量が増加する', async () => {
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
      const expectedCart = createMockCart({ itemCount: 2, subtotal: product.price * 2 });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
      vi.mocked(repository.addItem).mockResolvedValue(expectedCart);

      const result = await addToCart({ productId: product.id, quantity: 1 }, context);

      expect(result.itemCount).toBe(2);
    });
  });

  describe('Given: カート内数量が在庫数と同じ (AC-3, FR-003)', () => {
    it('Then: 在庫不足エラーをスローする', async () => {
      const product = createMockProduct({ stock: 2 });
      const existingCart = createMockCart({
        items: [{
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 2,
          addedAt: new Date(),
        }],
        itemCount: 2,
        subtotal: product.price * 2,
      });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);

      await expect(
        addToCart({ productId: product.id, quantity: 1 }, context)
      ).rejects.toThrow('在庫不足');
    });
  });

  describe('Given: 未認証ユーザー (AC-5, FR-007)', () => {
    it('Then: 認証エラーをスローする', async () => {
      const adminContext: CartContext = {
        ...context,
        session: createMockSession('admin'),
      };

      await expect(
        addToCart({ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }, adminContext)
      ).rejects.toThrow();
    });
  });

  describe('Given: 存在しない商品ID', () => {
    it('Then: 商品が見つかりませんエラーをスローする', async () => {
      vi.mocked(productFetcher.findById).mockResolvedValue(null);

      await expect(
        addToCart({ productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 1 }, context)
      ).rejects.toThrow('商品が見つかりません');
    });
  });
});
