/**
 * 共有UIコンポーネント メインエクスポート
 *
 * テンプレートから分離された、ランタイム再利用可能なUIコンポーネント群。
 * Props 型は各サブモジュールから直接 import してください。
 */

// レイアウト
export { Layout, Header, Footer } from './layout';
export type { NavLink } from './layout';

// フィードバック
export { ToastProvider, useToast, ConfirmDialog, Loading, Error, Empty, AlertBanner } from './feedback';

// 商品
export { ProductCard, ImagePlaceholder, QuantitySelector } from './product';

// フォーム
export { Button, FormField, TextInput, TextArea, Select, SearchBar } from './form';
export type { ButtonProps } from './form';

// ナビゲーション
export { Pagination, BackButton } from './navigation';
export type { PaginationData } from './navigation';

// データ表示
export { StatusBadge, orderStatusLabels, orderStatusColors, DataView } from './data-display';
export type { DataViewProps } from './data-display';

// 認証
export { Forbidden } from './auth';

// ページ
export { LoginPage, LogoutPage, isAdmin, isBuyer, allowAny } from './pages';

// レイアウトテンプレート
export { AdminLayout, BuyerLayout } from './layouts';

// フック
export { useFetch, useFormSubmit } from './hooks';

// ユーティリティ
export { formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated } from './utils';
