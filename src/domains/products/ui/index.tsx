'use client';
/**
 * Products ドメイン - UI コンポーネント（admin 専用）
 */
// @see barrel: Layout, Header, Footer, NavLink, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, ButtonProps,
//              Pagination, BackButton, PaginationData, StatusBadge, orderStatusLabels,
//              orderStatusColors, DataView, DataViewProps, Forbidden, LoginPage, LogoutPage,
//              isAdmin, isBuyer, allowAny, AdminLayout, BuyerLayout, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import { useState, useCallback, type FormEvent } from 'react';
import { Button, StatusBadge, Pagination, ConfirmDialog, formatPrice, TextInput, TextArea, useFormSubmit } from '@/components';
import type { Product } from '@/contracts/catalog';
import { CreateProductInputSchema } from '@/contracts/products';
import type { GetAdminProductsOutput, CreateProductInput } from '@/contracts/products';

const productStatusLabels: Record<string, string> = {
  draft: '下書き',
  published: '公開中',
  archived: 'アーカイブ',
};

const productStatusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export interface ProductTableProps {
  products: Product[];
  pagination: GetAdminProductsOutput['pagination'];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Product['status']) => void;
  onPageChange: (page: number) => void;
  onNewProduct: () => void;
}

export function ProductTable({
  products,
  pagination,
  onEdit,
  onDelete,
  onStatusChange,
  onPageChange,
  onNewProduct,
}: ProductTableProps): React.ReactElement {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-900">商品管理</h1>
        <Button onClick={onNewProduct} variant="primary">
          新規登録
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-base-900/10">
        <table className="min-w-full divide-y divide-base-900/10">
          <thead className="bg-base-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-900/60">商品名</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-900/60">価格</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-900/60">在庫数</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-900/60">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-900/60">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-900/10 bg-white">
            {products.map((product) => (
              <tr key={product.id} data-testid="product-row">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-base-900">{product.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-base-900">{formatPrice(product.price)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-base-900">{product.stock}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <StatusBadge
                    status={product.status}
                    statusColors={productStatusColors}
                    statusLabels={productStatusLabels}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <select
                      data-testid="status-select"
                      value={product.status}
                      onChange={(e) => onStatusChange(product.id, e.target.value as Product['status'])}
                      className="rounded-md border border-base-900/20 px-2 py-1 text-xs text-base-900"
                    >
                      <option value="draft">下書き</option>
                      <option value="published">公開中</option>
                      <option value="archived">アーカイブ</option>
                    </select>
                    <Button
                      data-testid="edit-link"
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(product.id)}
                    >
                      編集
                    </Button>
                    <Button
                      data-testid="delete-button"
                      variant="danger"
                      onClick={() => { setDeleteTargetId(product.id); setConfirmOpen(true); }}
                    >
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
      />
      <ConfirmDialog
        open={confirmOpen}
        message="この商品を削除しますか？この操作は取り消せません。"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await fetch(`/api/admin/products/${deleteTargetId}`, { method: 'DELETE' });
          onDelete(deleteTargetId);
          setConfirmOpen(false);
          setDeleteTargetId(null);
        }}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
      />
    </div>
  );
}

export interface ProductFormProps {
  initialValues?: Partial<CreateProductInput & { id: string }>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting: externalIsSubmitting,
}: ProductFormProps): React.ReactElement {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [price, setPrice] = useState(String(initialValues?.price ?? ''));
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [stock, setStock] = useState(String(initialValues?.stock ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isSubmitting: formSubmitting, error: submitError, submit } = useFormSubmit();

  const isSubmitting = externalIsSubmitting ?? formSubmitting;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const data = {
        name,
        price: price === '' ? undefined : price,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        stock: stock === '' ? undefined : stock,
      };
      const result = CreateProductInputSchema.safeParse(data);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        for (const issue of result.error.errors) {
          const field = issue.path[0];
          if (field && typeof field === 'string') {
            newErrors[field] = issue.message;
          }
        }
        setErrors(newErrors);
        return;
      }
      setErrors({});
      await submit(() => onSubmit(result.data));
    },
    [name, price, description, imageUrl, stock, onSubmit, submit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        id="name"
        label="商品名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <TextInput
        id="price"
        label="価格"
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
      />
      <TextArea
        id="description"
        label="商品説明"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />
      <TextInput
        id="imageUrl"
        label="画像URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        error={errors.imageUrl}
      />
      <TextInput
        id="stock"
        label="在庫数"
        type="number"
        min="0"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        error={errors.stock}
      />
      {submitError && <p className="text-sm text-red-500">{submitError}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : '登録'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
