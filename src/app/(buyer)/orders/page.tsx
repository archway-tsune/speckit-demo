'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderList } from '@/domains/orders/ui';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import type { GetOrdersOutput } from '@/contracts/orders';

export default function OrdersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useFetch<GetOrdersOutput>(
    '/api/orders',
    { page: String(currentPage) },
    { loginUrl: '/login' },
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">注文履歴</h1>
      <DataView
        data={data}
        isLoading={isLoading}
        error={error ?? undefined}
        loadingMessage="注文履歴を読み込み中..."
        emptyCheck={(d) => d.orders.length === 0}
        emptyMessage="注文履歴がありません"
      >
        {(d) => (
          <OrderList
            orders={d.orders}
            pagination={d.pagination}
            onOrderClick={(id) => router.push(`/orders/${id}`)}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </DataView>
    </div>
  );
}
