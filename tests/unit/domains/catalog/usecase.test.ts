/**
 * Catalog ドメイン - ユースケース単体テスト（本番）
 * US1: 商品一覧表示
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  NotFoundError,
} from '@/domains/catalog/api/usecases';
import { ProductSchema, type Product, type ProductRepository } from '@/contracts/catalog';

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
// US1: 商品一覧取得 (getProducts)
// ─────────────────────────────────────────────────────────────────

describe('getProducts - US1: 商品一覧表示', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: ページネーション付きで商品リストを返す', async () => {
        const products = Array.from({ length: 12 }, (_, i) =>
          createMockProduct({
            id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
            name: `商品${i + 1}`,
          })
        );
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(25);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(result.products).toHaveLength(12);
        expect(result.pagination.total).toBe(25);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(12);
        expect(result.pagination.totalPages).toBe(3);
      });

      it('Then: buyer は published 商品のみ取得する', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
        expect(repository.count).toHaveBeenCalledWith('published', undefined);
      });
    });

    describe('When: 2ページ目を取得する', () => {
      it('Then: offset が正しく計算される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(25);

        await getProducts(
          { page: 2, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 12, limit: 12 })
        );
      });
    });

    describe('When: 商品が 0 件の場合', () => {
      it('Then: 空配列とページネーション情報を返す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(result.products).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: 商品詳細取得 (getProductById)
// ─────────────────────────────────────────────────────────────────

describe('getProductById - US2: 商品詳細表示', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 存在する published 商品を取得する', () => {
      it('Then: 商品を返す', async () => {
        const product = createMockProduct({ status: 'published' });
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: createMockSession('buyer'), repository }
        );

        expect(result).toEqual(product);
        expect(repository.findById).toHaveBeenCalledWith(product.id);
      });
    });

    describe('When: 存在しない ID を指定する', () => {
      it('Then: NotFoundError をスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getProductById(
            { id: '550e8400-e29b-41d4-a716-446655440099' },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('When: draft 商品にアクセスする', () => {
      it('Then: NotFoundError をスローする', async () => {
        const product = createMockProduct({ status: 'draft' });
        vi.mocked(repository.findById).mockResolvedValue(product);

        await expect(
          getProductById(
            { id: product.id },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 管理者: 商品登録 (createProduct)
// ─────────────────────────────────────────────────────────────────

describe('createProduct - 管理者: 商品登録', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 管理者ユーザー', () => {
    it('Then: 商品を登録できる', async () => {
      const newProduct = createMockProduct();
      vi.mocked(repository.create).mockResolvedValue(newProduct);

      const result = await createProduct(
        {
          name: 'テスト商品',
          price: 1000,
          description: '商品の説明',
        },
        { session: createMockSession('admin'), repository }
      );

      expect(result).toEqual(newProduct);
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('Given: 購入者ユーザー', () => {
    it('Then: ForbiddenError をスローする', async () => {
      await expect(
        createProduct(
          {
            name: 'テスト商品',
            price: 1000,
            description: '商品の説明',
          },
          { session: createMockSession('buyer'), repository }
        )
      ).rejects.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 管理者: 商品更新 (updateProduct)
// ─────────────────────────────────────────────────────────────────

describe('updateProduct - 管理者: 商品更新', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('管理者が既存商品を更新できる', async () => {
    const existing = createMockProduct();
    const updated = createMockProduct({ name: '更新後商品' });
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const result = await updateProduct(
      { id: existing.id, name: '更新後商品' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.name).toBe('更新後商品');
  });

  it('存在しない商品の更新は NotFoundError', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      updateProduct(
        { id: '550e8400-e29b-41d4-a716-446655440099' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow(NotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────
// 管理者: 商品削除 (deleteProduct)
// ─────────────────────────────────────────────────────────────────

describe('deleteProduct - 管理者: 商品削除', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('管理者が既存商品を削除できる', async () => {
    const existing = createMockProduct();
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.delete).mockResolvedValue(undefined);

    const result = await deleteProduct(
      { id: existing.id },
      { session: createMockSession('admin'), repository }
    );

    expect(result).toEqual({ success: true });
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: 商品検索 (getProducts with keyword)
// ─────────────────────────────────────────────────────────────────

describe('getProducts with keyword - US3: 商品検索', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('keyword で商品名の部分一致検索ができる', async () => {
    const matchingProduct = createMockProduct({ name: 'コットンTシャツ' });
    vi.mocked(repository.findAll).mockResolvedValue([matchingProduct]);
    vi.mocked(repository.count).mockResolvedValue(1);

    const result = await getProducts(
      { page: 1, limit: 12, keyword: 'コットン' },
      { session: createMockSession('buyer'), repository }
    );

    expect(result.products).toHaveLength(1);
    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'コットン' })
    );
    expect(repository.count).toHaveBeenCalledWith('published', 'コットン');
  });

  it('該当なしで空配列を返す', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);
    vi.mocked(repository.count).mockResolvedValue(0);

    const result = await getProducts(
      { page: 1, limit: 12, keyword: '存在しない商品' },
      { session: createMockSession('buyer'), repository }
    );

    expect(result.products).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('keyword 未指定で全件返す', async () => {
    const products = [createMockProduct()];
    vi.mocked(repository.findAll).mockResolvedValue(products);
    vi.mocked(repository.count).mockResolvedValue(1);

    const result = await getProducts(
      { page: 1, limit: 12 },
      { session: createMockSession('buyer'), repository }
    );

    expect(result.products).toHaveLength(1);
    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: undefined })
    );
  });
});
