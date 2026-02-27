/** Products US2 - createProduct ユースケース単体テスト (AC-1〜AC-6, FR-006〜FR-008) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct, type ProductsContext } from '@/domains/products/api';
import type { ProductCommandRepository } from '@/contracts/products';
import { ProductSchema } from '@/contracts/catalog';
import type { SessionData } from '@/foundation/auth/session';
import { ForbiddenError } from '@/foundation/auth/authorize';

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

function makeCreatedProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440099',
    name: 'テスト新商品',
    price: 3000,
    stock: 0,
    status: 'draft',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('createProduct (商品新規登録)', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('Given: 有効な入力（名前と価格）(AC-1, FR-006〜FR-008)', () => {
    it('Then: status="draft" で商品を作成してリターンする', async () => {
      const created = makeCreatedProduct({ status: 'draft', stock: 0 });
      vi.mocked(repository.create).mockResolvedValue(created);

      const result = await createProduct({ name: 'テスト新商品', price: 3000 }, context);

      expect(result.status).toBe('draft');
      expect(result.name).toBe('テスト新商品');
      expect(vi.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'テスト新商品', price: 3000, status: 'draft' })
      );
    });

    it('Then: stock 未指定のとき stock=0 で作成される (FR-008)', async () => {
      const created = makeCreatedProduct({ stock: 0 });
      vi.mocked(repository.create).mockResolvedValue(created);

      await createProduct({ name: 'テスト新商品', price: 3000 }, context);

      expect(vi.mocked(repository.create)).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 0 })
      );
    });
  });

  describe('Given: 商品名が空欄 (AC-2)', () => {
    it('Then: バリデーションエラーがスローされる', async () => {
      await expect(
        createProduct({ name: '', price: 3000 }, context)
      ).rejects.toThrow('入力内容に誤りがあります');
    });
  });

  describe('Given: 商品名が201文字以上 (AC-3)', () => {
    it('Then: バリデーションエラーがスローされる', async () => {
      const longName = 'あ'.repeat(201);
      await expect(
        createProduct({ name: longName, price: 3000 }, context)
      ).rejects.toThrow('入力内容に誤りがあります');
    });
  });

  describe('Given: 価格が負の値 (AC-5)', () => {
    it('Then: バリデーションエラーがスローされる', async () => {
      await expect(
        createProduct({ name: 'テスト商品', price: -1 }, context)
      ).rejects.toThrow('入力内容に誤りがあります');
    });
  });

  describe('Given: 画像URLが無効な形式 (AC-6)', () => {
    it('Then: バリデーションエラーがスローされる', async () => {
      await expect(
        createProduct({ name: 'テスト商品', price: 3000, imageUrl: 'not-a-url' }, context)
      ).rejects.toThrow('入力内容に誤りがあります');
    });
  });

  describe('Given: buyer としてログイン済み', () => {
    it('Then: ForbiddenError がスローされる', async () => {
      context = { session: createMockSession('buyer'), repository };

      await expect(
        createProduct({ name: 'テスト商品', price: 3000 }, context)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
