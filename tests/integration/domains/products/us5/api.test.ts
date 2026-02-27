/** Products US5 - deleteProduct API 統合テスト (FR-013) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteProduct, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import {
  DeleteProductOutputSchema,
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

describe('Products US5 API 統合テスト', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('deleteProduct - 出力スキーマ整合 (FR-013)', () => {
    it('DeleteProductOutputSchema に準拠したレスポンスを返す', async () => {
      const product = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E2Eテスト商品',
        price: 3000,
        stock: 10,
        status: 'published',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(repository.findById).mockResolvedValue(product);
      vi.mocked(repository.delete).mockResolvedValue(undefined);

      const result = await deleteProduct(
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        context,
      );

      expect(() => DeleteProductOutputSchema.parse(result)).not.toThrow();
      const validated = DeleteProductOutputSchema.parse(result);
      expect(validated.success).toBe(true);
    });
  });
});
