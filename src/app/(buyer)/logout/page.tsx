'use client';

import { LogoutPage } from '@/components/pages/logout';

export default function BuyerLogoutPage() {
  return (
    <LogoutPage
      title="ログアウト"
      logoutEndpoint="/api/auth/logout"
      redirectUrl="/login"
    />
  );
}
