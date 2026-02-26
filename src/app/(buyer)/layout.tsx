'use client';

import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { buyerNavLinks } from './nav';

export default function ProductionBuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuyerLayout
      navLinks={buyerNavLinks}
      sessionEndpoint="/api/auth/session"
      cartEndpoint="/api/cart"
      loginPath="/login"
      logoutPath="/logout"
      homeUrl="/"
      cartUrl="/cart"
    >
      {children}
    </BuyerLayout>
  );
}
