/** サンプル管理者ナビゲーションリンク */
export interface NavLink {
  href: string;
  label: string;
}

export const adminNavLinks: NavLink[] = [
  { href: '/sample/admin', label: 'ダッシュボード' },
  { href: '/sample/admin/products', label: '商品管理' },
  { href: '/sample/admin/orders', label: '注文管理' },
];
