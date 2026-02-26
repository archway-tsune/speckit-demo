/**
 * 購入者レイアウトテンプレート
 *
 * 使用例:
 * - ECサイトの購入者向けページ
 * - カタログ・カート・注文履歴などの画面
 *
 * カスタマイズポイント:
 * - navLinks: ヘッダーのナビゲーションリンク
 * - footerLinks: フッターのリンク
 * - sessionEndpoint: セッション確認APIのエンドポイント
 * - cartEndpoint: カート取得APIのエンドポイント
 * - siteName: サイト名
 */
'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { ToastProvider } from '@/components/feedback/Toast';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
}

export interface SessionData {
  userId: string;
  role: string;
  name: string;
}

export interface BuyerLayoutProps {
  children: ReactNode;
  /** サイト名 */
  siteName?: string;
  /** ナビゲーションリンク */
  navLinks?: NavLink[];
  /** フッターリンク */
  footerLinks?: NavLink[];
  /** フッターコピーライト */
  copyright?: string;
  /** セッション確認APIエンドポイント */
  sessionEndpoint?: string;
  /** カート取得APIエンドポイント */
  cartEndpoint?: string;
  /** ログインページパス */
  loginPath?: string;
  /** ログアウトAPIパス */
  logoutPath?: string;
  /** ホームリンクURL */
  homeUrl?: string;
  /** カートページURL */
  cartUrl?: string;
  /** カート更新イベント名 */
  cartUpdateEvent?: string;
  /** セッションデータの変更コールバック */
  onSessionChange?: (session: SessionData | null) => void;
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 購入者用レイアウトコンポーネント
 * セッション管理とカート状態管理を提供
 */
export function BuyerLayout({
  children,
  siteName = 'EC Site',
  navLinks = [
    { href: '/catalog', label: '商品一覧' },
    { href: '/cart', label: 'カート' },
    { href: '/orders', label: '注文履歴' },
  ],
  footerLinks = [
    { href: '/privacy', label: 'プライバシーポリシー' },
    { href: '/terms', label: '利用規約' },
  ],
  copyright = '© 2026 EC Site',
  sessionEndpoint = '/api/auth/session',
  cartEndpoint = '/api/cart',
  loginPath = '/login',
  logoutPath = '/logout',
  homeUrl,
  cartUrl,
  cartUpdateEvent = 'cart-updated',
  onSessionChange,
}: BuyerLayoutProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const fetchSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      const res = await fetch(sessionEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch {
      // セッションなし
    }
    return null;
  }, [sessionEndpoint]);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch(cartEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCartCount(data.data.itemCount || 0);
        }
      }
    } catch {
      setCartCount(0);
    }
  }, [cartEndpoint]);

  // 初回読み込みとルート変更時にセッションを確認
  useEffect(() => {
    const checkSession = async () => {
      const currentSession = await fetchSession();
      setSession(currentSession);
      onSessionChange?.(currentSession);
      if (currentSession) {
        await fetchCartCount();
      } else {
        setCartCount(0);
      }
      setIsReady(true);
    };
    checkSession();
  }, [pathname, fetchSession, fetchCartCount, onSessionChange]);

  // カスタムイベントでカート更新を監視
  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener(cartUpdateEvent, handleCartUpdate);
    return () => {
      window.removeEventListener(cartUpdateEvent, handleCartUpdate);
    };
  }, [fetchCartCount, cartUpdateEvent]);

  // 認証が完了するまでローディング表示
  if (!isReady) {
    return (
      <Layout
        headerProps={{
          siteName,
          navLinks,
          cartCount: 0,
          cartUrl,
          homeUrl,
          isLoggedIn: false,
          loginHref: loginPath,
        }}
        footerProps={{
          copyright,
          links: footerLinks,
        }}
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-900 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <ToastProvider>
      <Layout
        headerProps={{
          siteName,
          navLinks,
          cartCount,
          cartUrl,
          homeUrl,
          isLoggedIn: !!session,
          userName: session?.name,
          loginHref: loginPath,
          logoutHref: `${logoutPath}?callbackUrl=${encodeURIComponent(pathname)}`,
        }}
        footerProps={{
          copyright,
          links: footerLinks,
        }}
      >
        {children}
      </Layout>
    </ToastProvider>
  );
}
