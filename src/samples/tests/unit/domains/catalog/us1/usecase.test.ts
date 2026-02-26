/** Catalog ドメイン - ユースケース単体テスト */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorizationError } from '@/foundation/auth/authorize';
import { ValidationError } from '@/foundation/validation/runtime';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, type ProductRepository } from '@/samples/domains/catalog/api';
import { createMockSession, createMockProduct, createMockProductRepository } from '@/samples/tests/helpers';

describe('getProducts', () => {
  let repository: ProductRepository;
  beforeEach(() => { repository = createMockProductRepository(); });

  describe('Given: 認証済みユーザー', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: ページネーション付きで商品リストを返す', async () => {
        const products = [createMockProduct(), createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品2' })];
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(2);
        const result = await getProducts({ page: 1, limit: 20 }, { session: createMockSession(), repository });
        expect(result.products).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
      });

      it('Then: デフォルトでpublished商品のみを返す（buyer）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);
        await getProducts({ page: 1, limit: 20 }, { session: createMockSession('buyer'), repository });
        expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
      });
    });
  });
});

describe('getProductById', () => {
  let repository: ProductRepository;
  beforeEach(() => { repository = createMockProductRepository(); });

  describe('Given: 存在する商品ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: 商品情報を返す', async () => {
        const product = createMockProduct();
        vi.mocked(repository.findById).mockResolvedValue(product);
        const result = await getProductById({ id: product.id }, { session: createMockSession(), repository });
        expect(result.id).toBe(product.id);
        expect(result.name).toBe('テスト商品');
      });
    });
  });

  describe('Given: 存在しない商品ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);
        await expect(
          getProductById({ id: '550e8400-e29b-41d4-a716-446655440999' }, { session: createMockSession(), repository })
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });
});
