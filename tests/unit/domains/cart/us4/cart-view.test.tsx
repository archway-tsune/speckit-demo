/** Cart US4 - CartView 削除ボタン単体テスト (AC-1,4 / FR-013) */
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

describe('CartView 削除機能', () => {
  describe('Given: 削除ボタンをクリック (AC-1, FR-013)', () => {
    it('Then: ConfirmDialog が表示される (data-testid="confirm-dialog")', async () => {
      const user = userEvent.setup();
      const cart = createMockCart();

      render(
        <CartView
          cart={cart}
          onUpdateQuantity={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /ミニマルTシャツを削除/ }));

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  describe('Given: ConfirmDialog でキャンセルをクリック (AC-4, FR-013)', () => {
    it('Then: ダイアログが閉じ onRemove は呼ばれない', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const cart = createMockCart();

      render(
        <CartView
          cart={cart}
          onUpdateQuantity={vi.fn()}
          onRemove={onRemove}
        />
      );

      await user.click(screen.getByRole('button', { name: /ミニマルTシャツを削除/ }));
      await user.click(screen.getByTestId('cancel-button'));

      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      expect(onRemove).not.toHaveBeenCalled();
    });
  });
});
