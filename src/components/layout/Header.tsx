/**
 * Header コンポーネント
 * 共通ヘッダーコンポーネント
 */
import React from 'react';

export interface NavLink {
  href: string;
  label: string;
}

export interface HeaderProps {
  /** サイト名 */
  siteName?: string;
  /** カート内商品数 */
  cartCount?: number;
  /** ログイン状態 */
  isLoggedIn?: boolean;
  /** ユーザー名 */
  userName?: string;
  /** ナビゲーションリンク */
  navLinks?: NavLink[];
  /** ホームリンクのURL */
  homeUrl?: string;
  /** カートページのURL */
  cartUrl?: string;
  /** ログインページのURL */
  loginUrl?: string;
  /** ログインリンク（別名） */
  loginHref?: string;
  /** ログアウトリンク */
  logoutHref?: string;
  /** ログインボタンクリック時のコールバック（デモ用） */
  onLogin?: () => void;
}

/**
 * ヘッダーコンポーネント
 */
export function Header({
  siteName = 'EC Site',
  cartCount = 0,
  isLoggedIn = false,
  userName,
  navLinks = [],
  homeUrl = '/',
  cartUrl = '/cart',
  loginUrl = '/login',
  loginHref,
  logoutHref,
  onLogin,
}: HeaderProps) {
  const effectiveLoginUrl = loginHref || loginUrl;
  return (
    <header role="banner" className="border-b border-base-900/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* ロゴ */}
          <div className="flex items-center">
            <a href={homeUrl} className="font-serif text-3xl tracking-tight text-base-900">
              {siteName}
            </a>
          </div>

          {/* ナビゲーション */}
          {navLinks.length > 0 && (
            <nav role="navigation" className="hidden md:flex md:gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-wide text-base-900/60 transition-colors duration-200 hover:text-base-900"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* 右側のアクション */}
          <div className="flex items-center gap-5">
            {/* カート */}
            <a
              href={cartUrl}
              className="relative flex items-center text-base-900/60 transition-colors duration-200 hover:text-base-900"
              aria-label="カート"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute -right-2.5 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-base-900 text-[10px] font-medium text-white"
                >
                  {cartCount}
                </span>
              )}
            </a>

            {/* ユーザーメニュー / ログインリンク */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="hidden text-sm text-base-900/60 sm:inline">
                  {userName}
                </span>
                {logoutHref && (
                  <a
                    href={logoutHref}
                    className="text-sm text-base-900/60 transition-colors duration-200 hover:text-base-900"
                  >
                    ログアウト
                  </a>
                )}
              </div>
            ) : onLogin ? (
              <button
                type="button"
                onClick={onLogin}
                className="text-sm text-base-900/60 transition-colors duration-200 hover:text-base-900"
              >
                ログイン
              </button>
            ) : (
              <a
                href={effectiveLoginUrl}
                className="text-sm text-base-900/60 transition-colors duration-200 hover:text-base-900"
              >
                ログイン
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
