'use client';
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated,
//              Forbidden, LoginPage, LogoutPage, isAdmin, isBuyer, allowAny,
//              AdminLayout, BuyerLayout, orderStatusLabels, orderStatusColors (@/components)
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatPrice, formatDateTime, deserializeDates } from '@/components/utils/format';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import { BackButton } from '@/components/navigation/BackButton';
import { AlertBanner } from '@/components/feedback/AlertBanner';
import { Button } from '@/components/form';
import { orderStatusLabels } from '@/components/data-display/order-status';
import { OrderStateMachine } from '@/domains/orders/api/state-machine';
import type { Order } from '@/contracts/orders';

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rawOrder, isLoading, refetch } = useFetch<Order>(
    `/api/orders/${params.id}`,
    undefined,
    { loginUrl: '/admin/login' },
  );
  const order = useMemo(() => rawOrder ? deserializeDates(rawOrder) : null, [rawOrder]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (order) setSelectedStatus(order.status);
  }, [order]);

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) return;
    setIsUpdating(true);
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        refetch();
        setMessage('ステータスを更新しました');
      } else {
        setMessage(data.error?.message || 'ステータスの更新に失敗しました');
      }
    } catch {
      setMessage('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <BackButton label="注文一覧に戻る" onClick={() => router.push('/admin/orders')} />
      <h1 className="mb-8 text-3xl font-bold text-base-900">注文詳細</h1>
      <DataView
        data={order}
        isLoading={isLoading}
        loadingMessage="注文情報を読み込み中..."
      >
        {(o) => {
          const allowedTransitions = OrderStateMachine.getAllowedTransitions(o.status);
          return (
            <>
              <AlertBanner
                variant={message.includes('失敗') ? 'error' : 'success'}
                message={message}
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-base-900/10 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-base-900">注文情報</h2>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-base-900/60">注文ID</dt>
                      <dd className="mt-1 font-medium">{o.id}</dd>
                    </div>
                    <div>
                      <dt className="text-base-900/60">注文日時</dt>
                      <dd className="mt-1">{formatDateTime(o.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-base-900/60">更新日時</dt>
                      <dd className="mt-1">{formatDateTime(o.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-lg border border-base-900/10 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-base-900">顧客情報</h2>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-base-900/60">ユーザーID</dt>
                      <dd className="mt-1 font-medium">{o.userId}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-base-900/10 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-base-900">注文商品</h2>
                <div className="space-y-4">
                  {o.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-base-900/10 pb-4 last:border-0">
                      <div>
                        <p className="font-medium text-base-900">{item.productName}</p>
                        <p className="text-sm text-base-900/60">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-base-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-base-900/10 pt-4">
                  <p className="text-lg font-semibold text-base-900">合計</p>
                  <p className="text-2xl font-bold text-base-900">{formatPrice(o.totalAmount)}</p>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-base-900/10 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-base-900">ステータス更新</h2>
                <div className="flex items-center gap-4">
                  <span data-testid="order-status" className="rounded-full bg-base-100 px-3 py-1 text-sm font-medium">
                    {orderStatusLabels[o.status]}
                  </span>
                  <span className="text-base-900/40">→</span>
                  <select
                    data-testid="status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="rounded-md border border-base-900/20 px-4 py-2 text-sm"
                  >
                    <option value={o.status}>{orderStatusLabels[o.status]}</option>
                    {allowedTransitions.map((s) => (
                      <option key={s} value={s}>{orderStatusLabels[s]}</option>
                    ))}
                  </select>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || selectedStatus === o.status}
                  >
                    {isUpdating ? '更新中...' : 'ステータス更新'}
                  </Button>
                </div>
              </div>
            </>
          );
        }}
      </DataView>
    </div>
  );
}
