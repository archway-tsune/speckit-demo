/** Cart US4 - removeFromCart API 統合テスト (AC-2,3 / FR-014) */
import { describe, it, expect, beforeEach } from 'vitest';
import { addToCart, removeFromCart, type CartContext } from '@/domains/cart/api';
import {
  RemoveFromCartInputSchema,
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

describe('Cart US4 統合テスト - removeFromCart', () => {
  beforeEach(() => {
    resetCartStore();
  });

  describe('Given: RemoveFromCartInputSchema 入力 (AC-2)', () => {
    it('Then: productId のバリデーション成功する', () => {
      const input = RemoveFromCartInputSchema.parse({
        productId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(input.productId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });

  describe('Given: buyer がカートから商品を削除 (AC-2, FR-014)', () => {
    it('Then: removeFromCart は CartSchema に準拠した結果を返す', async () => {
      const context = createContext(createMockSession('buyer'));
      // ミニマルTシャツ (stock: 50) を追加
      await addToCart({ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }, context);

      const result = await removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440001' },
        context
      );

      expect(() => CartSchema.parse(result)).not.toThrow();
      const validated = CartSchema.parse(result);
      expect(validated.items).toHaveLength(0);
    });
  });

  describe('Given: 最後の商品を削除 (AC-3, FR-014)', () => {
    it('Then: 空カートになる', async () => {
      const context = createContext(createMockSession('buyer'));
      await addToCart({ productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 }, context);

      const result = await removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440001' },
        context
      );

      expect(result.itemCount).toBe(0);
      expect(result.subtotal).toBe(0);
    });
  });
});
