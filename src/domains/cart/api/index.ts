/**
 * Cart ドメイン - API スタブ実装
 * 本番実装で置き換え予定。すべての関数は NotImplementedError をスローする。
 */
import type { SessionData } from '@/foundation/auth/session';
import type {
  CartRepository,
  ProductFetcher,
  GetCartOutput,
  AddToCartOutput,
  UpdateCartItemOutput,
  RemoveFromCartOutput,
} from '@/contracts/cart';
import { AppError, ErrorCode } from '@/foundation/errors/handler';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';

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

export function getCart(_rawInput: unknown, _context: CartContext): Promise<GetCartOutput> {
  throw new NotImplementedError('cart', 'getCart');
}

export function addToCart(_rawInput: unknown, _context: CartContext): Promise<AddToCartOutput> {
  throw new NotImplementedError('cart', 'addToCart');
}

export function updateCartItem(_rawInput: unknown, _context: CartContext): Promise<UpdateCartItemOutput> {
  throw new NotImplementedError('cart', 'updateCartItem');
}

export function removeFromCart(_rawInput: unknown, _context: CartContext): Promise<RemoveFromCartOutput> {
  throw new NotImplementedError('cart', 'removeFromCart');
}
