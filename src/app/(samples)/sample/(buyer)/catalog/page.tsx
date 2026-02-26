'use client';
/** CatalogPage - 商品一覧ページ */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductList } from '@/samples/domains/catalog/ui/ProductList';
import { DataView } from '@/components/data-display/DataView';
import { useToast } from '@/components/feedback/Toast';
import { useFetch } from '@/components/hooks/useFetch';
import { useSessionRole } from '../session-context';
import type { Product } from '@/samples/contracts/catalog';
import { emitCartUpdated } from '@/components/utils/events';

export default function CatalogPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();
  const role = useSessionRole();

  const { data, isLoading, error, refetch } = useFetch<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    '/sample/api/catalog/products',
    { page: String(currentPage), status: 'published' },
  );

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch('/sample/api/cart/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        emitCartUpdated();
        showToast('カートに追加しました', 'success');
      } else if (res.status === 401) {
        router.push('/sample/login');
      } else {
        const data = await res.json();
        showToast(data.error?.message || 'カートへの追加に失敗しました', 'error');
      }
    } catch {
      showToast('カートへの追加に失敗しました', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>
      <DataView
        data={data}
        isLoading={isLoading}
        error={error ?? undefined}
        onRetry={() => refetch()}
        loadingMessage="商品を読み込み中..."
        emptyCheck={(d) => d.products.length === 0}
        emptyMessage="商品がありません"
      >
        {(d) => <ProductList products={d.products} pagination={d.pagination} basePath="/sample" onPageChange={(page) => setCurrentPage(page)} onAddToCart={role !== 'admin' ? handleAddToCart : undefined} />}
      </DataView>
    </div>
  );
}
