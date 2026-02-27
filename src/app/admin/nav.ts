/** 管理者ナビゲーションリンク — ドメイン実装時にエントリを追加する */
export interface NavLink {
  href: string;
  label: string;
}

export const adminNavLinks: NavLink[] = [
  { href: '/admin/products', label: '商品管理' },
  { href: '/admin/orders', label: '注文管理' },
];
