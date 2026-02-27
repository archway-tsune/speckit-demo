import type { NavLink } from '@/components/layout/Header';

/** 購入者ナビゲーションリンク — ドメイン実装時にエントリを追加する */
export const buyerNavLinks: NavLink[] = [
  { href: '/catalog', label: '商品一覧' },
  { href: '/cart', label: 'カート' },
  { href: '/orders', label: '注文履歴' },
];
