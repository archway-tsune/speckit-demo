/** productFetcher - 統合テスト: 商品ステータスによるフィルタリングを検証 */
import { describe, it, expect, beforeEach } from 'vitest';
import { productFetcher } from '@/samples/infrastructure/repositories/cart';
import { resetProductStore } from '@/samples/infrastructure/repositories/product';

describe('productFetcher ステータスフィルタリング', () => {
  beforeEach(() => {
    resetProductStore();
  });

  describe('Given: published ステータスの商品（プレミアムTシャツ）', () => {
    const publishedProductId = '550e8400-e29b-41d4-a716-446655440000';

    describe('When: findById で取得する', () => {
      it('Then: 商品情報を返す', async () => {
        const result = await productFetcher.findById(publishedProductId);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(publishedProductId);
        expect(result!.name).toBeDefined();
        expect(result!.price).toBeGreaterThan(0);
      });
    });
  });

  describe('Given: draft ステータスの商品（デニムパンツ）', () => {
    const draftProductId = '550e8400-e29b-41d4-a716-446655440005';

    describe('When: findById で取得する', () => {
      it('Then: null を返す（非公開商品はカートに追加不可）', async () => {
        const result = await productFetcher.findById(draftProductId);
        expect(result).toBeNull();
      });
    });
  });

  describe('Given: 存在しない商品 ID', () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655449999';

    describe('When: findById で取得する', () => {
      it('Then: null を返す', async () => {
        const result = await productFetcher.findById(nonExistentId);
        expect(result).toBeNull();
      });
    });
  });
});
