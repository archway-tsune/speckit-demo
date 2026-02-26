/** Catalog US3 - getProducts 検索ユースケース単体テスト (AC-1,2,3, FR-011,012,013) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, type CatalogContext } from '@/domains/catalog/api';
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

describe('getProducts (検索)', () => {
  let repository: ProductRepository;
  let context: CatalogContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('buyer'), repository };
  });

  describe('Given: q="Tシャツ" で検索 (AC-1, FR-011)', () => {
    it('Then: query="Tシャツ" でリポジトリが呼ばれる', async () => {
      const product = createMockProduct();
      vi.mocked(repository.findAll).mockResolvedValue([product]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts({ q: 'Tシャツ' }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Tシャツ' })
      );
      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('Given: q="xyznotexist" で検索（該当なし）(AC-2, FR-012)', () => {
    it('Then: 空配列と total=0 を返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getProducts({ q: 'xyznotexist' }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'xyznotexist' })
      );
      expect(result.products).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('Given: q="" で検索クリア (AC-3, FR-013)', () => {
    it('Then: query が空文字または undefined でリポジトリが呼ばれる', async () => {
      const products = [createMockProduct()];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(1);

      await getProducts({ q: '' }, context);

      const callArgs = vi.mocked(repository.findAll).mock.calls[0][0];
      expect(callArgs.query === '' || callArgs.query === undefined).toBe(true);
    });
  });
});
