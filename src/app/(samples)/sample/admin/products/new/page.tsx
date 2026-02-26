'use client';
/** NewProductPage - 商品登録ページ */
import { useRouter } from 'next/navigation';
import { TextInput } from '@/components/form/FormField';
import { TextArea } from '@/components/form/FormField';
import { useFormSubmit } from '@/components/hooks/useFormSubmit';
import { AlertBanner } from '@/components/feedback/AlertBanner';
import { Button } from '@/components/form';

export default function NewProductPage() {
  const router = useRouter();
  const { isSubmitting, error, submit } = useFormSubmit();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get('name') as string, price: Number(formData.get('price')), description: formData.get('description') as string, status: 'draft' };
    submit(async () => {
      const res = await fetch('/sample/api/catalog/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { router.push('/sample/admin/products'); }
      else { throw new Error(result.error?.message || '商品の登録に失敗しました'); }
    });
  };

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品登録</h1>
      <form onSubmit={handleSubmit} className="max-w-xl">
        <AlertBanner variant="error" message={error} />
        <div className="space-y-4 rounded-lg border border-base-900/10 bg-white p-6">
          <TextInput id="name" label="商品名" required type="text" />
          <TextInput id="price" label="価格" required type="number" min={0} />
          <TextArea id="description" label="説明" />
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" onClick={() => router.push('/sample/admin/products')}>キャンセル</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '登録中...' : '登録'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
