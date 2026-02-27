/** Products US4 - updateProductStatus 単体テスト (AC-1〜AC-3, FR-014〜FR-015) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProductStatus, type ProductsContext } from '@/domains/products/api';
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
    status: 'draft',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('updateProductStatus (ステータス変更)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: draft → published の遷移 (AC-1, FR-014〜FR-015)', () => {
    it('Then: status="published" で商品を返す', async () => {
      const original = makeProduct({ status: 'draft' });
      const updated = makeProduct({ status: 'published' });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.updateStatus).mockResolvedValue(updated);

      const result = await updateProductStatus(
        { id: '550e8400-e29b-41d4-a716-446655440000', status: 'published' },
        context,
      );

      expect(result.status).toBe('published');
      expect(vi.mocked(repository.updateStatus)).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'published',
      );
    });
  });

  describe('Given: published → archived の遷移 (AC-2, FR-015)', () => {
    it('Then: status="archived" で商品を返す', async () => {
      const original = makeProduct({ status: 'published' });
      const updated = makeProduct({ status: 'archived' });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.updateStatus).mockResolvedValue(updated);

      const result = await updateProductStatus(
        { id: '550e8400-e29b-41d4-a716-446655440000', status: 'archived' },
        context,
      );

      expect(result.status).toBe('archived');
    });
  });

  describe('Given: archived → draft の遷移 (AC-3, FR-015)', () => {
    it('Then: status="draft" で商品を返す（すべての遷移が許可）', async () => {
      const original = makeProduct({ status: 'archived' });
      const updated = makeProduct({ status: 'draft' });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.updateStatus).mockResolvedValue(updated);

      const result = await updateProductStatus(
        { id: '550e8400-e29b-41d4-a716-446655440000', status: 'draft' },
        context,
      );

      expect(result.status).toBe('draft');
    });
  });

  describe('Given: 存在しない商品ID', () => {
    it('Then: NotFoundError がスローされる', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        updateProductStatus(
          { id: '550e8400-e29b-41d4-a716-446655440099', status: 'published' },
          context,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: buyer としてログイン済み', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        updateProductStatus(
          { id: '550e8400-e29b-41d4-a716-446655440000', status: 'published' },
          context,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
