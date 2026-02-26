'use client';

import { LogoutPage } from '@/components/pages/logout';

export default function AdminLogoutPage() {
  return (
    <LogoutPage
      title="管理者ログアウト"
      logoutEndpoint="/sample/api/auth/logout"
      redirectUrl="/sample/admin/login"
    />
  );
}
