'use client';
/** EditProductPage - 商品編集ページ */
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/samples/contracts/catalog';
import { useFetch } from '@/components/hooks/useFetch';
import { useFormSubmit } from '@/components/hooks/useFormSubmit';
import { AlertBanner } from '@/components/feedback/AlertBanner';
import { Button } from '@/components/form';

const inputClass = 'w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useFetch<Product>(`/sample/api/catalog/products/${params.id}`, undefined, { loginUrl: '/sample/login' });
  const { isSubmitting, error, submit } = useFormSubmit();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get('name') as string, price: Number(formData.get('price')), description: formData.get('description') as string };
    submit(async () => {
      const res = await fetch(`/sample/api/catalog/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { router.push('/sample/admin/products'); }
      else { throw new Error(result.error?.message || '商品の更新に失敗しました'); }
    });
  };

  if (isLoading) return <div><h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1><p className="text-base-900/60">読み込み中...</p></div>;
  if (!product) return <div><h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1><p className="text-red-600">商品が見つかりません</p></div>;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1>
      <form onSubmit={handleSubmit} className="max-w-xl">
        <AlertBanner variant="error" message={error} />
        <div className="space-y-4 rounded-lg border border-base-900/10 bg-white p-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-base-900">商品名 *</label>
            <input type="text" id="name" name="name" defaultValue={product.name} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-base-900">価格 *</label>
            <input type="number" id="price" name="price" defaultValue={product.price} required min="0" className={inputClass} />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-base-900">説明</label>
            <textarea id="description" name="description" defaultValue={product.description || ''} rows={4} className={inputClass} />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" onClick={() => router.push('/sample/admin/products')}>キャンセル</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
