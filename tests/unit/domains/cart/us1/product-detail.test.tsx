/** Cart US1 - ProductDetail カート追加 UI 単体テスト (AC-4,6 / FR-004,005) */
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
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

describe('ProductDetail (カート追加)', () => {
  describe('Given: stock=0 の商品 (AC-4, FR-004)', () => {
    it('Then: 「カートに追加」ボタンが disabled になっている', () => {
      render(
        <ProductDetail
          product={createMockProduct({ stock: 0 })}
          onBack={vi.fn()}
          onAddToCart={vi.fn()}
        />
      );
      const button = screen.getByRole('button', { name: '在庫切れ' });
      expect(button).toBeDisabled();
    });
  });

  describe('Given: isAddingToCart=true (AC-6, FR-005)', () => {
    it('Then: ボタンが disabled になり二重送信が防止される', () => {
      render(
        <ProductDetail
          product={createMockProduct({ stock: 10 })}
          onBack={vi.fn()}
          onAddToCart={vi.fn()}
          isAddingToCart={true}
        />
      );
      const button = screen.getByRole('button', { name: '追加中...' });
      expect(button).toBeDisabled();
    });
  });

  describe('Given: 在庫あり商品で onAddToCart が渡されている (AC-1)', () => {
    it('Then: ボタンクリックで onAddToCart が商品IDで呼ばれる', async () => {
      const user = userEvent.setup();
      const onAddToCart = vi.fn();
      const product = createMockProduct({ stock: 10 });

      render(
        <ProductDetail
          product={product}
          onBack={vi.fn()}
          onAddToCart={onAddToCart}
        />
      );

      await user.click(screen.getByRole('button', { name: 'カートに追加' }));
      expect(onAddToCart).toHaveBeenCalledWith(product.id);
    });
  });
});
