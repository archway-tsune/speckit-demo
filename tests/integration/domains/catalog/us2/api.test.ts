/** Catalog US2 - getProductById API 統合テスト (AC-1,2) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProductById, type CatalogContext } from '@/domains/catalog/api';
import {
  GetProductByIdInputSchema,
  GetProductByIdOutputSchema,
  ProductSchema,
  type ProductRepository,
} from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440001',
    name: overrides.name ?? 'ミニマルTシャツ',
    price: 4980,
    description: 'テスト説明',
    imageUrl: overrides.imageUrl ?? 'https://picsum.photos/seed/tshirt/400/400',
    stock: overrides.stock ?? 50,
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
    count: vi.fn(),
  };
}

describe('Catalog US2 API 統合テスト', () => {
  let repository: ProductRepository;
  let context: CatalogContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('buyer'), repository };
  });

  describe('getProductById - 入力スキーマ整合 (AC-1)', () => {
    it('GetProductByIdInputSchema で parse した入力を処理できる', async () => {
      const product = createMockProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);
      const validatedInput = GetProductByIdInputSchema.parse({ id: product.id });

      const result = await getProductById(validatedInput, context);

      expect(result.id).toBe(product.id);
    });
  });

  describe('getProductById - 出力スキーマ整合 (AC-1)', () => {
    it('GetProductByIdOutputSchema に準拠したレスポンスを返す（stock フィールドあり）', async () => {
      const product = createMockProduct({ stock: 5 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById({ id: product.id }, context);

      expect(() => GetProductByIdOutputSchema.parse(result)).not.toThrow();
      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.stock).toBe(5);
    });
  });

  describe('getProductById - 404 応答 (AC-2)', () => {
    it('存在しない商品IDで NotFoundError がスローされる', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getProductById({ id: '550e8400-e29b-41d4-a716-446655440999' }, context)
      ).rejects.toThrow('商品が見つかりません');
    });
  });
});
