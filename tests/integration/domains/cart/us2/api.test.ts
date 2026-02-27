/** Cart US2 - getCart API 統合テスト (AC-1,2,3 / FR-008,009,010) */
import { describe, it, expect, beforeEach } from 'vitest';
import { getCart, type CartContext } from '@/domains/cart/api';
import {
  GetCartInputSchema,
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

describe('Cart US2 統合テスト - getCart', () => {
  beforeEach(() => {
    resetCartStore();
  });

  describe('Given: GetCartInputSchema 入力 (AC-1)', () => {
    it('Then: 空入力でバリデーション成功する', () => {
      const input = GetCartInputSchema.parse({});
      expect(input).toEqual({});
    });
  });

  describe('Given: 正常な buyer セッションでカート取得 (AC-1, FR-008)', () => {
    it('Then: getCart は CartSchema に準拠した空カートを返す', async () => {
      const context = createContext(createMockSession('buyer'));
      const result = await getCart({}, context);

      expect(() => CartSchema.parse(result)).not.toThrow();
      const validated = CartSchema.parse(result);
      expect(validated.items).toHaveLength(0);
      expect(validated.itemCount).toBe(0);
    });
  });

  describe('Given: admin ロールでカート取得を試みる (AC-1, FR-008)', () => {
    it('Then: 認証エラーをスローする', async () => {
      const context = createContext(createMockSession('admin'));
      await expect(getCart({}, context)).rejects.toThrow();
    });
  });
});
