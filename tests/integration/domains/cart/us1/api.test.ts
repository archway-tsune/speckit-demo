/** Cart US1 - addToCart API 統合テスト (AC-1,2,3,5 / FR-001,002,003,007) */
import { describe, it, expect, beforeEach } from 'vitest';
import { addToCart, type CartContext } from '@/domains/cart/api';
import {
  AddToCartInputSchema,
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

describe('Cart US1 統合テスト - addToCart', () => {
  beforeEach(() => {
    resetCartStore();
  });

  describe('Given: AddToCartInputSchema 入力 (AC-1)', () => {
    it('Then: スキーマバリデーション成功 - productId と quantity が正しく渡せる', () => {
      const input = AddToCartInputSchema.parse({
        productId: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 1,
      });
      expect(input.productId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(input.quantity).toBe(1);
    });
  });

  describe('Given: 正常な buyer セッションでカートに追加 (AC-1, FR-001)', () => {
    it('Then: addToCart は CartSchema に準拠した結果を返す', async () => {
      const context = createContext(createMockSession('buyer'));
      // シードデータから実際に存在する商品IDを使用
      // 在庫 > 0 の商品
      const result = await addToCart(
        { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
        context
      );

      expect(() => CartSchema.parse(result)).not.toThrow();
      const validated = CartSchema.parse(result);
      expect(validated.items).toHaveLength(1);
      expect(validated.itemCount).toBe(1);
    });
  });

  describe('Given: admin ロールでカート追加を試みる (AC-5, FR-007)', () => {
    it('Then: 認証エラーをスローする', async () => {
      const context = createContext(createMockSession('admin'));

      await expect(
        addToCart(
          { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
          context
        )
      ).rejects.toThrow();
    });
  });

  describe('Given: 存在しない商品IDでカートに追加 (FR-001)', () => {
    it('Then: 商品が見つかりませんエラーをスローする', async () => {
      const context = createContext(createMockSession('buyer'));

      await expect(
        addToCart(
          { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 1 },
          context
        )
      ).rejects.toThrow('商品が見つかりません');
    });
  });
});
