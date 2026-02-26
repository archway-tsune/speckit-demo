/** Catalog US2 - ProductDetail UI 単体テスト (AC-1,2,3,4, FR-007,008,009,010) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductDetail } from '@/domains/catalog/ui';
import { ProductSchema } from '@/contracts/catalog';

function createMockProduct(overrides: Record<string, unknown> = {}) {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。',
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('ProductDetail', () => {
  describe('Given: stock > 0 の商品 (AC-1, FR-007)', () => {
    it('Then: 商品名・価格・説明文・在庫数を表示する', () => {
      const product = createMockProduct({ stock: 50 });
      render(<ProductDetail product={product} onBack={vi.fn()} />);

      expect(screen.getByRole('heading', { name: 'ミニマルTシャツ' })).toBeInTheDocument();
      expect(screen.getByText('¥4,980')).toBeInTheDocument();
      expect(screen.getByText('シンプルで上質なコットン100%のTシャツ。')).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });

    it('Then: カート追加ボタンが有効状態で表示される (AC-1, FR-008)', () => {
      const product = createMockProduct({ stock: 50 });
      render(<ProductDetail product={product} onBack={vi.fn()} />);

      const button = screen.getByRole('button', { name: /カートに追加/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe('Given: stock=0 の商品 (AC-2, FR-007,008)', () => {
    it('Then: カート追加ボタンが無効化されている', () => {
      const product = createMockProduct({ stock: 0 });
      render(<ProductDetail product={product} onBack={vi.fn()} />);

      const button = screen.getByRole('button', { name: /在庫切れ|カートに追加/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Given: imageUrl が未設定の商品 (AC-3, FR-009)', () => {
    it('Then: ImagePlaceholder が表示される', () => {
      const product = createMockProduct({ imageUrl: undefined });
      render(<ProductDetail product={product} onBack={vi.fn()} />);

      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
    });
  });

  describe('Given: imageUrl が設定された商品', () => {
    it('Then: 商品画像が表示される', () => {
      const product = createMockProduct({ imageUrl: 'https://picsum.photos/seed/tshirt/400/400' });
      render(<ProductDetail product={product} onBack={vi.fn()} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://picsum.photos/seed/tshirt/400/400');
    });
  });

  describe('Given: 戻るボタン (AC-4, FR-010)', () => {
    it('Then: クリックで onBack コールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      const product = createMockProduct();
      render(<ProductDetail product={product} onBack={onBack} />);

      await user.click(screen.getByRole('button', { name: /一覧に戻る|戻る/i }));
      expect(onBack).toHaveBeenCalled();
    });
  });
});
