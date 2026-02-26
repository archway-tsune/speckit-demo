'use client';
/** CartPage - カートページ */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartView } from '@/samples/domains/cart/ui/CartView';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import type { Cart } from '@/samples/contracts/cart';
import { emitCartUpdated } from '@/components/utils/events';

export default function CartPage() {
  const router = useRouter();
  const [mutationError, setMutationError] = useState<string | undefined>();

  const { data: cart, isLoading, error, refetch } = useFetch<Cart>(
    '/sample/api/cart',
    undefined,
    { loginUrl: '/sample/login' },
  );

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await fetch(`/sample/api/cart/items/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) { refetch(); emitCartUpdated(); }
      }
    } catch (err) { console.error('カート数量更新エラー:', err); setMutationError('数量の更新に失敗しました'); }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/sample/api/cart/items/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) { refetch(); emitCartUpdated(); }
      }
    } catch (err) { console.error('カート商品削除エラー:', err); setMutationError('商品の削除に失敗しました'); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">カート</h1>
      <DataView
        data={cart}
        isLoading={isLoading}
        error={error ?? mutationError ?? undefined}
        onRetry={() => refetch()}
        loadingMessage="カートを読み込み中..."
        emptyCheck={(d) => d.items.length === 0}
        emptyMessage="カートは空です"
        emptyActionLabel="買い物を続ける"
        emptyOnAction={() => router.push('/sample/catalog')}
      >
        {(c) => <CartView cart={c} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemove} onCheckout={() => router.push('/sample/checkout')} />}
      </DataView>
    </div>
  );
}
