'use client';

import { useState, useCallback } from 'react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import type { SessionData } from '@/components/layouts/BuyerLayout';
import { SessionProvider } from './session-context';
import { buyerNavLinks } from './nav';

export default function SampleBuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionRole, setSessionRole] = useState<'buyer' | 'admin' | null>(null);

  const handleSessionChange = useCallback((session: SessionData | null) => {
    setSessionRole((session?.role as 'buyer' | 'admin') ?? null);
  }, []);

  return (
    <BuyerLayout
      navLinks={buyerNavLinks}
      footerLinks={[
        { href: '/sample/privacy', label: 'プライバシーポリシー' },
        { href: '/sample/terms', label: '利用規約' },
      ]}
      sessionEndpoint="/sample/api/auth/session"
      cartEndpoint="/sample/api/cart"
      loginPath="/sample/login"
      logoutPath="/sample/logout"
      homeUrl="/sample"
      cartUrl="/sample/cart"
      onSessionChange={handleSessionChange}
    >
      <SessionProvider role={sessionRole}>
        {children}
      </SessionProvider>
    </BuyerLayout>
  );
}
