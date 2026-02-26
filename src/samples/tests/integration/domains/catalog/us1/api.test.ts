/** Catalog ドメイン - API統合テスト: 契約スキーマとの整合性検証 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetProductsInputSchema, GetProductsOutputSchema, GetProductByIdOutputSchema,
  CreateProductInputSchema, CreateProductOutputSchema,
} from '@/samples/contracts/catalog';
import { getProducts, getProductById, createProduct, type ProductRepository } from '@/samples/domains/catalog/api';
import { createMockSession, createMockProduct, createMockProductRepository } from '@/samples/tests/helpers';

describe('Catalog API統合テスト', () => {
  let repository: ProductRepository;
  beforeEach(() => { repository = createMockProductRepository(); });

  describe('getProducts', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const validatedInput = GetProductsInputSchema.parse({ page: '2', limit: '10' });
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);
      const result = await getProducts(validatedInput, { session: createMockSession(), repository });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);
      const result = await getProducts({ page: 1, limit: 20 }, { session: createMockSession(), repository });
      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });

    it('クエリパラメータからの変換を正しく処理する', async () => {
      const validatedInput = GetProductsInputSchema.parse({ page: '3', limit: '50', status: 'published' });
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);
      const result = await getProducts(validatedInput, { session: createMockSession('admin'), repository });
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(50);
    });
  });

  describe('getProductById', () => {
    it('出力スキーマに準拠した商品を返す', async () => {
      const product = createMockProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);
      const result = await getProductById({ id: product.id }, { session: createMockSession(), repository });
      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.id).toBe(product.id);
      expect(validated.name).toBe('テスト商品');
    });
  });

  describe('エンドツーエンドフロー', () => {
    it('商品一覧取得 → 詳細取得 の流れが正常に動作する', async () => {
      const products = [
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
      ];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);
      vi.mocked(repository.findById).mockResolvedValue(products[0]);
      const listResult = await getProducts({ page: 1, limit: 20 }, { session: createMockSession(), repository });
      expect(listResult.products).toHaveLength(2);
      const detailResult = await getProductById({ id: listResult.products[0].id }, { session: createMockSession(), repository });
      expect(detailResult.name).toBe('商品A');
    });
  });

  describe('認可フロー', () => {
    it('buyerはpublished商品のみ取得できる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);
      await getProducts({ page: 1, limit: 20, status: 'draft' }, { session: createMockSession('buyer'), repository });
      expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
    });
  });
});
