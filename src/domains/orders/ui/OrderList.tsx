'use client';
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated,
//              Forbidden, LoginPage, LogoutPage, isAdmin, isBuyer, allowAny,
//              AdminLayout, BuyerLayout, orderStatusLabels, orderStatusColors (@/components)
import React from 'react';
import type { Order, GetOrdersOutput } from '@/contracts/orders';
import { Pagination } from '@/components/navigation/Pagination';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { formatPrice, formatDate } from '@/components/utils/format';
import { orderStatusLabels, orderStatusColors } from '@/components/data-display/order-status';

export interface OrderListProps {
  orders: Order[];
  pagination: GetOrdersOutput['pagination'] | null;
  onOrderClick?: (id: string) => void;
  onPageChange?: (page: number) => void;
}

function OrderRow({ order, onOrderClick }: { order: Order; onOrderClick?: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOrderClick?.(order.id)}
      data-testid="order-row"
      className="block w-full rounded-lg border border-base-900/10 bg-white p-4 text-left hover:bg-base-50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-base-900/60">注文ID: {order.id.slice(0, 8)}...</p>
          <p className="mt-1 font-medium text-base-900">{order.items.length}点の商品</p>
          <p className="text-sm text-base-900/60">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <StatusBadge
            status={order.status}
            statusColors={orderStatusColors}
            statusLabels={orderStatusLabels}
          />
          <p className="mt-2 text-lg font-bold text-base-900">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>
    </button>
  );
}

export function OrderList({ orders, pagination, onOrderClick, onPageChange }: OrderListProps) {
  return (
    <div>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} onOrderClick={onOrderClick} />
        ))}
      </div>
      {pagination && (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange ?? (() => {})}
        />
      )}
    </div>
  );
}
