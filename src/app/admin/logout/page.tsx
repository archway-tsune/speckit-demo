'use client';

import { LogoutPage } from '@/components/pages/logout';

export default function AdminLogoutPage() {
  return (
    <LogoutPage
      title="管理者ログアウト"
      logoutEndpoint="/api/auth/logout"
      redirectUrl="/admin/login"
    />
  );
}
