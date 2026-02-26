'use client';
/**
 * Catalog ドメイン - UI 実装
 */
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import type { ReactNode } from 'react';
import type { Product, GetProductsOutput } from '@/contracts/catalog';
import type { PaginationData } from '@/components/navigation/Pagination';
import { ProductCard } from '@/components/product/ProductCard';
import { Pagination } from '@/components/navigation/Pagination';
import { ImagePlaceholder } from '@/components/product/ImagePlaceholder';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/form/Button';
import { SearchBar } from '@/components/form/SearchBar';
import { formatPrice } from '@/components/utils/format';
import { NotImplementedError } from '@/foundation/errors/domain-errors';

export interface ProductListProps {
  products: GetProductsOutput['products'];
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export function ProductList({ products, pagination, onPageChange, onSearch, searchQuery }: ProductListProps): ReactNode {
  if (products.length === 0) {
    return (
      <div>
        {onSearch && (
          <div className="mb-6">
            <SearchBar
              onSearch={onSearch}
              defaultValue={searchQuery}
              placeholder="商品名・説明文で検索..."
            />
          </div>
        )}
        <p className="py-16 text-center text-base-900/60">
          {searchQuery ? '該当する商品が見つかりませんでした' : '商品がありません'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {onSearch && (
        <div className="mb-6">
          <SearchBar
            onSearch={onSearch}
            defaultValue={searchQuery}
            placeholder="商品名・説明文で検索..."
          />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="relative">
            {product.stock === 0 && (
              <span className="absolute left-2 top-2 z-10 rounded-full bg-gray-600 px-2 py-1 text-xs font-medium text-white">
                在庫切れ
              </span>
            )}
            <ProductCard
              id={product.id}
              name={product.name}
              price={product.price}
              imageUrl={product.imageUrl}
              linkHref={`/catalog/${product.id}`}
            />
          </div>
        ))}
      </div>
      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export function ProductDetail({ product, onBack }: ProductDetailProps): ReactNode {
  throw new NotImplementedError('catalog', 'ProductDetail');
}
