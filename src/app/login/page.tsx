'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LoginPage } from '@/components/pages/login';
import { validateCallbackUrl } from '@/foundation/auth/callback-url';

export default function BuyerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <LoginPage
      title="ログイン"
      apiEndpoint="/api/auth/login"
      onSuccess={() => {
        router.push(
          validateCallbackUrl(searchParams.get('callbackUrl'), {
            defaultUrl: '/catalog',
            role: 'buyer',
          })
        );
        router.refresh();
      }}
    />
  );
}
