'use client';
/** ProductList - 商品一覧表示 */
import React from 'react';
import type { Product } from '@/samples/contracts/catalog';
import { Pagination, type PaginationData } from '@/components/navigation/Pagination';
import { ProductCard } from './ProductCard';

export interface ProductListProps {
  products: Product[];
  pagination: PaginationData | null;
  basePath?: string;
  onPageChange?: (page: number) => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductList({ products, pagination, basePath = '', onPageChange, onAddToCart }: ProductListProps) {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
            linkHref={`${basePath}/catalog/${product.id}`}
            onAddToCart={onAddToCart ? () => onAddToCart(product.id) : undefined}
          />
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
