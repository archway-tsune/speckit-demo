'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { OrderDetail } from '@/domains/orders/ui';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import { deserializeDates } from '@/components/utils/format';
import type { Order } from '@/contracts/orders';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCompleted = searchParams.get('completed') === 'true';

  const { data, isLoading, error } = useFetch<Order>(
    `/api/orders/${params.id}`,
    undefined,
    { loginUrl: '/login' },
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {isCompleted && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-center text-green-800" data-testid="order-complete-message">
          ご注文ありがとうございます
        </div>
      )}
      <DataView
        data={data}
        isLoading={isLoading}
        error={error ?? undefined}
        loadingMessage="注文情報を読み込み中..."
      >
        {(d) => {
          const order = deserializeDates(d);
          return <OrderDetail order={order} onBack={() => router.push('/orders')} />;
        }}
      </DataView>
    </div>
  );
}
