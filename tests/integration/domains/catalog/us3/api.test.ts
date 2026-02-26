/** Catalog US3 - getProducts 検索 統合テスト (AC-1,2,3, FR-011,012,013) */
import { describe, it, expect } from 'vitest';
import { GetProductsInputSchema } from '@/contracts/catalog';

describe('GetProductsInputSchema (検索)', () => {
  describe('Given: q パラメータ付きの入力 (AC-1, FR-011)', () => {
    it('Then: スキーマが q を受け入れ、出力に含む', () => {
      const result = GetProductsInputSchema.safeParse({ q: 'Tシャツ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('q', 'Tシャツ');
      }
    });
  });

  describe('Given: q が空文字の入力 (AC-3, FR-013)', () => {
    it('Then: スキーマが q="" を受け入れる', () => {
      const result = GetProductsInputSchema.safeParse({ q: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('Given: q なしの入力 (AC-3, FR-013)', () => {
    it('Then: スキーマが q なしを受け入れる（オプショナル）', () => {
      const result = GetProductsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBeUndefined();
      }
    });
  });
});
