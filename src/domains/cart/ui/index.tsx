'use client';
/**
 * Cart ドメイン - CartView UI
 */
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import React, { useState } from 'react';
import Link from 'next/link';
import type { Cart, CartItem } from '@/contracts/cart';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { ImagePlaceholder } from '@/components/product/ImagePlaceholder';
import { formatPrice } from '@/components/utils/format';

export interface CartViewProps {
  cart: Cart;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRequestRemove }: {
  item: CartItem;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRequestRemove?: (productId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-base-900/10 py-4">
      <ImagePlaceholder src={item.imageUrl} alt={item.productName} size="sm" />
      <div className="flex-1">
        <h3 className="font-medium text-base-900">{item.productName}</h3>
        <p className="text-lg font-bold text-base-900">{formatPrice(item.price)}</p>
      </div>
      <QuantitySelector
        value={item.quantity}
        min={1}
        max={99}
        onChange={(newQuantity) => onUpdateQuantity?.(item.productId, newQuantity)}
      />
      <div className="w-24 text-right">
        <p className="font-bold text-base-900">{formatPrice(item.price * item.quantity)}</p>
      </div>
      <button
        type="button"
        onClick={() => onRequestRemove?.(item.productId)}
        className="rounded-md p-2 text-base-900/60 hover:bg-base-100 hover:text-base-900"
        aria-label={`${item.productName}を削除`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export function CartView({ cart, onUpdateQuantity, onRemove }: CartViewProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-base-900/10 bg-white p-12 text-center">
          <p className="mb-4 text-base-900/60">カートに商品がありません</p>
          <Link href="/catalog" className="text-base-900 underline hover:text-base-900/80">
            商品一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const tax = Math.floor(cart.subtotal * 0.1);
  const total = cart.subtotal + tax;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRequestRemove={(productId) => setPendingRemoveId(productId)}
          />
        ))}
        <div className="mt-6 space-y-2 border-t border-base-900/10 pt-6">
          <div className="flex justify-between text-sm text-base-900/60">
            <span>商品合計</span>
            <span data-testid="cart-subtotal">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-base-900/60">
            <span>消費税（10%）</span>
            <span data-testid="cart-tax">{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-base-900/10 pt-2 text-lg font-bold text-base-900">
            <span>合計</span>
            <span data-testid="cart-total">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={pendingRemoveId !== null}
        message="この商品をカートから削除しますか？"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={() => {
          if (pendingRemoveId) {
            onRemove?.(pendingRemoveId);
          }
          setPendingRemoveId(null);
        }}
        onCancel={() => setPendingRemoveId(null)}
      />
    </div>
  );
}
