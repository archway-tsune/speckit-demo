/** Products US5 - deleteProduct 単体テスト (AC-1〜AC-3, FR-013) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteProduct, type ProductsContext } from '@/domains/products/api';
import type { ProductCommandRepository } from '@/contracts/products';
import { ProductSchema } from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';
import { ForbiddenError } from '@/foundation/auth/authorize';
import { NotFoundError } from '@/foundation/errors/domain-errors';

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

function makeProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('deleteProduct (商品削除)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: admin として有効な ID を指定 (AC-1, FR-013)', () => {
    it('Then: { success: true } を返す', async () => {
      const product = makeProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);
      vi.mocked(repository.delete).mockResolvedValue(undefined);

      const result = await deleteProduct(
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        context,
      );

      expect(result).toEqual({ success: true });
      expect(vi.mocked(repository.delete)).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });
  });

  describe('Given: 存在しない商品 ID (AC-3)', () => {
    it('Then: NotFoundError がスローされる', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        deleteProduct({ id: '550e8400-e29b-41d4-a716-446655440099' }, context),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: buyer としてログイン済み (AC-2)', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        deleteProduct({ id: '550e8400-e29b-41d4-a716-446655440000' }, context),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
