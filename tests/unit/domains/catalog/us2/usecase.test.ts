/** Catalog US2 - getProductById ユースケース単体テスト (AC-1,2,3,4, FR-006,007,008,009,010) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProductById, type CatalogContext } from '@/domains/catalog/api';
import { ProductSchema, type ProductRepository } from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。',
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockRepository(): ProductRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

describe('getProductById', () => {
  let repository: ProductRepository;
  let context: CatalogContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('buyer'), repository };
  });

  describe('Given: 存在する published 商品ID (AC-1, FR-006)', () => {
    it('Then: 商品情報（stock含む）を返す', async () => {
      const product = createMockProduct({ stock: 50 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById({ id: product.id }, context);

      expect(result.id).toBe(product.id);
      expect(result.name).toBe('ミニマルTシャツ');
      expect(result.stock).toBe(50);
      expect(result.description).toBe('シンプルで上質なコットン100%のTシャツ。');
    });
  });

  describe('Given: stock=0 の商品 (AC-2, FR-007)', () => {
    it('Then: stock=0 の商品も返す（在庫切れ状態で返す）', async () => {
      const product = createMockProduct({ stock: 0 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById({ id: product.id }, context);

      expect(result.stock).toBe(0);
    });
  });

  describe('Given: imageUrl が未設定の商品 (AC-3, FR-009)', () => {
    it('Then: imageUrl なしで商品を返す', async () => {
      const product = createMockProduct({ imageUrl: undefined });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById({ id: product.id }, context);

      expect(result.imageUrl).toBeUndefined();
    });
  });

  describe('Given: 存在しない商品ID (FR-010)', () => {
    it('Then: NotFoundError をスローする', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getProductById({ id: '550e8400-e29b-41d4-a716-446655440999' }, context)
      ).rejects.toThrow('商品が見つかりません');
    });
  });

  describe('Given: draft 商品を buyer が取得 (FR-006)', () => {
    it('Then: NotFoundError をスローする', async () => {
      const draftProduct = createMockProduct({ status: 'draft' });
      vi.mocked(repository.findById).mockResolvedValue(draftProduct);

      await expect(
        getProductById({ id: draftProduct.id }, context)
      ).rejects.toThrow('商品が見つかりません');
    });
  });
});
