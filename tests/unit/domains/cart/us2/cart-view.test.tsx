/** Cart US2 - CartView 単体テスト (AC-1,2,3 / FR-008,009,010) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartView } from '@/domains/cart/ui';
import { CartSchema } from '@/contracts/cart';

function createMockCart(overrides = {}) {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [],
    subtotal: 0,
    itemCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('CartView', () => {
  describe('Given: カートに商品がある (AC-1, FR-008)', () => {
    it('Then: 商品名・数量が表示される', () => {
      const cart = createMockCart({
        items: [{
          productId: '550e8400-e29b-41d4-a716-446655440001',
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 2,
          addedAt: new Date(),
        }],
        subtotal: 9960,
        itemCount: 2,
      });

      render(<CartView cart={cart} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />);

      expect(screen.getByText('ミニマルTシャツ')).toBeInTheDocument();
      expect(screen.getByTestId('quantity-value')).toHaveTextContent('2');
    });
  });

  describe('Given: カートに商品がある (AC-2, FR-009)', () => {
    it('Then: 商品合計・消費税（10%切り捨て）・総合計のテストIDが表示される', () => {
      const subtotal = 9960;
      const cart = createMockCart({
        items: [{
          productId: '550e8400-e29b-41d4-a716-446655440001',
          productName: 'ミニマルTシャツ',
          price: 4980,
          quantity: 2,
          addedAt: new Date(),
        }],
        subtotal,
        itemCount: 2,
      });

      render(<CartView cart={cart} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />);

      expect(screen.getByTestId('cart-subtotal')).toBeInTheDocument();
      expect(screen.getByTestId('cart-tax')).toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toBeInTheDocument();
    });
  });

  describe('Given: カートが空 (AC-3, FR-010)', () => {
    it('Then: 空カートメッセージと商品一覧リンクが表示される', () => {
      const emptyCart = createMockCart();
      render(<CartView cart={emptyCart} />);

      expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '商品一覧へ戻る' })).toHaveAttribute('href', '/catalog');
    });
  });
});
