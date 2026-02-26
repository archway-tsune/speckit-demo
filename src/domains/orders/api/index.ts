/**
 * Orders ドメイン - API スタブ実装
 * 本番実装で置き換え予定。すべての関数は NotImplementedError をスローする。
 */
import type { SessionData } from '@/foundation/auth/session';
import type {
  OrderRepository,
  CartFetcher,
  GetOrdersOutput,
  GetOrderByIdOutput,
  CreateOrderOutput,
  UpdateOrderStatusOutput,
} from '@/contracts/orders';
import { AppError, ErrorCode } from '@/foundation/errors/handler';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';

// re-export for consumers
export { NotImplementedError, NotFoundError };

/**
 * Orders ドメインコンテキスト
 */
export interface OrdersContext {
  session: SessionData;
  repository: OrderRepository;
  cartFetcher: CartFetcher;
}

/**
 * カート空エラー
 */
export class EmptyCartError extends AppError {
  constructor(message = 'カートが空です') {
    super(ErrorCode.VALIDATION_ERROR, message);
    this.name = 'EmptyCartError';
  }
}

/**
 * 不正なステータス遷移エラー
 */
export class InvalidStatusTransitionError extends AppError {
  constructor(message = '不正なステータス遷移です') {
    super(ErrorCode.VALIDATION_ERROR, message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export function getOrders(_rawInput: unknown, _context: OrdersContext): Promise<GetOrdersOutput> {
  throw new NotImplementedError('orders', 'getOrders');
}

export function getOrderById(_rawInput: unknown, _context: OrdersContext): Promise<GetOrderByIdOutput> {
  throw new NotImplementedError('orders', 'getOrderById');
}

export function createOrder(_rawInput: unknown, _context: OrdersContext): Promise<CreateOrderOutput> {
  throw new NotImplementedError('orders', 'createOrder');
}

export function updateOrderStatus(_rawInput: unknown, _context: OrdersContext): Promise<UpdateOrderStatusOutput> {
  throw new NotImplementedError('orders', 'updateOrderStatus');
}
