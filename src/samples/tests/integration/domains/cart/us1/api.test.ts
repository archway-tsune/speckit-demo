/** Cart ドメイン - API統合テスト: 契約スキーマとの整合性検証 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCartOutputSchema, AddToCartInputSchema, AddToCartOutputSchema, UpdateCartItemInputSchema } from '@/samples/contracts/cart';
import { getCart, addToCart, updateCartItem, removeFromCart, type CartRepository, type ProductFetcher } from '@/samples/domains/cart/api';
import { createMockSession, createMockCart, createMockCartRepository, createMockProductFetcher } from '@/samples/tests/helpers';

describe('Cart API統合テスト', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;
  beforeEach(() => { repository = createMockCartRepository(); productFetcher = createMockProductFetcher(); });

  describe('getCart', () => {
    it('出力スキーマに準拠したレスポンスを返す', async () => {
      const cart = createMockCart({
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 2, addedAt: new Date() }],
        subtotal: 2000, itemCount: 2,
      });
      vi.mocked(repository.findByUserId).mockResolvedValue(cart);
      const result = await getCart({}, { session: createMockSession(), repository, productFetcher });
      const validated = GetCartOutputSchema.parse(result);
      expect(validated.items).toHaveLength(1);
      expect(validated.subtotal).toBe(2000);
    });
  });

  describe('addToCart', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const validatedInput = AddToCartInputSchema.parse({ productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 2 });
      vi.mocked(productFetcher.findById).mockResolvedValue({ id: validatedInput.productId, name: 'テスト', price: 1000 });
      vi.mocked(repository.addItem).mockResolvedValue(createMockCart());
      await expect(addToCart(validatedInput, { session: createMockSession(), repository, productFetcher })).resolves.not.toThrow();
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      const cart = createMockCart({
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 1, addedAt: new Date() }],
        subtotal: 1000, itemCount: 1,
      });
      vi.mocked(productFetcher.findById).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'テスト商品', price: 1000 });
      vi.mocked(repository.addItem).mockResolvedValue(cart);
      const result = await addToCart({ productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 1 }, { session: createMockSession(), repository, productFetcher });
      const validated = AddToCartOutputSchema.parse(result);
      expect(validated.items).toHaveLength(1);
    });

    it('入力スキーマのバリデーションメッセージを返す', () => {
      const parseResult = AddToCartInputSchema.safeParse({ productId: 'invalid-uuid', quantity: 1 });
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toBe('有効な商品IDを指定してください');
      }
    });
  });

  describe('updateCartItem', () => {
    it('入力スキーマのバリデーションメッセージを返す', () => {
      const parseResult = UpdateCartItemInputSchema.safeParse({ productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 0 });
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.errors[0].message).toBe('数量は1以上で指定してください');
      }
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('商品追加 → 数量更新 → 削除 の流れが正常に動作する', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440002';
      const product = { id: productId, name: 'テスト商品', price: 1000 };
      const cartWithItem = createMockCart({
        items: [{ productId, productName: product.name, price: product.price, quantity: 1, addedAt: new Date() }],
        subtotal: 1000, itemCount: 1,
      });
      const cartUpdated = createMockCart({
        items: [{ productId, productName: product.name, price: product.price, quantity: 3, addedAt: new Date() }],
        subtotal: 3000, itemCount: 3,
      });
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.addItem).mockResolvedValue(cartWithItem);
      vi.mocked(repository.findByUserId).mockResolvedValue(cartWithItem);
      vi.mocked(repository.updateItemQuantity).mockResolvedValue(cartUpdated);
      vi.mocked(repository.removeItem).mockResolvedValue(createMockCart());
      const afterAdd = await addToCart({ productId, quantity: 1 }, { session: createMockSession(), repository, productFetcher });
      expect(afterAdd.items).toHaveLength(1);
      const afterUpdate = await updateCartItem({ productId, quantity: 3 }, { session: createMockSession(), repository, productFetcher });
      expect(afterUpdate.items[0].quantity).toBe(3);
      const afterRemove = await removeFromCart({ productId }, { session: createMockSession(), repository, productFetcher });
      expect(afterRemove.items).toHaveLength(0);
    });
  });
});
