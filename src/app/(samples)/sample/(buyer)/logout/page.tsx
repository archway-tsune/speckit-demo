'use client';

import { LogoutPage } from '@/components/pages/logout';

export default function BuyerLogoutPage() {
  return (
    <LogoutPage
      logoutEndpoint="/sample/api/auth/logout"
      redirectUrl="/sample/login"
    />
  );
}
