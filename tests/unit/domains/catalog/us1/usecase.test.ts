/** Catalog US1 - getProducts ユースケース単体テスト (AC-1,2,3,4,5, FR-001,003,004,005) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, type CatalogContext } from '@/domains/catalog/api';
import { ProductSchema, type ProductRepository } from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Partial<{ id: string; name: string; stock: number; status: string; imageUrl: string }> = {}) {
  return ProductSchema.parse({
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440001',
    name: overrides.name ?? 'テスト商品',
    price: 4980,
    description: 'テスト説明文',
    imageUrl: overrides.imageUrl ?? 'https://picsum.photos/seed/test/400/400',
    stock: overrides.stock ?? 10,
    status: overrides.status ?? 'published',
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

describe('getProducts', () => {
  let repository: ProductRepository;
  let context: CatalogContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('buyer'), repository };
  });

  describe('Given: buyer セッション', () => {
    describe('When: 商品一覧を取得する (AC-1)', () => {
      it('Then: published 商品のみを返す', async () => {
        const publishedProduct = createMockProduct({ status: 'published' });
        vi.mocked(repository.findAll).mockResolvedValue([publishedProduct]);
        vi.mocked(repository.count).mockResolvedValue(1);

        await getProducts({ page: 1, limit: 12 }, context);

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
      });

      it('Then: ページネーション情報を返す (AC-2, FR-001)', async () => {
        const products = Array.from({ length: 12 }, (_, i) =>
          createMockProduct({ id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}` })
        );
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(15);

        const result = await getProducts({ page: 1, limit: 12 }, context);

        expect(result.products).toHaveLength(12);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(12);
        expect(result.pagination.total).toBe(15);
        expect(result.pagination.totalPages).toBe(2);
      });

      it('Then: 2ページ目を取得できる (AC-2)', async () => {
        const products = Array.from({ length: 3 }, (_, i) =>
          createMockProduct({ id: `550e8400-e29b-41d4-a716-44665544${String(i + 12).padStart(4, '0')}` })
        );
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(15);

        const result = await getProducts({ page: 2, limit: 12 }, context);

        expect(result.products).toHaveLength(3);
        expect(result.pagination.page).toBe(2);
        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 12, limit: 12 })
        );
      });

      it('Then: stock=0 の商品もリストに含まれる (AC-3, FR-004)', async () => {
        const outOfStockProduct = createMockProduct({ stock: 0, name: '在庫切れ商品' });
        vi.mocked(repository.findAll).mockResolvedValue([outOfStockProduct]);
        vi.mocked(repository.count).mockResolvedValue(1);

        const result = await getProducts({ page: 1, limit: 12 }, context);

        expect(result.products).toHaveLength(1);
        expect(result.products[0].stock).toBe(0);
      });

      it('Then: 商品が0件の場合は空配列を返す (AC-5, FR-005)', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        const result = await getProducts({ page: 1, limit: 12 }, context);

        expect(result.products).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
      });
    });
  });

  describe('Given: buyer が draft フィルタを指定 (FR-003)', () => {
    it('Then: status は published に強制上書きされる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts({ page: 1, limit: 12, status: 'draft' }, context);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
    });
  });
});
