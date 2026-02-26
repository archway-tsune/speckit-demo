'use client';
/** OrderDetail - 注文詳細表示 */
import React from 'react';
import type { Order } from '@/samples/contracts/orders';
import { BackButton } from '@/components/navigation/BackButton';
import { formatPrice, formatDateTime } from '@/components/utils/format';
import { orderStatusLabels, orderStatusColors } from './constants';

export interface OrderDetailProps {
  order: Order;
  onBack?: () => void;
}

export function OrderDetail({ order, onBack }: OrderDetailProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {onBack && <BackButton label="注文一覧に戻る" onClick={onBack} />}
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        <div className="mb-6 flex items-start justify-between border-b border-base-900/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-base-900">注文詳細</h1>
            <p className="mt-1 text-sm text-base-900/60">注文ID: {order.id}</p>
            <p className="text-sm text-base-900/60">注文日時: {formatDateTime(order.createdAt)}</p>
          </div>
          <span data-testid="order-status" className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${orderStatusColors[order.status]}`}>{orderStatusLabels[order.status]}</span>
        </div>
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-base-900">注文商品</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-base-900/10 pb-4 last:border-0">
                <div>
                  <p className="font-medium text-base-900">{item.productName}</p>
                  <p className="text-sm text-base-900/60">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-base-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-base-900/10 pt-6">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>
    </div>
  );
}
