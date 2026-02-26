'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { adminNavLinks } from './nav';

export default function SampleAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout
      siteName="EC Site 管理"
      navLinks={adminNavLinks}
      sessionEndpoint="/sample/api/auth/session"
      loginPath="/sample/admin/login"
      logoutPath="/sample/admin/logout"
      authPathPattern={/\/admin\/(login|logout)$/}
    >
      {children}
    </AdminLayout>
  );
}
