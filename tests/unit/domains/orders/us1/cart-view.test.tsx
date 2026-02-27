/** Orders US1 - CartView onCheckout 単体テスト (AC-1, AC-2, FR-001, FR-002) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartView } from '@/domains/cart/ui';
import { CartSchema } from '@/contracts/cart';

function createMockCart(overrides = {}) {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440100',
    items: [],
    subtotal: 0,
    itemCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('CartView - onCheckout props (FR-001, FR-002)', () => {
  describe('Given: カートに1件以上の商品がある (AC-1, FR-001)', () => {
    it('Then: 「注文手続きへ」ボタン/リンクが表示される', () => {
      const cart = createMockCart({
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440001',
            productName: 'ミニマルTシャツ',
            price: 4980,
            quantity: 1,
            addedAt: new Date(),
          },
        ],
        subtotal: 4980,
        itemCount: 1,
      });

      render(
        <CartView
          cart={cart}
          onUpdateQuantity={vi.fn()}
          onRemove={vi.fn()}
          onCheckout={vi.fn()}
        />,
      );

      expect(screen.getByRole('link', { name: /注文手続きへ/ })).toBeInTheDocument();
    });
  });

  describe('Given: カートが空 (AC-2, FR-002)', () => {
    it('Then: 「注文手続きへ」ボタン/リンクが表示されない', () => {
      const emptyCart = createMockCart();

      render(
        <CartView
          cart={emptyCart}
          onCheckout={vi.fn()}
        />,
      );

      expect(screen.queryByRole('link', { name: /注文手続きへ/ })).not.toBeInTheDocument();
    });
  });
});
