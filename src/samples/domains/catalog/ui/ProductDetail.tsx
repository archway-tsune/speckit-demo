'use client';
/** ProductDetail - 商品詳細表示 */
import React from 'react';
import type { Product } from '@/samples/contracts/catalog';
import { BackButton } from '@/components/navigation/BackButton';
import { ImagePlaceholder } from '@/components/product/ImagePlaceholder';
import { formatPrice } from '@/components/utils/format';
import { Button } from '@/components/form';

export interface ProductDetailProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onBack?: () => void;
}

export function ProductDetail({ product, onAddToCart, onBack }: ProductDetailProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {onBack && <BackButton label="戻る" onClick={onBack} />}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square w-full overflow-hidden rounded-lg">
          <ImagePlaceholder
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full rounded-none object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-base-900">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold text-base-900">{formatPrice(product.price)}</p>
          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-base-900/60">商品説明</h2>
              <p className="mt-2 text-base-900/80">{product.description}</p>
            </div>
          )}
          {onAddToCart && (
            <Button className="mt-8 w-full py-3 text-base" onClick={() => onAddToCart(product.id)}>
              カートに追加
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
