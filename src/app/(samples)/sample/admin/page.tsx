'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    productCount: 0,
    orderCount: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch('/sample/api/catalog/products?limit=1'),
          fetch('/sample/api/orders?limit=1'),
        ]);

        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        setStats({
          productCount: productsData.data?.pagination?.total || 0,
          orderCount: ordersData.data?.pagination?.total || 0,
          pendingOrders: 0, // TODO: フィルタリング実装
        });
      } catch (err) {
        console.error('ダッシュボード統計取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: '商品数', value: stats.productCount, href: '/sample/admin/products' },
    { label: '注文数', value: stats.orderCount, href: '/sample/admin/orders' },
    { label: '処理待ち', value: stats.pendingOrders, href: '/sample/admin/orders?status=pending' },
  ];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-base-900">ダッシュボード</h1>

      {isLoading ? (
        <p className="text-base-900/60">読み込み中...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-base-900/10 bg-white p-6 hover:border-base-900/20"
            >
              <p className="text-sm text-base-900/60">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-base-900">{card.value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-base-900">クイックアクション</h2>
        <div className="flex gap-4">
          <Link
            href="/sample/admin/products/new"
            className="rounded-full bg-base-900 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-base-900/85"
          >
            新規商品登録
          </Link>
          <Link
            href="/sample/admin/orders"
            className="rounded-full border border-base-900/15 px-6 py-3 text-sm font-medium text-base-900 transition-colors duration-200 hover:bg-base-100"
          >
            注文一覧へ
          </Link>
        </div>
      </div>
    </div>
  );
}
