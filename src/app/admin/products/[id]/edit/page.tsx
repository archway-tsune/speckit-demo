'use client';
import { useRouter } from 'next/navigation';
import { useFetch, DataView } from '@/components';
import { ProductForm } from '@/domains/products/ui';
import type { GetAdminProductByIdOutput } from '@/contracts/products';
import type { CreateProductInput } from '@/contracts/products';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const { data, isLoading, error } = useFetch<GetAdminProductByIdOutput>(
    `/api/admin/products/${id}`,
    undefined,
    { loginUrl: '/admin/login' },
  );

  async function handleSubmit(formData: CreateProductInput) {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? '更新に失敗しました');
    }
    router.push('/admin/products');
  }

  function handleCancel() {
    router.push('/admin/products');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        data={data}
        isLoading={isLoading}
        error={error}
        loadingMessage="商品を読み込み中..."
      >
        {(d) => (
          <ProductForm initialValues={d} onSubmit={handleSubmit} onCancel={handleCancel} />
        )}
      </DataView>
    </div>
  );
}
