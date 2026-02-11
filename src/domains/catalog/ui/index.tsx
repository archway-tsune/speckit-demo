'use client';

/**
 * Catalog ドメイン - UI エクスポート（本番）
 * 商品一覧・詳細のページレベルコンポーネント
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/contracts/catalog';
import { SearchBar } from '@/templates/ui/components/form/SearchBar';
import { Empty } from '@/templates/ui/components/status/Empty';
import { ProductList as ProductListView } from './ProductList';
import { ProductDetail as ProductDetailView } from './ProductDetail';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

interface ProductsResponse {
  success: boolean;
  data?: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: { message: string };
}

interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: { message: string };
}

// ─────────────────────────────────────────────────────────────────
// 商品一覧ページコンポーネント
// ─────────────────────────────────────────────────────────────────

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [keyword, setKeyword] = useState<string>('');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const keywordRef = useRef(keyword);

  const fetchProducts = useCallback(async (page = 1, searchKeyword?: string) => {
    const kw = searchKeyword ?? keywordRef.current;
    setIsLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (kw) params.set('keyword', kw);

      const res = await fetch(`/api/catalog/products?${params}`);
      const data: ProductsResponse = await res.json();

      if (data.success && data.data) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || '商品の取得に失敗しました');
      }
    } catch {
      setError('商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (query: string) => {
    setKeyword(query);
    keywordRef.current = query;
    fetchProducts(1, query || undefined);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const isSearchActive = keyword.length > 0;
  const isSearchEmpty = isSearchActive && !isLoading && products.length === 0 && !error;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>

      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          placeholder="商品を検索..."
        />
      </div>

      {isSearchEmpty ? (
        <Empty message="該当する商品が見つかりません" />
      ) : (
        <ProductListView
          products={products}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          onRetry={() => fetchProducts()}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 商品詳細ページコンポーネント
// ─────────────────────────────────────────────────────────────────

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [cartMessage, setCartMessage] = useState<string | undefined>();

  const fetchProduct = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/api/catalog/products/${params.id}`);
      const data: ProductResponse = await res.json();

      if (data.success && data.data) {
        setProduct(data.data);
      } else {
        setError(data.error?.message || '商品の取得に失敗しました');
      }
    } catch {
      setError('商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async (productId: string) => {
    setCartMessage(undefined);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('cart-updated'));
        setCartMessage('カートに追加しました');
        setTimeout(() => setCartMessage(undefined), 3000);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const data = await res.json();
        setCartMessage(data.error?.message || 'カートへの追加に失敗しました');
      }
    } catch {
      setCartMessage('カートへの追加に失敗しました');
    }
  };

  const handleBack = () => {
    router.push('/catalog');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {cartMessage && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          {cartMessage}
        </div>
      )}
      <ProductDetailView
        product={product}
        isLoading={isLoading}
        error={error}
        onAddToCart={handleAddToCart}
        onBack={handleBack}
      />
    </div>
  );
}
