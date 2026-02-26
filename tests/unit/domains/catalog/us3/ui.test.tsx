/** Catalog US3 - ProductList 検索 UI 単体テスト (AC-1,2,3, FR-011,012,013) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/domains/catalog/ui';
import { ProductSchema } from '@/contracts/catalog';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

function createPagination(overrides = {}) {
  return { page: 1, limit: 12, total: 1, totalPages: 1, ...overrides };
}

describe('ProductList (検索)', () => {
  describe('Given: onSearch が渡された場合 (AC-1, FR-011)', () => {
    it('Then: SearchBar が表示される', () => {
      render(
        <ProductList
          products={[createMockProduct()]}
          pagination={createPagination()}
          onPageChange={vi.fn()}
          onSearch={vi.fn()}
        />
      );
      expect(screen.getByRole('textbox', { name: '検索' })).toBeInTheDocument();
    });

    it('Then: Enter キーで onSearch コールバックが呼ばれる (FR-011)', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(
        <ProductList
          products={[createMockProduct()]}
          pagination={createPagination()}
          onPageChange={vi.fn()}
          onSearch={onSearch}
        />
      );
      const input = screen.getByRole('textbox', { name: '検索' });
      await user.type(input, 'Tシャツ');
      await user.keyboard('{Enter}');
      expect(onSearch).toHaveBeenCalledWith('Tシャツ');
    });
  });

  describe('Given: 検索結果 0件 + searchQuery あり (AC-2, FR-012)', () => {
    it('Then: "該当する商品が見つかりませんでした" を表示する', () => {
      render(
        <ProductList
          products={[]}
          pagination={createPagination({ total: 0, totalPages: 0 })}
          onPageChange={vi.fn()}
          onSearch={vi.fn()}
          searchQuery="xyznotexist"
        />
      );
      expect(
        screen.getByText('該当する商品が見つかりませんでした')
      ).toBeInTheDocument();
    });
  });

  describe('Given: onSearch なしの場合 (AC-3, FR-013)', () => {
    it('Then: SearchBar が表示されない', () => {
      render(
        <ProductList
          products={[createMockProduct()]}
          pagination={createPagination()}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.queryByRole('textbox', { name: '検索' })).not.toBeInTheDocument();
    });
  });
});
