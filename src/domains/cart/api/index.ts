/**
 * Cart ドメイン - API 実装
 */
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import type { SessionData } from '@/foundation/auth/session';
import type {
  CartRepository,
  ProductFetcher,
  GetCartOutput,
  AddToCartOutput,
  UpdateCartItemOutput,
  RemoveFromCartOutput,
} from '@/contracts/cart';
import { AddToCartInputSchema, GetCartInputSchema, UpdateCartItemInputSchema, RemoveFromCartInputSchema } from '@/contracts/cart';
import { AppError, ErrorCode } from '@/foundation/errors/handler';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';
import { ForbiddenError } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';

// re-export for consumers
export { NotImplementedError, NotFoundError };

/**
 * Cart ドメインコンテキスト
 */
export interface CartContext {
  session: SessionData;
  repository: CartRepository;
  productFetcher: ProductFetcher;
}

/**
 * カートアイテム未存在エラー
 */
export class CartItemNotFoundError extends AppError {
  constructor(message = 'カートアイテムが見つかりません') {
    super(ErrorCode.NOT_FOUND, message);
    this.name = 'CartItemNotFoundError';
  }
}

export async function getCart(rawInput: unknown, context: CartContext): Promise<GetCartOutput> {
  if (context.session.role !== 'buyer') {
    throw new ForbiddenError();
  }
  validate(GetCartInputSchema, rawInput);
  let cart = await context.repository.findByUserId(context.session.userId);
  if (!cart) cart = await context.repository.create(context.session.userId);
  return cart;
}

export async function addToCart(rawInput: unknown, context: CartContext): Promise<AddToCartOutput> {
  if (context.session.role !== 'buyer') {
    throw new ForbiddenError();
  }
  const input = validate(AddToCartInputSchema, rawInput);
  const product = await context.productFetcher.findById(input.productId);
  if (!product) throw new NotFoundError('商品が見つかりません');

  const existingCart = await context.repository.findByUserId(context.session.userId);
  const existingItem = existingCart?.items.find((item) => item.productId === input.productId);
  const currentQuantity = existingItem?.quantity ?? 0;

  const quantity = input.quantity ?? 1;
  if (currentQuantity + quantity > product.stock) {
    throw new AppError(ErrorCode.CONFLICT, '在庫不足です');
  }

  return context.repository.addItem(context.session.userId, {
    productId: product.id,
    productName: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    quantity,
  });
}

export async function updateCartItem(rawInput: unknown, context: CartContext): Promise<UpdateCartItemOutput> {
  if (context.session.role !== 'buyer') {
    throw new ForbiddenError();
  }
  const input = validate(UpdateCartItemInputSchema, rawInput);
  const product = await context.productFetcher.findById(input.productId);
  if (!product) throw new NotFoundError('商品が見つかりません');

  if (input.quantity > product.stock) {
    throw new AppError(ErrorCode.CONFLICT, '在庫不足です');
  }

  return context.repository.updateItemQuantity(context.session.userId, input.productId, input.quantity);
}

export async function removeFromCart(rawInput: unknown, context: CartContext): Promise<RemoveFromCartOutput> {
  if (context.session.role !== 'buyer') {
    throw new ForbiddenError();
  }
  const input = validate(RemoveFromCartInputSchema, rawInput);
  return context.repository.removeItem(context.session.userId, input.productId);
}
