'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { adminNavLinks } from './nav';

export default function ProductionAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout
      siteName="EC Site 管理"
      navLinks={adminNavLinks}
      sessionEndpoint="/api/auth/session"
      loginPath="/admin/login"
      logoutPath="/admin/logout"
      authPathPattern={/\/admin\/(login|logout)$/}
    >
      {children}
    </AdminLayout>
  );
}
