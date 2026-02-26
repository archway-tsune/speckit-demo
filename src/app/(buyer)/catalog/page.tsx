'use client';
/** CatalogPage - 商品一覧ページ */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductList } from '@/domains/catalog/ui';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import type { GetProductsOutput } from '@/contracts/catalog';

export default function CatalogPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const params: Record<string, string> = {
    page: String(currentPage),
    limit: '12',
    status: 'published',
  };
  if (searchQuery) {
    params.q = searchQuery;
  }

  const { data, isLoading, error, refetch } = useFetch<GetProductsOutput>(
    '/api/catalog/products',
    params,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>
      <DataView
        data={data}
        isLoading={isLoading}
        error={error ?? undefined}
        onRetry={() => refetch()}
        loadingMessage="商品を読み込み中..."
      >
        {(d) => (
          <ProductList
            products={d.products}
            pagination={d.pagination}
            onPageChange={(page) => {
              setCurrentPage(page);
            }}
            onSearch={(query) => {
              setSearchQuery(query);
              setCurrentPage(1);
            }}
            searchQuery={searchQuery}
          />
        )}
      </DataView>
    </div>
  );
}
