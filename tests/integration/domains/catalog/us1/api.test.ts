/** Catalog US1 - getProducts API 統合テスト (AC-1,2) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, type CatalogContext } from '@/domains/catalog/api';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  ProductSchema,
  type ProductRepository,
} from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440001',
    name: overrides.name ?? 'テスト商品',
    price: 4980,
    description: 'テスト説明',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
    stock: overrides.stock ?? 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });
}

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
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

describe('Catalog US1 API 統合テスト', () => {
  let repository: ProductRepository;
  let context: CatalogContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('buyer'), repository };
  });

  describe('getProducts - 入力スキーマ整合 (AC-1)', () => {
    it('GetProductsInputSchema で parse した入力を処理できる', async () => {
      const validatedInput = GetProductsInputSchema.parse({ page: '1', limit: '12' });
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(validatedInput, context);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(12);
    });

    it('buyer ロールは published ステータスに強制される', async () => {
      const validatedInput = GetProductsInputSchema.parse({ page: '1', limit: '12' });
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(validatedInput, context);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
    });
  });

  describe('getProducts - 出力スキーマ整合 (AC-2)', () => {
    it('GetProductsOutputSchema に準拠したレスポンスを返す', async () => {
      const products = [createMockProduct(), createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品2' })];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);

      const result = await getProducts({ page: 1, limit: 12 }, context);

      expect(() => GetProductsOutputSchema.parse(result)).not.toThrow();
      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(2);
      expect(validated.pagination.total).toBe(2);
    });

    it('各商品が stock フィールドを含む', async () => {
      const product = createMockProduct({ stock: 5 });
      vi.mocked(repository.findAll).mockResolvedValue([product]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts({ page: 1, limit: 12 }, context);

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products[0].stock).toBe(5);
    });
  });
});
