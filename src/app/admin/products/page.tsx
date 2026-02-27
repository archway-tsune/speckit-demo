'use client';
import { useFetch, DataView } from '@/components';
import { ProductTable } from '@/domains/products/ui';
import type { GetAdminProductsOutput } from '@/contracts/products';

export default function AdminProductsPage() {
  const { data, isLoading, error, refetch } = useFetch<GetAdminProductsOutput>(
    '/api/admin/products',
    undefined,
    { loginUrl: '/admin/login' },
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        loadingMessage="商品を読み込み中..."
        emptyMessage="商品がありません"
        emptyCheck={(d) => d.products.length === 0}
        emptyActionLabel="新規登録"
        emptyOnAction={() => { window.location.href = '/admin/products/new'; }}
      >
        {(d) => (
          <ProductTable
            products={d.products}
            pagination={d.pagination}
            onEdit={(id) => { window.location.href = `/admin/products/${id}/edit`; }}
            onDelete={() => refetch()}
            onStatusChange={async (id, status) => {
              await fetch(`/api/admin/products/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
              });
              refetch();
            }}
            onPageChange={() => refetch()}
            onNewProduct={() => { window.location.href = '/admin/products/new'; }}
          />
        )}
      </DataView>
    </div>
  );
}
