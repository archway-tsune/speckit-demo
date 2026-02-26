'use client';
/**
 * ProductCard コンポーネント
 * 商品データをカード形式で表示する。商品名・価格・画像（またはプレースホルダー）を表示し、
 * 商品詳細ページへのリンクを提供する。
 *
 * 使用例:
 * - 商品一覧のカード表示
 * - おすすめ商品の表示
 * - 検索結果の商品表示
 */

import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/components/utils/format';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  /** 商品ID */
  id: string;
  /** 商品名 */
  name: string;
  /** 価格 */
  price: number;
  /** 画像URL（未指定時プレースホルダー表示） */
  imageUrl?: string;
  /** リンク先URL */
  linkHref: string;
  /** カート追加コールバック（未指定時ボタン非表示） */
  onAddToCart?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 商品カードコンポーネント
 */
export function ProductCard({ id, name, price, imageUrl, linkHref, onAddToCart }: ProductCardProps) {
  return (
    <div className="group">
      <Link href={linkHref} data-testid="product-card" className="block">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="mb-5 aspect-square w-full rounded-lg object-cover transition-all duration-300 group-hover:opacity-80 group-hover:shadow-md" />
        ) : (
          <div data-testid="product-image-placeholder" className="mb-5 flex aspect-square w-full items-center justify-center rounded-lg bg-white transition-all duration-300 group-hover:shadow-md">
            <svg className="h-12 w-12 text-base-900/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <h3 className="text-base font-medium text-base-900 transition-colors duration-200 group-hover:text-base-900/70">{name}</h3>
        <p className="mt-1 text-sm text-base-900/70">{formatPrice(price)}</p>
      </Link>
      {onAddToCart && (
        <button type="button" onClick={onAddToCart} className="mt-3 w-full rounded-full bg-base-900 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-base-900/85 focus:outline-none focus:ring-2 focus:ring-base-900/20 focus:ring-offset-2">
          カートに追加
        </button>
      )}
    </div>
  );
}
