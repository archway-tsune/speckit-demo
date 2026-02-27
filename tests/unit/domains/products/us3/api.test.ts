/** Products US3 - getAdminProductById / updateProduct 単体テスト (AC-1〜AC-5, FR-010〜FR-012) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminProductById, updateProduct, type ProductsContext } from '@/domains/products/api';
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
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://picsum.photos/seed/e2e/400/400',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('getAdminProductById (商品詳細取得)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: 有効な商品ID (AC-1, FR-010)', () => {
    it('Then: 全フィールドを含む商品を返す', async () => {
      const product = makeProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getAdminProductById(
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        context,
      );

      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.name).toBe('E2Eテスト商品');
      expect(result.price).toBe(3000);
      expect(result.description).toBe('E2Eテスト用のデモ商品です。');
      expect(result.stock).toBe(10);
    });
  });

  describe('Given: 存在しない商品ID (AC-4, FR-012)', () => {
    it('Then: NotFoundError がスローされる', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getAdminProductById({ id: '550e8400-e29b-41d4-a716-446655440099' }, context),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: buyer としてログイン済み', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        getAdminProductById({ id: '550e8400-e29b-41d4-a716-446655440000' }, context),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

describe('updateProduct (商品更新)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: 商品名を変更する更新 (AC-2, FR-010〜FR-011)', () => {
    it('Then: 更新後の商品を返す', async () => {
      const original = makeProduct();
      const updated = makeProduct({ name: '更新後の商品名' });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await updateProduct(
        { id: '550e8400-e29b-41d4-a716-446655440000', name: '更新後の商品名' },
        context,
      );

      expect(result.name).toBe('更新後の商品名');
      expect(vi.mocked(repository.update)).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        expect.objectContaining({ name: '更新後の商品名' }),
      );
    });
  });

  describe('Given: 説明のみ変更する部分更新 (AC-3, FR-011)', () => {
    it('Then: description のみを含むパッチで update を呼ぶ', async () => {
      const original = makeProduct();
      const updated = makeProduct({ description: '新しい説明' });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.update).mockResolvedValue(updated);

      await updateProduct(
        { id: '550e8400-e29b-41d4-a716-446655440000', description: '新しい説明' },
        context,
      );

      const updateCall = vi.mocked(repository.update).mock.calls[0];
      expect(updateCall[1]).toHaveProperty('description', '新しい説明');
      expect(updateCall[1]).not.toHaveProperty('name');
      expect(updateCall[1]).not.toHaveProperty('price');
    });
  });

  describe('Given: 存在しない商品ID (AC-4, FR-012)', () => {
    it('Then: NotFoundError がスローされる', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        updateProduct(
          { id: '550e8400-e29b-41d4-a716-446655440099', name: '更新商品' },
          context,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Given: buyer としてログイン済み', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        updateProduct(
          { id: '550e8400-e29b-41d4-a716-446655440000', name: '更新商品' },
          context,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
