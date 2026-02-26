'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LoginPage, isAdmin } from '@/components/pages/login';
import { validateCallbackUrl } from '@/foundation/auth/callback-url';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <LoginPage
      title="管理者ログイン"
      apiEndpoint="/api/auth/login"
      roleCheck={isAdmin}
      roleErrorMessage="管理者権限がありません"
      logoutEndpoint="/api/auth/logout"
      onSuccess={() => {
        router.push(
          validateCallbackUrl(searchParams.get('callbackUrl'), {
            defaultUrl: '/admin',
            role: 'admin',
          })
        );
        router.refresh();
      }}
    />
  );
}
