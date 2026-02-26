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
      apiEndpoint="/sample/api/auth/login"
      roleCheck={isAdmin}
      roleErrorMessage="管理者権限がありません"
      logoutEndpoint="/sample/api/auth/logout"
      onSuccess={() => {
        router.push(
          validateCallbackUrl(searchParams.get('callbackUrl'), {
            defaultUrl: '/sample/admin',
            role: 'admin',
          })
        );
        router.refresh();
      }}
    />
  );
}
