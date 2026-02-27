/** Cart US3 - CartView 数量変更テスト (AC-3 / FR-011) */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartView } from '@/domains/cart/ui';
import { CartSchema } from '@/contracts/cart';

function createMockCart(overrides = {}) {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [{
      productId: '550e8400-e29b-41d4-a716-446655440001',
      productName: 'ミニマルTシャツ',
      price: 4980,
      quantity: 1,
      addedAt: new Date(),
    }],
    subtotal: 4980,
    itemCount: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('CartView 数量変更', () => {
  describe('Given: QuantitySelector の + ボタンを押す (AC-3, FR-011)', () => {
    it('Then: onUpdateQuantity が productId と新しい数量で呼ばれる', async () => {
      const user = userEvent.setup();
      const onUpdateQuantity = vi.fn();
      const cart = createMockCart();

      render(
        <CartView
          cart={cart}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('quantity-increment'));

      expect(onUpdateQuantity).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        2
      );
    });
  });
});
