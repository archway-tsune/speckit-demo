/** Products US3 - getAdminProductById / updateProduct API 統合テスト (FR-010〜FR-012) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminProductById, updateProduct, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import {
  GetAdminProductByIdOutputSchema,
  UpdateProductOutputSchema,
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

describe('Products US3 API 統合テスト', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('getAdminProductById - 出力スキーマ整合 (FR-010)', () => {
    it('GetAdminProductByIdOutputSchema に準拠したレスポンスを返す', async () => {
      const product = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E2Eテスト商品',
        price: 3000,
        description: 'E2Eテスト用のデモ商品です。',
        imageUrl: 'https://picsum.photos/seed/e2e/400/400',
        stock: 10,
        status: 'published',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getAdminProductById(
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        context,
      );

      expect(() => GetAdminProductByIdOutputSchema.parse(result)).not.toThrow();
      const validated = GetAdminProductByIdOutputSchema.parse(result);
      expect(validated.name).toBe('E2Eテスト商品');
    });
  });

  describe('updateProduct - 出力スキーマ整合 (FR-011)', () => {
    it('UpdateProductOutputSchema に準拠したレスポンスを返す（更新後の商品）', async () => {
      const original = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E2Eテスト商品',
        price: 3000,
        stock: 10,
        status: 'published',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      const updated = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '更新後の商品名',
        price: 3000,
        stock: 10,
        status: 'published',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await updateProduct(
        { id: '550e8400-e29b-41d4-a716-446655440000', name: '更新後の商品名' },
        context,
      );

      expect(() => UpdateProductOutputSchema.parse(result)).not.toThrow();
      const validated = UpdateProductOutputSchema.parse(result);
      expect(validated.name).toBe('更新後の商品名');
    });
  });
});
