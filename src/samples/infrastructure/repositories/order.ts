/**
 * インメモリ注文リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Order, OrderStatus } from '@/samples/contracts/orders';
import type { Cart } from '@/samples/contracts/cart';
import type { OrderRepository, CartFetcher } from '@/samples/contracts/orders';
import { cartRepository, clearCart } from './cart';
import { createHmrSafeUserStore } from '@/templates/infrastructure/repository';
import { generateId } from '@/infrastructure/id';

// HMR対応ストア（Layer 2 テンプレート利用）
const orders = createHmrSafeUserStore<Order>('__sample_orderStore');

export const orderRepository: OrderRepository = {
  async findAll(params) {
    let items = Array.from(orders.values());

    if (params.userId) {
      items = items.filter((o) => o.userId === params.userId);
    }

    if (params.status) {
      items = items.filter((o) => o.status === params.status);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(params.offset, params.offset + params.limit);
  },

  async findById(id) {
    return orders.get(id) || null;
  },

  async create(data) {
    const now = new Date();
    const order: Order = {
      id: generateId(),
      userId: data.userId,
      items: data.items,
      totalAmount: data.totalAmount,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    orders.set(order.id, order);
    return order;
  },

  async updateStatus(id, status) {
    const order = orders.get(id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();

    orders.set(id, order);
    return order;
  },

  async count(params) {
    let items = Array.from(orders.values());

    if (params.userId) {
      items = items.filter((o) => o.userId === params.userId);
    }

    if (params.status) {
      items = items.filter((o) => o.status === params.status);
    }

    return items.length;
  },
};

export const cartFetcher: CartFetcher = {
  async getByUserId(userId) {
    return cartRepository.findByUserId(userId);
  },

  async clear(userId) {
    clearCart(userId);
  },
};

// テスト用：注文ストアをリセット
export function resetOrderStore(): void {
  orders.clear();
}
