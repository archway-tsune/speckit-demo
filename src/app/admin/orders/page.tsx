'use client';
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated,
//              Forbidden, LoginPage, LogoutPage, isAdmin, isBuyer, allowAny,
//              AdminLayout, BuyerLayout, orderStatusLabels, orderStatusColors (@/components)
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice, formatDateTime, deserializeDates } from '@/components/utils/format';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import { orderStatusLabels } from '@/components/data-display/order-status';
import type { GetOrdersOutput } from '@/contracts/orders';

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const fetchParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [statusFilter]);

  const { data, isLoading } = useFetch<GetOrdersOutput>(
    '/api/orders',
    fetchParams,
    { loginUrl: '/admin/login' },
  );

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    router.push(`/admin/orders${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-base-900">注文管理</h1>
        <select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="rounded-md border border-base-900/20 px-4 py-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="pending">処理待ち</option>
          <option value="confirmed">確定済み</option>
          <option value="shipped">発送済み</option>
          <option value="delivered">配達完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>
      <DataView
        data={data}
        isLoading={isLoading}
        loadingMessage="注文を読み込み中..."
        emptyCheck={(d) => d.orders.length === 0}
        emptyMessage="注文がありません"
      >
        {(d) => {
          const orders = d.orders.map(deserializeDates);
          return (
            <div className="rounded-lg border border-base-900/10 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-900/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">注文ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">注文日時</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">商品数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">合計</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      data-testid="order-row"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="cursor-pointer border-b border-base-900/10 last:border-0 hover:bg-base-50"
                    >
                      <td className="px-4 py-3 text-sm">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">{order.items.length}点</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span data-testid="order-status" className="rounded-full bg-base-100 px-3 py-1 text-xs font-medium">
                          {orderStatusLabels[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </DataView>
    </div>
  );
}
