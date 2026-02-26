/** Catalog ドメイン - UI単体テスト */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/samples/domains/catalog/ui/ProductList';
import { ProductDetail } from '@/samples/domains/catalog/ui/ProductDetail';
import { ProductCard } from '@/samples/domains/catalog/ui/ProductCard';
import { createMockProduct } from '@/samples/tests/helpers';

describe('ProductCard', () => {
  describe('Given: 商品データ', () => {
    describe('When: カードを表示する', () => {
      it('Then: 商品名・価格・画像を表示する', () => {
        const product = createMockProduct();
        render(
          <ProductCard
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
            linkHref={`/catalog/${product.id}`}
          />
        );
        expect(screen.getByText('テスト商品')).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });

      it('Then: 商品詳細へのリンクを持つ', () => {
        const product = createMockProduct();
        render(
          <ProductCard
            id={product.id}
            name={product.name}
            price={product.price}
            linkHref={`/catalog/${product.id}`}
          />
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/catalog/${product.id}`);
      });
    });

    describe('When: 画像がない商品を表示する', () => {
      it('Then: プレースホルダー画像を表示する', () => {
        const product = createMockProduct({ imageUrl: undefined });
        render(
          <ProductCard
            id={product.id}
            name={product.name}
            price={product.price}
            linkHref={`/catalog/${product.id}`}
          />
        );
        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      });
    });
  });

  describe('Given: カートに追加ボタン', () => {
    describe('When: ボタンをクリックする', () => {
      it('Then: onAddToCartコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onAddToCart = vi.fn();
        const product = createMockProduct();
        render(
          <ProductCard
            id={product.id}
            name={product.name}
            price={product.price}
            linkHref={`/catalog/${product.id}`}
            onAddToCart={onAddToCart}
          />
        );
        await user.click(screen.getByRole('button', { name: /カートに追加/i }));
        expect(onAddToCart).toHaveBeenCalled();
      });
    });
  });
});

describe('ProductList', () => {
  describe('Given: 商品データあり', () => {
    describe('When: リストを表示する', () => {
      it('Then: 商品カードを一覧表示する', () => {
        const products = [
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440003', name: '商品C' }),
        ];
        render(<ProductList products={products} pagination={{ page: 1, limit: 20, total: 3, totalPages: 1 }} />);
        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
        expect(screen.getByText('商品C')).toBeInTheDocument();
      });
    });

    describe('When: ページネーションがある', () => {
      it('Then: ページネーション情報を表示する', () => {
        render(<ProductList products={[createMockProduct()]} pagination={{ page: 1, limit: 20, total: 100, totalPages: 5 }} />);
        expect(screen.getByText(/全100件/)).toBeInTheDocument();
      });

      it('Then: 次ページボタンが動作する', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(<ProductList products={[createMockProduct()]} pagination={{ page: 1, limit: 20, total: 100, totalPages: 5 }} onPageChange={onPageChange} />);
        await user.click(screen.getByRole('button', { name: /次へ/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
      });

      it('Then: 最終ページでは次へボタンが無効', () => {
        render(<ProductList products={[createMockProduct()]} pagination={{ page: 5, limit: 20, total: 100, totalPages: 5 }} />);
        expect(screen.getByRole('button', { name: /次へ/i })).toBeDisabled();
      });

      it('Then: Pagination コンポーネントの nav ランドマークを持つ', () => {
        render(<ProductList products={[createMockProduct()]} pagination={{ page: 1, limit: 20, total: 100, totalPages: 5 }} />);
        expect(screen.getByRole('navigation', { name: /ページネーション/i })).toBeInTheDocument();
      });

      it('Then: Pagination コンポーネントの testid で前へ/次へ操作ができる', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        render(<ProductList products={[createMockProduct()]} pagination={{ page: 2, limit: 20, total: 100, totalPages: 5 }} onPageChange={onPageChange} />);
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(/全100件/);
        await user.click(screen.getByTestId('pagination-prev'));
        expect(onPageChange).toHaveBeenCalledWith(1);
      });
    });
  });
});

describe('ProductDetail', () => {
  describe('Given: 商品データあり', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: 商品情報を全て表示する', () => {
        const product = createMockProduct({ description: '商品の説明文です。' });
        render(<ProductDetail product={product} />);
        expect(screen.getByRole('heading', { name: 'テスト商品' })).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByText('商品の説明文です。')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });
    });

    describe('When: カートに追加ボタンをクリックする', () => {
      it('Then: onAddToCartコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onAddToCart = vi.fn();
        const product = createMockProduct();
        render(<ProductDetail product={product} onAddToCart={onAddToCart} />);
        await user.click(screen.getByRole('button', { name: /カートに追加/i }));
        expect(onAddToCart).toHaveBeenCalledWith(product.id);
      });
    });

    describe('When: 戻るボタンをクリックする', () => {
      it('Then: onBackコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const product = createMockProduct();
        render(<ProductDetail product={product} onBack={onBack} />);
        await user.click(screen.getByRole('button', { name: /戻る/i }));
        expect(onBack).toHaveBeenCalled();
      });
    });
  });
});
