/** Products US4 - updateProductStatus API 統合テスト (FR-014〜FR-015) */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProductStatus, type ProductsContext } from '@/domains/products/api';
import { ProductSchema } from '@/contracts/catalog';
import {
  UpdateProductStatusOutputSchema,
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

describe('Products US4 API 統合テスト', () => {
  let repository: ProductCommandRepository;
  let context: ProductsContext;

  beforeEach(() => {
    repository = createMockRepository();
    context = { session: createMockSession('admin'), repository };
  });

  describe('updateProductStatus - 出力スキーマ整合 (FR-014〜FR-015)', () => {
    it('UpdateProductStatusOutputSchema に準拠したレスポンスを返す（status が指定値）', async () => {
      const original = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E2Eテスト商品',
        price: 3000,
        stock: 10,
        status: 'draft',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
      const updated = ProductSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E2Eテスト商品',
        price: 3000,
        stock: 10,
        status: 'published',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
      vi.mocked(repository.findById).mockResolvedValue(original);
      vi.mocked(repository.updateStatus).mockResolvedValue(updated);

      const result = await updateProductStatus(
        { id: '550e8400-e29b-41d4-a716-446655440000', status: 'published' },
        context,
      );

      expect(() => UpdateProductStatusOutputSchema.parse(result)).not.toThrow();
      const validated = UpdateProductStatusOutputSchema.parse(result);
      expect(validated.status).toBe('published');
    });
  });
});
