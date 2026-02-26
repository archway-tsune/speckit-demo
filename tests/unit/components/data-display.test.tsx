import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ImagePlaceholder } from '@/components/product';
import { StatusBadge } from '@/components/data-display';
import { ProductCard } from '@/components/product';

// ─────────────────────────────────────────────────────────────────
// ImagePlaceholder
// ─────────────────────────────────────────────────────────────────

describe('ImagePlaceholder コンポーネント', () => {
  describe('画像表示', () => {
    it('Given src指定あり, When レンダリング, Then img要素が表示される', () => {
      render(<ImagePlaceholder src="https://example.com/image.jpg" alt="テスト画像" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'テスト画像');
    });

    it('Given src未指定, When レンダリング, Then SVGプレースホルダーが表示される', () => {
      render(<ImagePlaceholder alt="テスト画像" />);
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('サイズバリアント', () => {
    it('Given size="sm", When レンダリング, Then 小サイズで表示される', () => {
      render(<ImagePlaceholder alt="テスト" size="sm" />);
      const el = screen.getByTestId('image-placeholder');
      expect(el.className).toContain('w-16');
      expect(el.className).toContain('h-16');
    });

    it('Given size="md"（デフォルト）, When レンダリング, Then 中サイズで表示される', () => {
      render(<ImagePlaceholder alt="テスト" />);
      const el = screen.getByTestId('image-placeholder');
      expect(el.className).toContain('w-24');
      expect(el.className).toContain('h-24');
    });

    it('Given size="lg", When レンダリング, Then 大サイズで表示される', () => {
      render(<ImagePlaceholder alt="テスト" size="lg" />);
      const el = screen.getByTestId('image-placeholder');
      expect(el.className).toContain('w-64');
      expect(el.className).toContain('h-64');
    });
  });

  describe('alt属性', () => {
    it('Given src指定あり, When レンダリング, Then alt属性が設定される', () => {
      render(<ImagePlaceholder src="https://example.com/img.jpg" alt="商品画像" />);
      expect(screen.getByRole('img')).toHaveAttribute('alt', '商品画像');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────

describe('StatusBadge コンポーネント', () => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
  };

  const statusLabels: Record<string, string> = {
    pending: '保留中',
    confirmed: '確認済み',
  };

  describe('定義済みステータス', () => {
    it('Given 定義済みステータス, When レンダリング, Then 対応する色とラベルが表示される', () => {
      render(
        <StatusBadge status="pending" statusColors={statusColors} statusLabels={statusLabels} />
      );
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('保留中');
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('text-yellow-800');
    });
  });

  describe('未定義ステータス', () => {
    it('Given 未定義ステータス, When レンダリング, Then デフォルトスタイルでステータス値がそのまま表示される', () => {
      render(
        <StatusBadge status="unknown" statusColors={statusColors} statusLabels={statusLabels} />
      );
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('unknown');
      expect(badge.className).toContain('bg-base-100');
      expect(badge.className).toContain('text-base-900');
    });
  });

  describe('アクセシビリティ', () => {
    it('Given ステータス, When レンダリング, Then status roleが設定されている', () => {
      render(
        <StatusBadge status="confirmed" statusColors={statusColors} statusLabels={statusLabels} />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────────

describe('ProductCard コンポーネント', () => {
  describe('コア表示', () => {
    it('Given 商品データ, When レンダリング, Then 商品名・価格・画像を表示する', () => {
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          imageUrl="https://example.com/product.jpg"
          linkHref="/catalog/550e8400-e29b-41d4-a716-446655440099"
        />
      );
      expect(screen.getByText('テスト商品')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/product.jpg');
    });

    it('Given imageUrl未設定の商品, When レンダリング, Then プレースホルダー画像を表示する', () => {
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          linkHref="/catalog/550e8400-e29b-41d4-a716-446655440099"
        />
      );
      expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
    });
  });

  describe('リンク生成', () => {
    it('Given linkHref指定, When レンダリング, Then そのパスへのリンクを持つ', () => {
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          linkHref="/sample/catalog/550e8400-e29b-41d4-a716-446655440099"
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/sample/catalog/550e8400-e29b-41d4-a716-446655440099');
    });
  });

  describe('カート追加ボタン', () => {
    it('Given onAddToCart指定, When レンダリング, Then カートに追加ボタンが表示される', () => {
      const onAddToCart = vi.fn();
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          linkHref="/catalog/550e8400-e29b-41d4-a716-446655440099"
          onAddToCart={onAddToCart}
        />
      );
      expect(screen.getByRole('button', { name: /カートに追加/i })).toBeInTheDocument();
    });

    it('Given onAddToCart未指定, When レンダリング, Then カートに追加ボタンは表示されない', () => {
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          linkHref="/catalog/550e8400-e29b-41d4-a716-446655440099"
        />
      );
      expect(screen.queryByRole('button', { name: /カートに追加/i })).not.toBeInTheDocument();
    });

    it('Given カートに追加ボタン表示, When クリック, Then onAddToCartが呼ばれる', async () => {
      const user = userEvent.setup();
      const onAddToCart = vi.fn();
      render(
        <ProductCard
          id="550e8400-e29b-41d4-a716-446655440099"
          name="テスト商品"
          price={1000}
          linkHref="/catalog/550e8400-e29b-41d4-a716-446655440099"
          onAddToCart={onAddToCart}
        />
      );
      await user.click(screen.getByRole('button', { name: /カートに追加/i }));
      expect(onAddToCart).toHaveBeenCalled();
    });
  });
});
