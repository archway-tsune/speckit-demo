/** Cart ドメイン - UI単体テスト */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartView } from '@/samples/domains/cart/ui/CartView';
import { createMockCart, createMockCartItem } from '@/samples/tests/helpers';

describe('CartView', () => {
  describe('Given: カート内に商品あり', () => {
    describe('When: カートを表示する', () => {
      it('Then: 商品一覧を表示する', () => {
        const cart = createMockCart({
          items: [
            createMockCartItem({ productName: '商品A', price: 1000, quantity: 2 }),
            createMockCartItem({ productId: '550e8400-e29b-41d4-a716-446655440002', productName: '商品B', price: 2000, quantity: 1 }),
          ],
          subtotal: 4000, itemCount: 3,
        });
        render(<CartView cart={cart} />);
        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
        expect(screen.getByText('¥4,000')).toBeInTheDocument();
        expect(screen.getByText(/商品数: 3点/)).toBeInTheDocument();
      });

      it('Then: 画像未設定の商品にImagePlaceholderを表示する', () => {
        const cart = createMockCart({
          items: [createMockCartItem({ imageUrl: undefined })],
          subtotal: 1000, itemCount: 1,
        });
        render(<CartView cart={cart} />);
        expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
      });

      it('Then: QuantitySelectorで数量を表示する', () => {
        const cart = createMockCart({ items: [createMockCartItem({ quantity: 3 })], subtotal: 3000, itemCount: 3 });
        render(<CartView cart={cart} />);
        expect(screen.getByTestId('quantity-value')).toHaveTextContent('3');
      });
    });

    describe('When: QuantitySelectorの+ボタンをクリックする', () => {
      it('Then: onUpdateQuantityコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onUpdateQuantity = vi.fn();
        const cart = createMockCart({ items: [createMockCartItem({ quantity: 2 })], subtotal: 2000, itemCount: 2 });
        render(<CartView cart={cart} onUpdateQuantity={onUpdateQuantity} />);
        await user.click(screen.getByTestId('quantity-increment'));
        expect(onUpdateQuantity).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001', 3);
      });
    });

    describe('When: 削除ボタンをクリックする', () => {
      it('Then: 確認ダイアログが表示される', async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();
        const cart = createMockCart({ items: [createMockCartItem({ productName: '削除対象商品' })], subtotal: 1000, itemCount: 1 });
        render(<CartView cart={cart} onRemove={onRemove} />);
        await user.click(screen.getByRole('button', { name: /削除対象商品を削除/i }));
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('この商品をカートから削除しますか？')).toBeInTheDocument();
      });

      it('Then: 確認ボタンでonRemoveコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();
        const cart = createMockCart({ items: [createMockCartItem({ productName: '削除対象商品' })], subtotal: 1000, itemCount: 1 });
        render(<CartView cart={cart} onRemove={onRemove} />);
        await user.click(screen.getByRole('button', { name: /削除対象商品を削除/i }));
        await user.click(screen.getByTestId('confirm-button'));
        expect(onRemove).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      });

      it('Then: キャンセルボタンでダイアログが閉じ削除されない', async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();
        const cart = createMockCart({ items: [createMockCartItem({ productName: '削除対象商品' })], subtotal: 1000, itemCount: 1 });
        render(<CartView cart={cart} onRemove={onRemove} />);
        await user.click(screen.getByRole('button', { name: /削除対象商品を削除/i }));
        await user.click(screen.getByTestId('cancel-button'));
        expect(onRemove).not.toHaveBeenCalled();
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    describe('When: 注文手続きボタンをクリックする', () => {
      it('Then: onCheckoutコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onCheckout = vi.fn();
        const cart = createMockCart({ items: [createMockCartItem()], subtotal: 1000, itemCount: 1 });
        render(<CartView cart={cart} onCheckout={onCheckout} />);
        await user.click(screen.getByRole('button', { name: /注文手続きへ/i }));
        expect(onCheckout).toHaveBeenCalled();
      });
    });
  });
});
