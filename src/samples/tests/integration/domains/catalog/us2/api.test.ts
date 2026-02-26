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

  describe('createProduct', () => {
    it('入力スキーマのバリデーションメッセージを返す', () => {
      const parseResult = CreateProductInputSchema.safeParse({ name: '', price: 1000 });
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toBe('商品名を入力してください');
      }
    });

    it('出力スキーマに準拠した商品を返す', async () => {
      vi.mocked(repository.create).mockResolvedValue(createMockProduct());
      const result = await createProduct({ name: 'テスト商品', price: 1000 }, { session: createMockSession('admin'), repository });
      const validated = CreateProductOutputSchema.parse(result);
      expect(validated.name).toBe('テスト商品');
    });
  });

  describe('エンドツーエンドフロー', () => {
    it('商品登録 → 一覧確認 の流れが正常に動作する', async () => {
      const newProduct = createMockProduct();
      vi.mocked(repository.create).mockResolvedValue(newProduct);
      vi.mocked(repository.findAll).mockResolvedValue([newProduct]);
      vi.mocked(repository.count).mockResolvedValue(1);
      const created = await createProduct({ name: 'テスト商品', price: 1000 }, { session: createMockSession('admin'), repository });
      expect(created.name).toBe('テスト商品');
      const listResult = await getProducts({ page: 1, limit: 20 }, { session: createMockSession('admin'), repository });
      expect(listResult.products).toHaveLength(1);
      expect(listResult.products[0].id).toBe(created.id);
    });
  });

  describe('認可フロー', () => {
    it('adminは全ステータスの商品を取得できる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);
      await getProducts({ page: 1, limit: 20, status: 'draft' }, { session: createMockSession('admin'), repository });
      expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
    });
  });
});
