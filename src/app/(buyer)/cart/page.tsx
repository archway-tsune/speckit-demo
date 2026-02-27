'use client';
import { CartView } from '@/domains/cart/ui';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import { useToast } from '@/components/feedback/Toast';
import { emitCartUpdated } from '@/components/utils/events';
import type { Cart } from '@/contracts/cart';

export default function CartPage() {
  const { data: cart, isLoading, error, refetch } = useFetch<Cart>('/api/cart');
  const { showToast } = useToast();

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.ok) {
      emitCartUpdated();
      refetch();
    } else {
      const data = await res.json();
      showToast(data.error?.message || '数量の変更に失敗しました', 'error');
    }
  };

  const handleRemove = async (productId: string) => {
    const res = await fetch(`/api/cart/items/${productId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      emitCartUpdated();
      refetch();
    } else {
      const data = await res.json();
      showToast(data.error?.message || '商品の削除に失敗しました', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        data={cart}
        isLoading={isLoading}
        error={error ?? undefined}
        onRetry={() => refetch()}
        loadingMessage="カートを読み込み中..."
      >
        {(cartData) => (
          <CartView
            cart={cartData}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
          />
        )}
      </DataView>
    </div>
  );
}
