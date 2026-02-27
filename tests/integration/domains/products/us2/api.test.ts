/** Products US2 - createProduct API 統合テスト (FR-008) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import {
  CreateProductInputSchema,
  CreateProductOutputSchema,
  type ProductCommandRepository,
} from '@/contracts/products';
import type { SessionData } from '@/foundation/auth/session';

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

describe('Products US2 API 統合テスト', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('createProduct - 入力スキーマ整合 (FR-008)', () => {
    it('CreateProductInputSchema で parse した入力を処理できる', async () => {
      const validatedInput = CreateProductInputSchema.parse({
        name: 'テスト商品',
        price: '3000',
      });
      const created = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440099',
        name: 'テスト商品',
        price: 3000,
        stock: 0,
        status: 'draft',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(repository.create).mockResolvedValue(created);

      const result = await createProduct(validatedInput, context);

      expect(result.name).toBe('テスト商品');
      expect(result.price).toBe(3000);
    });
  });

  describe('createProduct - 出力スキーマ整合 (FR-008)', () => {
    it('CreateProductOutputSchema に準拠したレスポンスを返す（status が draft）', async () => {
      const created = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440099',
        name: 'テスト商品',
        price: 3000,
        stock: 0,
        status: 'draft',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(repository.create).mockResolvedValue(created);

      const result = await createProduct({ name: 'テスト商品', price: 3000 }, context);

      expect(() => CreateProductOutputSchema.parse(result)).not.toThrow();
      const validated = CreateProductOutputSchema.parse(result);
      expect(validated.status).toBe('draft');
    });
  });
});
