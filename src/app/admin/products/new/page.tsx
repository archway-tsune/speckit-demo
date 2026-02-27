'use client';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/domains/products/ui';
import type { CreateProductInput } from '@/contracts/products';

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateProductInput) {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? '登録に失敗しました');
    }
    router.push('/admin/products');
  }

  function handleCancel() {
    router.push('/admin/products');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
