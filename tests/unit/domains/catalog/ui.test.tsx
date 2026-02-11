/**
 * Catalog ドメイン - UI 単体テスト（本番）
 * US1: 商品一覧表示
 * US2: 商品詳細表示
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/domains/catalog/ui/ProductCard';
import { ProductList } from '@/domains/catalog/ui/ProductList';
import { ProductDetail } from '@/domains/catalog/ui/ProductDetail';
import { SearchBar } from '@/templates/ui/components/form/SearchBar';
import { ProductSchema, type Product } from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: '商品の説明文です。',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────────

describe('ProductCard - US1: 商品カード表示', () => {
  describe('Given: 在庫あり商品', () => {
    describe('When: カードを表示する', () => {
      it('Then: 商品画像・名前・価格を表示する', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        expect(screen.getByText('テスト商品')).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });

      it('Then: 詳細ページへのリンクを持つ', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        const link = screen.getByTestId('product-card');
        expect(link).toHaveAttribute('href', `/catalog/${product.id}`);
      });
    });
  });

  describe('Given: 在庫切れ商品（stock===0）', () => {
    describe('When: カードを表示する', () => {
      it('Then: 「在庫切れ」ラベルを表示する', () => {
        const product = createMockProduct({ stock: 0 });
        render(<ProductCard product={product} />);

        expect(screen.getByText('在庫切れ')).toBeInTheDocument();
      });
    });
  });

  describe('Given: 画像未設定商品', () => {
    describe('When: カードを表示する', () => {
      it('Then: プレースホルダー画像を表示する', () => {
        const product = createMockProduct({ imageUrl: undefined });
        render(<ProductCard product={product} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList
// ─────────────────────────────────────────────────────────────────

describe('ProductList - US1: 商品一覧表示', () => {
  describe('Given: ローディング状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<ProductList products={[]} isLoading={true} pagination={null} />);

        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: エラー状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: エラーメッセージを表示する', () => {
        render(
          <ProductList
            products={[]}
            isLoading={false}
            error="商品の取得に失敗しました"
            pagination={null}
          />
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('商品の取得に失敗しました')).toBeInTheDocument();
      });
    });
  });

  describe('Given: 商品が 0 件', () => {
    describe('When: リストを表示する', () => {
      it('Then: 「商品がありません」と表示する', () => {
        render(<ProductList products={[]} isLoading={false} pagination={null} />);

        expect(screen.getByText(/商品がありません/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given: 12件の商品データ', () => {
    describe('When: リストを表示する', () => {
      it('Then: 12件のカードをグリッド表示する', () => {
        const products = Array.from({ length: 12 }, (_, i) =>
          createMockProduct({
            id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
            name: `商品${i + 1}`,
          })
        );
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getAllByTestId('product-card')).toHaveLength(12);
      });
    });

    describe('When: ページネーションが表示される', () => {
      it('Then: 次へボタンをクリックで onPageChange が呼ばれる', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onPageChange={onPageChange}
          />
        );

        await user.click(screen.getByRole('button', { name: /次へ/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
      });

      it('Then: 最初のページでは前へボタンが無効', () => {
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByRole('button', { name: /前へ/i })).toBeDisabled();
      });

      it('Then: 最終ページでは次へボタンが無効', () => {
        const products = [createMockProduct()];
        const pagination = { page: 3, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByRole('button', { name: /次へ/i })).toBeDisabled();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductDetail - US2: 商品詳細表示
// ─────────────────────────────────────────────────────────────────

describe('ProductDetail - US2: 商品詳細表示', () => {
  describe('Given: ローディング状態', () => {
    it('Then: ローディング表示を出す', () => {
      render(<ProductDetail product={null} isLoading={true} />);

      expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
    });
  });

  describe('Given: エラー状態', () => {
    it('Then: エラーメッセージを表示する', () => {
      render(<ProductDetail product={null} isLoading={false} error="商品が見つかりません" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('商品が見つかりません')).toBeInTheDocument();
    });
  });

  describe('Given: 在庫あり商品', () => {
    it('Then: 商品画像・名前・価格・説明文・在庫数を表示する', () => {
      const product = createMockProduct({ stock: 15 });
      render(<ProductDetail product={product} isLoading={false} onAddToCart={() => {}} />);

      expect(screen.getByRole('heading', { name: 'テスト商品' })).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
      expect(screen.getByText('商品の説明文です。')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    it('Then: カート追加ボタンが有効である', () => {
      const product = createMockProduct({ stock: 10 });
      render(<ProductDetail product={product} isLoading={false} onAddToCart={() => {}} />);

      const button = screen.getByRole('button', { name: /カートに追加/i });
      expect(button).toBeEnabled();
    });

    it('Then: カート追加クリックでコールバックが発火する', async () => {
      const user = userEvent.setup();
      const onAddToCart = vi.fn();
      const product = createMockProduct({ stock: 10 });

      render(<ProductDetail product={product} isLoading={false} onAddToCart={onAddToCart} />);

      await user.click(screen.getByRole('button', { name: /カートに追加/i }));
      expect(onAddToCart).toHaveBeenCalledWith(product.id);
    });
  });

  describe('Given: 在庫切れ商品（stock===0）', () => {
    it('Then: カート追加ボタンが無効化されている', () => {
      const product = createMockProduct({ stock: 0 });
      render(<ProductDetail product={product} isLoading={false} onAddToCart={() => {}} />);

      const button = screen.getByRole('button', { name: /カートに追加/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Given: 画像未設定商品', () => {
    it('Then: プレースホルダー画像を表示する', () => {
      const product = createMockProduct({ imageUrl: undefined });
      render(<ProductDetail product={product} isLoading={false} />);

      expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
    });
  });

  describe('Given: 戻るボタン', () => {
    it('Then: クリックで onBack コールバックが発火する', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      const product = createMockProduct();

      render(<ProductDetail product={product} isLoading={false} onBack={onBack} />);

      await user.click(screen.getByRole('button', { name: /戻る/i }));
      expect(onBack).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// SearchBar - US3: 商品検索（テンプレートコンポーネント利用）
// ─────────────────────────────────────────────────────────────────

describe('SearchBar - US3: 商品検索', () => {
  describe('Given: 検索フォーム', () => {
    it('Then: キーワード入力で onSearch コールバックが Enter で発火する', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(<SearchBar onSearch={onSearch} placeholder="商品を検索..." />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'コットン{Enter}');

      expect(onSearch).toHaveBeenCalledWith('コットン');
    });

    it('Then: クリアボタンで空文字の onSearch が発火する', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(<SearchBar onSearch={onSearch} defaultValue="コットン" />);

      const clearButton = screen.getByTestId('search-clear');
      await user.click(clearButton);

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('Then: 空文字で Enter するとクリア動作になる', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByTestId('search-input');
      await user.type(input, '{Enter}');

      expect(onSearch).toHaveBeenCalledWith('');
    });
  });
});
