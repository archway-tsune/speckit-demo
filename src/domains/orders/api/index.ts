/**
 * Orders ドメイン - API 実装
 */
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated,
//              Forbidden, LoginPage, LogoutPage, isAdmin, isBuyer, allowAny,
//              AdminLayout, BuyerLayout, orderStatusLabels, orderStatusColors (@/components)
import type { SessionData } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
import type {
  OrderRepository,
  CartFetcher,
  GetOrdersOutput,
  GetOrderByIdOutput,
  CreateOrderOutput,
  UpdateOrderStatusOutput,
} from '@/contracts/orders';
import { CreateOrderInputSchema, GetOrdersInputSchema, GetOrderByIdInputSchema, UpdateOrderStatusInputSchema } from '@/contracts/orders';
import { AppError, ErrorCode } from '@/foundation/errors/handler';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';
import { OrderStateMachine, InvalidStatusTransitionError } from './state-machine';

// re-export for consumers
export { NotImplementedError, NotFoundError, InvalidStatusTransitionError };

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

export async function getOrders(rawInput: unknown, context: OrdersContext): Promise<GetOrdersOutput> {
  const input = validate(GetOrdersInputSchema, rawInput);
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const userId = context.session.role === 'buyer' ? context.session.userId : input.userId;
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    context.repository.findAll({ userId, status: input.status, offset, limit }),
    context.repository.count({ userId, status: input.status }),
  ]);
  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOrderById(rawInput: unknown, context: OrdersContext): Promise<GetOrderByIdOutput> {
  const input = validate(GetOrderByIdInputSchema, rawInput);
  const order = await context.repository.findById(input.id);
  if (!order) throw new NotFoundError('注文が見つかりません');
  if (context.session.role === 'buyer' && order.userId !== context.session.userId) {
    throw new NotFoundError('注文が見つかりません');
  }
  return order;
}

export async function createOrder(rawInput: unknown, context: OrdersContext): Promise<CreateOrderOutput> {
  authorize(context.session, 'buyer');
  validate(CreateOrderInputSchema, rawInput);

  const cart = await context.cartFetcher.getByUserId(context.session.userId);
  if (!cart || cart.items.length === 0) throw new EmptyCartError();

  const subtotal = cart.subtotal;
  const tax = Math.floor(subtotal * 0.1);
  const totalAmount = subtotal + tax;

  const order = await context.repository.create({
    userId: context.session.userId,
    items: cart.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal,
    tax,
    totalAmount,
    status: 'pending',
  });

  await context.cartFetcher.clear(context.session.userId);
  return order;
}

export async function updateOrderStatus(rawInput: unknown, context: OrdersContext): Promise<UpdateOrderStatusOutput> {
  authorize(context.session, 'admin');
  const input = validate(UpdateOrderStatusInputSchema, rawInput);
  const order = await context.repository.findById(input.id);
  if (!order) throw new NotFoundError('注文が見つかりません');
  OrderStateMachine.transition(order.status, input.status);
  return context.repository.updateStatus(input.id, input.status);
}
