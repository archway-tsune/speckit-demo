/** Products US1 - getAdminProducts API 統合テスト (FR-004, FR-005) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminProducts, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import {
  GetAdminProductsInputSchema,
  GetAdminProductsOutputSchema,
  type ProductCommandRepository,
} from '@/contracts/products';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440001',
    name: overrides.name ?? 'テスト商品',
    price: 4980,
    description: 'テスト説明',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
    stock: overrides.stock ?? 10,
    status: overrides.status ?? 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });
}

function createMockSession(role: 'buyer' | 'admin' = 'admin'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
  };
}

function createMockRepository(): ProductCommandRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };
}

describe('Products US1 API 統合テスト', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('getAdminProducts - 入力スキーマ整合 (FR-004)', () => {
    it('GetAdminProductsInputSchema で parse した入力を処理できる', async () => {
      const validatedInput = GetAdminProductsInputSchema.parse({ page: '1', limit: '20' });
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getAdminProducts(validatedInput, context);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });
  });

  describe('getAdminProducts - 出力スキーマ整合 (FR-005)', () => {
    it('GetAdminProductsOutputSchema に準拠したレスポンスを返す（draft 商品を含む）', async () => {
      const draftProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', status: 'draft' });
      const publishedProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', status: 'published' });
      vi.mocked(repository.findAll).mockResolvedValue([draftProduct, publishedProduct]);
      vi.mocked(repository.count).mockResolvedValue(2);

      const result = await getAdminProducts({ page: 1, limit: 20 }, context);

      expect(() => GetAdminProductsOutputSchema.parse(result)).not.toThrow();
      const validated = GetAdminProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(2);
      expect(validated.products.some((p) => p.status === 'draft')).toBe(true);
      expect(validated.pagination.total).toBe(2);
    });

    it('各商品が stock フィールドを含む', async () => {
      const product = createMockProduct({ stock: 5 });
      vi.mocked(repository.findAll).mockResolvedValue([product]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getAdminProducts({ page: 1, limit: 20 }, context);

      const validated = GetAdminProductsOutputSchema.parse(result);
      expect(validated.products[0].stock).toBe(5);
    });
  });
});
