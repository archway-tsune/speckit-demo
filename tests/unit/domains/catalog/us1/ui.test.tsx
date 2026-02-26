/** Catalog US1 - ProductList UI 単体テスト (AC-1,2,3,4,5, FR-002,003,004,005) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/domains/catalog/ui';
import { ProductSchema } from '@/contracts/catalog';
import type { GetProductsOutput } from '@/contracts/catalog';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440001',
    name: overrides.name ?? 'テスト商品',
    price: 4980,
    description: 'テスト説明文',
    imageUrl: overrides.imageUrl ?? 'https://picsum.photos/seed/test/400/400',
    stock: overrides.stock ?? 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });
}

function createPagination(overrides: Partial<GetProductsOutput['pagination']> = {}): GetProductsOutput['pagination'] {
  return {
    page: 1,
    limit: 12,
    total: 15,
    totalPages: 2,
    ...overrides,
  };
}

describe('ProductList', () => {
  describe('Given: 12件の商品データ (AC-1, FR-002)', () => {
    it('Then: 12件の商品カードを表示する', () => {
      const products = Array.from({ length: 12 }, (_, i) =>
        createMockProduct({ id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`, name: `商品${i + 1}` })
      );
      render(
        <ProductList
          products={products}
          pagination={createPagination({ total: 15, totalPages: 2 })}
          onPageChange={vi.fn()}
        />
      );
      const cards = screen.getAllByTestId('product-card');
      expect(cards).toHaveLength(12);
    });
  });

  describe('Given: ページが複数ある場合 (AC-2)', () => {
    it('Then: ページネーションを表示する', () => {
      const products = [createMockProduct()];
      render(
        <ProductList
          products={products}
          pagination={createPagination({ total: 15, totalPages: 2 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByRole('navigation', { name: /ページネーション/i })).toBeInTheDocument();
    });

    it('Then: 次へボタンをクリックするとonPageChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const products = [createMockProduct()];
      render(
        <ProductList
          products={products}
          pagination={createPagination({ page: 1, total: 15, totalPages: 2 })}
          onPageChange={onPageChange}
        />
      );
      await user.click(screen.getByTestId('pagination-next'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('Then: 最終ページでは次へボタンが無効', () => {
      const products = [createMockProduct()];
      render(
        <ProductList
          products={products}
          pagination={createPagination({ page: 2, total: 15, totalPages: 2 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByTestId('pagination-next')).toBeDisabled();
    });
  });

  describe('Given: ページが1つだけの場合 (AC-2)', () => {
    it('Then: ページネーションを表示しない', () => {
      const products = [createMockProduct()];
      render(
        <ProductList
          products={products}
          pagination={createPagination({ total: 1, totalPages: 1 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.queryByRole('navigation', { name: /ページネーション/i })).not.toBeInTheDocument();
    });
  });

  describe('Given: stock=0 の商品を含む (AC-3, FR-004)', () => {
    it('Then: 在庫切れバッジを表示する', () => {
      const outOfStockProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'デニムパンツ', stock: 0 });
      const inStockProduct = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Tシャツ', stock: 5 });
      render(
        <ProductList
          products={[inStockProduct, outOfStockProduct]}
          pagination={createPagination({ total: 2, totalPages: 1 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText('在庫切れ')).toBeInTheDocument();
    });

    it('Then: stock > 0 の商品には在庫切れバッジを表示しない', () => {
      const inStockProduct = createMockProduct({ stock: 5 });
      render(
        <ProductList
          products={[inStockProduct]}
          pagination={createPagination({ total: 1, totalPages: 1 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.queryByText('在庫切れ')).not.toBeInTheDocument();
    });
  });

  describe('Given: 商品が0件 (AC-5, FR-005)', () => {
    it('Then: 「商品がありません」を表示する', () => {
      render(
        <ProductList
          products={[]}
          pagination={createPagination({ total: 0, totalPages: 0 })}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText('商品がありません')).toBeInTheDocument();
    });
  });
});
