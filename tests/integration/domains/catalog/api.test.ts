/**
 * Catalog ドメイン - API 統合テスト（本番）
 * US1: 商品一覧表示
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  GetProductByIdOutputSchema,
  ProductSchema,
  type Product,
  type ProductRepository,
} from '@/contracts/catalog';
import { getProducts, getProductById, NotFoundError } from '@/domains/catalog/api/usecases';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: 'user-123',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: '商品の説明',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });
}

function createMockRepository(): ProductRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────
// US1: GET /api/catalog/products 統合テスト
// ─────────────────────────────────────────────────────────────────

describe('Catalog API 統合テスト - US1: 商品一覧', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('GET /api/catalog/products', () => {
    it('200 レスポンスで products 配列と pagination を返す', async () => {
      const products = [
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
      ];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      // 出力スキーマで検証
      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(2);
      expect(validated.pagination.total).toBe(2);
      expect(validated.pagination.page).toBe(1);
      expect(validated.pagination.limit).toBe(12);
    });

    it('page/limit パラメータが正しく動作する', async () => {
      // URL パラメータをシミュレート（文字列）
      const rawInput = { page: '2', limit: '12' };
      const validatedInput = GetProductsInputSchema.parse(rawInput);

      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(25);

      const result = await getProducts(validatedInput, {
        session: createMockSession(),
        repository,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(12);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('認証なしで published 商品のみ返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      // buyer セッション（未ログイン時のデフォルト）
      await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession('buyer'), repository }
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      const products = Array.from({ length: 12 }, (_, i) =>
        createMockProduct({
          id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
          name: `商品${i + 1}`,
          stock: i === 0 ? 0 : 10, // 1件は在庫切れ
        })
      );
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(25);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      // 出力スキーマでバリデーション
      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(12);
      // stock フィールドが含まれていることを確認
      expect(validated.products[0].stock).toBe(0);
      expect(validated.products[1].stock).toBe(10);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: GET /api/catalog/products/:id 統合テスト
// ─────────────────────────────────────────────────────────────────

describe('Catalog API 統合テスト - US2: 商品詳細', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('GET /api/catalog/products/:id', () => {
    it('200 で商品データを返す', async () => {
      const product = createMockProduct({ stock: 15 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession('buyer'), repository }
      );

      // 出力スキーマで検証
      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.id).toBe(product.id);
      expect(validated.name).toBe('テスト商品');
      expect(validated.stock).toBe(15);
    });

    it('存在しない ID で NotFoundError', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getProductById(
          { id: '550e8400-e29b-41d4-a716-446655440099' },
          { session: createMockSession('buyer'), repository }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('認証なしで published 商品のみ取得可能', async () => {
      const draftProduct = createMockProduct({ status: 'draft' });
      vi.mocked(repository.findById).mockResolvedValue(draftProduct);

      // buyer が draft 商品にアクセスすると NotFoundError
      await expect(
        getProductById(
          { id: draftProduct.id },
          { session: createMockSession('buyer'), repository }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      const product = createMockProduct({
        stock: 0,
        description: '在庫切れ商品の説明',
      });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession('buyer'), repository }
      );

      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.stock).toBe(0);
      expect(validated.description).toBe('在庫切れ商品の説明');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: GET /api/catalog/products?keyword=xxx 統合テスト
// ─────────────────────────────────────────────────────────────────

describe('Catalog API 統合テスト - US3: 商品検索', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('GET /api/catalog/products?keyword=xxx', () => {
    it('keyword パラメータで検索結果を返す', async () => {
      const product = createMockProduct({ name: 'コットンTシャツ' });
      vi.mocked(repository.findAll).mockResolvedValue([product]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 12, keyword: 'コットン' },
        { session: createMockSession('buyer'), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });

    it('該当なしで空配列を返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getProducts(
        { page: 1, limit: 12, keyword: '存在しないキーワード' },
        { session: createMockSession('buyer'), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(0);
      expect(validated.pagination.total).toBe(0);
    });

    it('ページネーションとの組み合わせが正しく動作する', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(25);

      const result = await getProducts(
        { page: 2, limit: 12, keyword: 'Tシャツ' },
        { session: createMockSession('buyer'), repository }
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'Tシャツ', offset: 12 })
      );
    });
  });
});
