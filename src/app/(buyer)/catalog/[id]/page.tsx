'use client';
/** ProductDetailPage - 商品詳細ページ */
import { useRouter, useParams } from 'next/navigation';
import { ProductDetail } from '@/domains/catalog/ui';
import { DataView } from '@/components/data-display/DataView';
import { useFetch } from '@/components/hooks/useFetch';
import type { Product } from '@/contracts/catalog';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading, error } = useFetch<Product>(
    `/api/catalog/products/${params.id}`,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        data={product}
        isLoading={isLoading}
        error={error ?? undefined}
        loadingMessage="商品情報を読み込み中..."
      >
        {(p) => (
          <ProductDetail
            product={p}
            onBack={() => router.push('/catalog')}
          />
        )}
      </DataView>
    </div>
  );
}
