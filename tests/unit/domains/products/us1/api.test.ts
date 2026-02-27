/** Products US1 - getAdminProducts ユースケース単体テスト (AC-5, AC-6, FR-001〜FR-005) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminProducts, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import type { ProductCommandRepository } from '@/contracts/products';
import { ForbiddenError } from '@/foundation/auth/authorize';
import type { SessionData } from '@/foundation/auth/session';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'テスト商品',
    price: 4980,
    description: 'テスト説明',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
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

describe('getAdminProducts (管理者商品一覧)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: admin としてログイン済み (FR-001〜FR-003)', () => {
    it('Then: 全ステータス（draft 含む）の商品を取得できる', async () => {
      const draftProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', status: 'draft' });
      const publishedProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', status: 'published' });
      vi.mocked(repository.findAll).mockResolvedValue([draftProduct, publishedProduct]);
      vi.mocked(repository.count).mockResolvedValue(2);

      const result = await getAdminProducts({ page: 1, limit: 20 }, context);

      expect(result.products).toHaveLength(2);
      expect(result.products.some((p) => p.status === 'draft')).toBe(true);
    });

    it('Then: status フィルタなしでリポジトリが呼ばれる（全ステータス取得）', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getAdminProducts({ page: 1, limit: 20 }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.not.objectContaining({ status: 'published' })
      );
    });
  });

  describe('Given: admin がステータスフィルタを指定 (FR-002)', () => {
    it('Then: 指定ステータスでリポジトリが呼ばれる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getAdminProducts({ page: 1, limit: 20, status: 'draft' }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      );
    });
  });

  describe('Given: ページネーションパラメータ (FR-003, FR-004)', () => {
    it('Then: page=2, limit=20 で offset=20 としてリポジトリが呼ばれる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(25);

      const result = await getAdminProducts({ page: 2, limit: 20 }, context);

      expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20, limit: 20 })
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('Then: total=0 のとき totalPages=0 を返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getAdminProducts({ page: 1, limit: 20 }, context);

      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('Given: buyer としてログイン済み (AC-5)', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        getAdminProducts({ page: 1, limit: 20 }, context)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
