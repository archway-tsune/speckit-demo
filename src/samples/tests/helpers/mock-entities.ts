/** 共通エンティティ・リポジトリモックヘルパー */
import { vi } from 'vitest';
import { ProductSchema, type Product } from '@/samples/contracts/catalog';
import { CartSchema, CartItemSchema, type Cart, type CartItem } from '@/samples/contracts/cart';
import { OrderSchema, type Order } from '@/samples/contracts/orders';
import type { ProductRepository } from '@/samples/domains/catalog/api';
import type { CartRepository, ProductFetcher } from '@/samples/domains/cart/api';
import type { OrderRepository, CartFetcher } from '@/samples/domains/orders/api';

export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000', name: 'テスト商品', price: 1000,
    description: '商品の説明', imageUrl: 'https://example.com/image.jpg', status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'), updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });
}

export function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return CartItemSchema.parse({
    productId: '550e8400-e29b-41d4-a716-446655440001', productName: 'テスト商品',
    price: 1000, quantity: 1, addedAt: new Date(), ...overrides,
  });
}

export function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return CartSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001', userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [], subtotal: 0, itemCount: 0, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

export function createMockOrder(overrides: Partial<Order> = {}): Order {
  return OrderSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440001', userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [{ productId: '550e8400-e29b-41d4-a716-446655440002', productName: 'テスト商品', price: 1000, quantity: 1 }],
    totalAmount: 1000, status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

export function createMockProductRepository(): ProductRepository {
  return { findAll: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() };
}

export function createMockCartRepository(): CartRepository {
  return { findByUserId: vi.fn(), create: vi.fn(), addItem: vi.fn(), updateItemQuantity: vi.fn(), removeItem: vi.fn() };
}

export function createMockProductFetcher(): ProductFetcher {
  return { findById: vi.fn() };
}

export function createMockOrderRepository(): OrderRepository {
  return { findAll: vi.fn(), findById: vi.fn(), create: vi.fn(), updateStatus: vi.fn(), count: vi.fn() };
}

export function createMockCartFetcher(): CartFetcher {
  return { getByUserId: vi.fn(), clear: vi.fn() };
}
