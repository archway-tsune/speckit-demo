'use client';
/** CheckoutPage - 注文確認ページ */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/components/utils/format';
import { useFetch } from '@/components/hooks/useFetch';
import { useFormSubmit } from '@/components/hooks/useFormSubmit';
import { AlertBanner } from '@/components/feedback/AlertBanner';
import type { Cart } from '@/samples/contracts/cart';
import { emitCartUpdated } from '@/components/utils/events';
import { Button } from '@/components/form';

export default function CheckoutPage() {
  const router = useRouter();
  const { isSubmitting, error: submitError, submit } = useFormSubmit();

  const { data: cart, isLoading, error } = useFetch<Cart>(
    '/sample/api/cart',
    undefined,
    { loginUrl: '/sample/login' },
  );

  useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.push('/sample/cart');
    }
  }, [cart, router]);

  const handleSubmitOrder = () => submit(async () => {
    const res = await fetch('/sample/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true }),
    });
    const data = await res.json();
    if (data.success && data.data) {
      emitCartUpdated();
      router.push(`/sample/orders/${data.data.id}?completed=true`);
    } else {
      throw new Error(data.error?.message || '注文の作成に失敗しました');
    }
  });

  const displayError = error ?? submitError;

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-center text-base-900/60">読み込み中...</p></div>;
  if (!cart) return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-center text-base-900/60">カートが見つかりません</p></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">注文確認</h1>
      <AlertBanner variant="error" message={displayError} />
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-base-900">注文商品</h2>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between border-b border-base-900/10 pb-4 last:border-0">
              <div>
                <p className="font-medium text-base-900">{item.productName}</p>
                <p className="text-sm text-base-900/60">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
              <p className="font-bold text-base-900">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-base-900/10 pt-6">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900" data-testid="cart-subtotal">{formatPrice(cart.subtotal)}</p>
        </div>
        <Button className="mt-6 w-full py-3 text-base" onClick={handleSubmitOrder} disabled={isSubmitting}>
          {isSubmitting ? '注文処理中...' : '注文を確定'}
        </Button>
      </div>
    </div>
  );
}
