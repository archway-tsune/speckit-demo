/** Cart US3 - updateCartItem API 統合テスト (AC-1,2 / FR-011,012) */
import { describe, it, expect, beforeEach } from 'vitest';
import { addToCart, updateCartItem, type CartContext } from '@/domains/cart/api';
import {
  UpdateCartItemInputSchema,
  CartSchema,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { resetCartStore } from '@/infrastructure/repositories/cart';
import type { SessionData } from '@/foundation/auth/session';

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): SessionData {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
  };
}

function createContext(session: SessionData): CartContext {
  return {
    session,
    repository: cartRepository as CartRepository,
    productFetcher: productFetcher as ProductFetcher,
  };
}

describe('Cart US3 統合テスト - updateCartItem', () => {
  beforeEach(() => {
    resetCartStore();
  });

  describe('Given: UpdateCartItemInputSchema 入力 (AC-1)', () => {
    it('Then: productId と quantity のバリデーション成功する', () => {
      const input = UpdateCartItemInputSchema.parse({
        productId: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 3,
      });
      expect(input.quantity).toBe(3);
    });
  });

  describe('Given: buyer がカート内商品の数量を有効範囲で変更 (AC-1, FR-011)', () => {
    it('Then: updateCartItem は CartSchema に準拠した結果を返す', async () => {
      const context = createContext(createMockSession('buyer'));
      // ミニマルTシャツ (stock: 50) を追加
      await addToCart({ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }, context);

      const result = await updateCartItem(
        { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 3 },
        context
      );

      expect(() => CartSchema.parse(result)).not.toThrow();
      const validated = CartSchema.parse(result);
      expect(validated.items[0].quantity).toBe(3);
    });
  });

  describe('Given: 在庫を超える数量に変更 (AC-2, FR-012)', () => {
    it('Then: 在庫不足エラーをスローする', async () => {
      const context = createContext(createMockSession('buyer'));
      // E2Eテスト商品 (stock: 10) を追加
      await addToCart({ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }, context);

      await expect(
        updateCartItem({ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 11 }, context)
      ).rejects.toThrow('在庫不足');
    });
  });
});
