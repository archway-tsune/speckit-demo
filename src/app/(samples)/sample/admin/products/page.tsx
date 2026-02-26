'use client';
/** AdminProductsPage - 商品管理ページ */
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/samples/contracts/catalog';
import { ConfirmDialog } from '@/components/feedback';
import { DataView } from '@/components/data-display/DataView';
import { SearchBar } from '@/components/form/SearchBar';
import { useFetch } from '@/components/hooks/useFetch';

const statusLabels: Record<Product['status'], string> = { draft: '下書き', published: '公開中', archived: 'アーカイブ' };

export default function AdminProductsPage() {
  const { data, isLoading, refetch } = useFetch<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/sample/api/catalog/products', { limit: '100' }, { loginUrl: '/sample/login' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      await fetch(`/sample/api/catalog/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      refetch();
    } catch (err) { console.error('商品ステータス変更エラー:', err); }
  };

  const handleDelete = async (productId: string) => {
    try {
      await fetch(`/sample/api/catalog/products/${productId}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      refetch();
    } catch (err) { console.error('商品削除エラー:', err); }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-base-900">商品管理</h1>
        <Link href="/sample/admin/products/new" className="rounded-full bg-base-900 px-6 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-base-900/85">新規登録</Link>
      </div>
      <div className="mb-4 max-w-sm">
        <SearchBar onSearch={setSearchQuery} placeholder="商品名で検索..." />
      </div>
      <DataView
        data={data}
        isLoading={isLoading}
        loadingMessage="商品を読み込み中..."
      >
        {(d) => {
          const filteredProducts = searchQuery
            ? d.products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : d.products;
          return (
            <>
              <div className="rounded-lg border border-base-900/10 bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-base-900/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">商品名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">価格</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">ステータス</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} data-testid="product-row" className="border-b border-base-900/10 last:border-0">
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3">¥{product.price.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <select data-testid="status-select" value={product.status} onChange={(e) => handleStatusChange(product.id, e.target.value)} className="rounded-md border border-base-900/20 px-2 py-1 text-sm">
                            <option value="draft">下書き</option>
                            <option value="published">公開中</option>
                            <option value="archived">アーカイブ</option>
                          </select>
                          <span data-testid="status-badge" className="ml-2 text-xs text-base-900/60">{statusLabels[product.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/sample/admin/products/${product.id}/edit`} data-testid="edit-button" className="rounded-full border border-base-900/15 px-3 py-1 text-sm transition-colors duration-200 hover:bg-base-100">編集</Link>
                            <button type="button" data-testid="delete-button" onClick={() => setDeleteConfirm(product.id)} className="rounded-full border border-red-200 px-3 py-1 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50">削除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ConfirmDialog open={deleteConfirm !== null} message="この商品を削除しますか？" confirmLabel="削除する" variant="danger" onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
            </>
          );
        }}
      </DataView>
    </div>
  );
}
