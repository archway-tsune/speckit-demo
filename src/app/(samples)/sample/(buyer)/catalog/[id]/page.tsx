'use client';
/** ProductDetailPage - 商品詳細ページ */
import { useRouter, useParams } from 'next/navigation';
import { ProductDetail } from '@/samples/domains/catalog/ui/ProductDetail';
import { DataView } from '@/components/data-display/DataView';
import { useToast } from '@/components/feedback/Toast';
import { useFetch } from '@/components/hooks/useFetch';
import { emitCartUpdated } from '@/components/utils/events';
import { useSessionRole } from '../../session-context';
import type { Product } from '@/samples/contracts/catalog';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const role = useSessionRole();

  const { data: product, isLoading, error } = useFetch<Product>(
    `/sample/api/catalog/products/${params.id}`,
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
    } catch { showToast('カートへの追加に失敗しました', 'error'); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        data={product}
        isLoading={isLoading}
        error={error ?? undefined}
        loadingMessage="商品情報を読み込み中..."
      >
        {(p) => <ProductDetail product={p} onAddToCart={role !== 'admin' ? handleAddToCart : undefined} onBack={() => router.push('/sample/catalog')} />}
      </DataView>
    </div>
  );
}
