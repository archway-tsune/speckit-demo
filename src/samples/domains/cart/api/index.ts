/** Cart ドメイン - ユースケース（authorize → validate → ビジネスロジック） */
import type { Session } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
import {
  GetCartInputSchema, AddToCartInputSchema,
  UpdateCartItemInputSchema, RemoveFromCartInputSchema,
  type GetCartOutput, type AddToCartOutput,
  type UpdateCartItemOutput, type RemoveFromCartOutput,
  type CartRepository, type ProductFetcher,
} from '@/samples/contracts/cart';

export type { CartRepository, ProductFetcher } from '@/samples/contracts/cart';

export interface CartContext {
  session: Session;
  repository: CartRepository;
  productFetcher: ProductFetcher;
}

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export class CartItemNotFoundError extends Error {
  constructor(productId: string) {
    super(`カート内に商品が見つかりません: ${productId}`);
    this.name = 'CartItemNotFoundError';
  }
}

export async function getCart(rawInput: unknown, context: CartContext): Promise<GetCartOutput> {
  authorize(context.session, 'buyer');
  validate(GetCartInputSchema, rawInput);
  let cart = await context.repository.findByUserId(context.session.userId);
  if (!cart) cart = await context.repository.create(context.session.userId);
  return cart;
}

export async function addToCart(rawInput: unknown, context: CartContext): Promise<AddToCartOutput> {
  authorize(context.session, 'buyer');
  const input = validate(AddToCartInputSchema, rawInput);
  const product = await context.productFetcher.findById(input.productId);
  if (!product) throw new NotFoundError('商品が見つかりません');
  return context.repository.addItem(context.session.userId, {
    productId: product.id, productName: product.name,
    price: product.price, imageUrl: product.imageUrl,
    quantity: input.quantity ?? 1,
  });
}

export async function updateCartItem(rawInput: unknown, context: CartContext): Promise<UpdateCartItemOutput> {
  authorize(context.session, 'buyer');
  const input = validate(UpdateCartItemInputSchema, rawInput);
  const existingCart = await context.repository.findByUserId(context.session.userId);
  if (!existingCart) throw new CartItemNotFoundError(input.productId);
  if (!existingCart.items.some((item) => item.productId === input.productId)) {
    throw new CartItemNotFoundError(input.productId);
  }
  return context.repository.updateItemQuantity(context.session.userId, input.productId, input.quantity);
}

export async function removeFromCart(rawInput: unknown, context: CartContext): Promise<RemoveFromCartOutput> {
  authorize(context.session, 'buyer');
  const input = validate(RemoveFromCartInputSchema, rawInput);
  const existingCart = await context.repository.findByUserId(context.session.userId);
  if (!existingCart) throw new CartItemNotFoundError(input.productId);
  if (!existingCart.items.some((item) => item.productId === input.productId)) {
    throw new CartItemNotFoundError(input.productId);
  }
  return context.repository.removeItem(context.session.userId, input.productId);
}
