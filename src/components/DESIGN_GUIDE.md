# UIデザインガイド

ECサイト向けアーキテクチャ基盤のUIデザイン指針。

## 設計原則

### 1. レイアウト原則

- **モジュール式グリッドシステム**を採用
- Tailwind CSS のグリッドクラスを活用（`grid-cols-2`, `grid-cols-3`）
- レスポンシブ対応（`sm:`, `md:`, `lg:` プレフィックス）

### 2. 余白原則

- セクション間の余白: **2〜2.4rem**（`py-8` または `py-section`）
- 要素間の余白: **1〜1.5rem**（`gap-4` または `gap-6`）
- 「呼吸感」のある余裕を持たせる

### 3. 情報設計原則

- 商品情報と購入導線を最優先
- 補足情報は控えめに配置
- 不要な視覚要素の徹底的な排除

### 4. インタラクション原則

- シンプルで予測可能なナビゲーション
- 明確なCTA配置と十分なタッチ領域（最小44px）
- 状態遷移の視覚的フィードバック

## カラーパレット

| 用途 | Tailwind クラス | 説明 |
|------|-----------------|------|
| ページ背景 | `bg-base-50` | オフホワイト (#fafaf2) |
| 背景（薄） | `bg-base-100` | やや暗いオフホワイト (#f5f5e8) |
| ヘッダー/フッター | `bg-white` | 白背景（ページ背景との差別化） |
| 通知メッセージ | `bg-base-900/[0.08]` | オフホワイト調の薄い黒透過 |
| テキスト | `text-base-900` | ダークグレー (#1a1a1a) |
| テキスト（薄） | `text-base-900/70` | 70%透明度のダークグレー |
| テキスト（最薄） | `text-base-900/40` | 40%透明度（フッター等） |
| アクセント | `bg-accent` | イエロー (#ffd879) |
| アクセント（ホバー） | `hover:bg-accent-hover` | 濃いイエロー (#ffcc4d) |

## タイポグラフィ

```css
/* 見出し */
font-family: 'Inter', 'Noto Sans JP', sans-serif;
font-weight: 700;

/* 本文 */
font-family: 'Inter', 'Noto Sans JP', sans-serif;
font-weight: 400;

/* 装飾見出し */
font-family: 'Playfair Display', 'Noto Serif JP', serif;

/* コード */
font-family: 'JetBrains Mono', monospace;
```

### フォントサイズ

| 用途 | Tailwind クラス |
|------|-----------------|
| 大見出し | `text-2xl` または `text-3xl` |
| 中見出し | `text-xl` |
| 小見出し | `text-lg` |
| 本文 | `text-base` |
| 補足 | `text-sm` |
| 注釈 | `text-xs` |

## ページレイアウト

### ページコンテナパターン

`page.tsx` はコンテナラッパーでドメイン UI コンポーネントを囲む形式とする。

```tsx
// 一覧ページ（max-w-7xl）
export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductList />
    </div>
  );
}

// 詳細ページ（max-w-4xl）
export default function ProductDetailPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductDetail />
    </div>
  );
}
```

| ページ種別 | 最大幅 | 用途 |
|-----------|--------|------|
| 一覧ページ | `max-w-7xl` | 商品一覧、注文一覧、カート等 |
| 詳細ページ | `max-w-4xl` | 商品詳細、注文詳細等 |

- レスポンシブ余白: `px-4 sm:px-6 lg:px-8`（モバイル → タブレット → デスクトップ）
- 上下余白: `py-8`
- ドメイン UI コンポーネントがコンテンツを担当し、page.tsx はレイアウト（幅制約・余白）のみ担当
- `useFetch` の結果は `<DataView>` でラップし、`children` render prop 内でドメイン UI コンポーネントを呼ぶ

### ヘッダー・フッター

```tsx
// ヘッダー
<header className="border-b border-base-900/5 bg-white">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex h-20 items-center justify-between">
      <a href="/" className="font-serif text-3xl tracking-tight text-base-900">
        サイト名
      </a>
      {/* ナビリンク */}
    </div>
  </div>
</header>

// フッター
<footer className="border-t border-base-900/5 bg-white">
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    {/* フッターコンテンツ */}
  </div>
</footer>
```

- ヘッダー: 白背景（`bg-white`）、高さ `h-20`、セリフ体ロゴ（`font-serif text-3xl`）
- フッター: 白背景（`bg-white`）、パディング `py-10`
- 区切り線: `border-base-900/5`（極薄）

### ナビリンク設定（nav.ts 方式）

ナビリンクはレイアウトにハードコードせず、`nav.ts` ファイルで管理する。新規ドメイン実装時は `nav.ts` にエントリを追加するだけでメニューに反映される。

```typescript
// src/app/(buyer)/nav.ts（本番: 空 → ドメイン実装時にエントリ追加）
import type { NavLink } from '@/components/layout/Header';
export const buyerNavLinks: NavLink[] = [];

// src/app/admin/nav.ts（本番: 空 → ドメイン実装時にエントリ追加）
export interface NavLink { href: string; label: string; }
export const adminNavLinks: NavLink[] = [];
```

- ナビリンクの追加・変更は `nav.ts` のみで行う（layout.tsx を直接変更しない）
- レイアウト構造（`layout.tsx`）はアーキテクチャ保護対象（変更禁止）

## コンポーネント設計

### ボタン

**Button コンポーネントを使用すること。** インラインスタイルは Button の variant に当てはまらない特殊ケース（アイコンボタン、アクセントカラー等）のみ許可。

```tsx
import { Button } from '@/components/form';

// プライマリ（デフォルト）
<Button onClick={handleClick}>送信</Button>

// セカンダリ
<Button variant="secondary">キャンセル</Button>

// 危険
<Button variant="danger">削除</Button>

// フル幅 + 大きめ（buyer CTA）
<Button className="w-full py-3 text-base">購入手続きへ</Button>

// フォーム送信
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? '送信中...' : '保存'}
</Button>
```

| Props | 型 | デフォルト | 説明 |
|-------|-----|-----------|------|
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | スタイルバリアント |
| `className` | `string` | — | レイアウト調整用クラス（`w-full`, `mt-3` 等） |
| `type` | `string` | `'button'` | ボタンタイプ（フォーム送信は `'submit'` を指定） |
| `children` | `ReactNode` | — | ボタンラベル |

スタイル仕様（参照用）:

- 全ボタンに `rounded-full` と `transition-colors duration-200` を統一適用
- プライマリ: `bg-base-900 text-white hover:bg-base-900/85`
- セカンダリ: `border border-base-900/15 hover:bg-base-100`
- 危険: `bg-red-600 text-white hover:bg-red-700`

### 入力フィールド

```tsx
<input
  type="text"
  className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 placeholder:text-base-900/40 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
  placeholder="入力してください"
/>
```

### カード

```tsx
// ボーダーレスカード（商品カード等）
<div className="group">
  <img src={imageUrl} alt={name} className="mb-5 aspect-square w-full rounded-lg object-cover transition-all duration-300 group-hover:opacity-80 group-hover:shadow-md" />
  <h3 className="text-base font-medium text-base-900 transition-colors duration-200 group-hover:text-base-900/70">{name}</h3>
  <p className="mt-1 text-sm text-base-900/70">{formatPrice(price)}</p>
</div>

// ボーダー付きカード（注文詳細、フォーム等）
<div className="rounded-lg border border-base-900/10 bg-white p-6">
  <h3 className="text-lg font-semibold text-base-900">タイトル</h3>
  <p className="mt-2 text-base-900/70">説明文</p>
</div>
```

- 商品カード: ボーダーレス、`group` + `group-hover` でホバーエフェクト（画像の透明度変更 + シャドウ追加）
- 情報カード: `border border-base-900/10 bg-white` で区切り線あり（`shadow-sm` は不要）

## 状態表示

### DataView コンポーネント（二層ローディング標準化）

ページ遷移時とデータ取得時の二層でローディングを保証する。

**層1: loading.tsx（ページ遷移）**
- `app/(buyer)/loading.tsx` と `app/admin/loading.tsx` に配置済み
- Next.js が自動で Suspense boundary を作り、ページ遷移の瞬間にローディング表示
- 開発者の実装に依存せず構造的に保証される

**層2: DataView（データ取得）**

```tsx
import { DataView } from '@/components/data-display';

// page.tsx でデータ取得結果をラップ
const { data, isLoading, error } = useFetch<Product[]>(url);

<DataView
  data={data}
  isLoading={isLoading}
  error={error}
  loadingMessage="商品を読み込み中..."
  emptyMessage="商品がありません"
  emptyCheck={(d) => d.length === 0}
>
  {(products) => <ProductList products={products} />}
</DataView>
```

- `isLoading` → Loading 表示、`error` → Error 表示、`emptyCheck` → Empty 表示、いずれでもなければ `children(data)` を描画
- children は render prop で、`data` が non-null であることが型レベルで保証される
- ドメイン UI コンポーネントは `isLoading` / `error` を受け取らず、常に有効なデータのみを受け取る

### ローディング

- スピナーアニメーション（`animate-spin`）
- 「読み込み中...」メッセージ
- `role="status"` で支援技術に通知

### エラー

- 赤色のアイコンと背景（`bg-red-100`, `text-red-600`）
- 明確なエラーメッセージ
- リトライボタン（任意）
- `role="alert"` で支援技術に通知

### 空状態

- 中央配置のアイコンとメッセージ
- アクションボタン（任意）
- `role="status"` で支援技術に通知

## アクセシビリティ

### 必須要件

1. **十分なコントラスト比**: テキストは4.5:1以上
2. **フォーカス表示**: `focus:ring-2 focus:ring-offset-2`
3. **ARIA属性**:
   - `role="status"` - 状態表示
   - `role="alert"` - エラー表示
   - `aria-label` - アイコンボタン
4. **キーボード操作**: すべてのインタラクティブ要素にフォーカス可能

### テスト

```tsx
// アクセシビリティテストの例
it('適切なARIAラベルが設定されている', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toHaveAccessibleName('送信');
});
```

## レスポンシブ設計

### ブレークポイント

| プレフィックス | 最小幅 | 用途 |
|---------------|--------|------|
| なし | 0px | モバイル（デフォルト） |
| `sm:` | 640px | 大きめのモバイル |
| `md:` | 768px | タブレット |
| `lg:` | 1024px | 小さめのデスクトップ |
| `xl:` | 1280px | デスクトップ |

### モバイルファースト

```tsx
// モバイルファーストの例
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* グリッドアイテム */}
</div>
```

### トースト通知

```tsx
import { useToast } from '@/components/feedback/Toast';

// コンポーネント内で使用
const { showToast } = useToast();

showToast('カートに追加しました', 'success');  // 緑・3秒で自動消去
showToast('エラーが発生しました', 'error');      // 赤・5秒で自動消去
showToast('処理中です', 'info');                 // 青・3秒で自動消去
```

- `ToastProvider` はレイアウト（BuyerLayout / AdminLayout）に組込済み
- ページコンポーネントは `useToast()` で通知を発行するだけでよい
- 複数通知はスタック表示（画面右上固定、`z-50`）
- 空メッセージは無視される

### 確認ダイアログ

```tsx
import { ConfirmDialog } from '@/components/feedback';

// デフォルト（確認ボタン: bg-base-900、キャンセルボタン: border）
<ConfirmDialog
  open={isOpen}
  message="この操作を実行しますか？"
  onConfirm={handleConfirm}
  onCancel={() => setIsOpen(false)}
/>
// → confirmLabel="確認"、cancelLabel="キャンセル" がデフォルト

// 危険な操作（確認ボタン: bg-red-600）
<ConfirmDialog
  open={isOpen}
  title="商品の削除"
  message="この商品をカートから削除しますか？"
  confirmLabel="削除する"
  cancelLabel="やめる"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

- ボタン配置: キャンセル（左）→ 確認（右）
- `role="dialog"` + `aria-modal="true"` で支援技術に通知
- `aria-labelledby`（タイトルあり時）+ `aria-describedby` でメッセージを関連付け
- Escapeキーまたはオーバーレイクリックで閉じる
- キャンセルボタンに自動フォーカス

## ナビゲーション

### ページネーション

```tsx
import { Pagination } from '@/components/navigation';

// 一覧画面のページネーション
<Pagination
  page={1}
  limit={10}
  total={50}
  totalPages={5}
  onPageChange={(page) => setCurrentPage(page)}
/>
// → 「全50件中 1〜10件を表示」+ 前へ/次へボタン
// → total=0 または totalPages=1 の場合は非表示
```

- `aria-label="ページネーション"` でナビゲーションロールを提供
- 1ページ目では「前へ」ボタンが無効化
- 最終ページでは「次へ」ボタンが無効化

## データ表示

### ステータスバッジ

```tsx
import { StatusBadge, orderStatusLabels, orderStatusColors } from '@/components/data-display';

// 注文ステータスには既定義の定数を使用
<StatusBadge
  status={order.status}
  statusColors={orderStatusColors}
  statusLabels={orderStatusLabels}
/>

// 他ドメインではドメイン固有の定義を作成
const productStatusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
};
const productStatusLabels: Record<string, string> = {
  draft: '下書き',
  published: '公開中',
};
<StatusBadge status={product.status} statusColors={productStatusColors} statusLabels={productStatusLabels} />
// → 未定義ステータスは bg-base-100 text-base-900 でそのまま表示
```

- `role="status"` で支援技術に通知
- `rounded-full` のピル型バッジ

### 商品カード

```tsx
import { ProductCard } from '@/components/product';

// 基本表示（商品名・価格・画像・詳細リンク）
<ProductCard
  id={product.id}
  name={product.name}
  price={product.price}
  imageUrl={product.imageUrl}
  linkHref={`/sample/catalog/${product.id}`}
/>

// カート追加ボタン付き
<ProductCard
  id={product.id}
  name={product.name}
  price={product.price}
  imageUrl={product.imageUrl}
  linkHref={`/sample/catalog/${product.id}`}
  onAddToCart={() => handleAddToCart(product.id)}
/>
```

| Props | 型 | 必須 | 説明 |
|-------|-----|------|------|
| `id` | `string` | ○ | 商品ID |
| `name` | `string` | ○ | 商品名 |
| `price` | `number` | ○ | 価格 |
| `imageUrl` | `string` | — | 画像URL（未指定時プレースホルダー表示） |
| `linkHref` | `string` | ○ | リンク先URL |
| `onAddToCart` | `() => void` | — | カート追加コールバック（未指定時ボタン非表示） |

- `imageUrl` がある場合は画像を表示、ない場合は SVG プレースホルダー（`data-testid="product-image-placeholder"`）
- リンク先は `linkHref` で指定（`data-testid="product-card"`）。呼び出し側がドメインのデータから完成形 URL を構築する
- `formatPrice` でフォーマットされた価格を表示
- `'use client'` ディレクティブ付き（onClick ハンドラ使用のため）

### 画像プレースホルダー

```tsx
import { ImagePlaceholder } from '@/components/product';

// 画像URLがある場合は画像を表示、ない場合はSVGプレースホルダー
<ImagePlaceholder
  src={product.imageUrl}
  alt={product.name}
  size="md"
/>
```

| サイズ | Tailwind クラス | ピクセル |
|--------|-----------------|---------|
| `sm` | `w-16 h-16` | 64px |
| `md` | `w-24 h-24` | 96px（デフォルト） |
| `lg` | `w-64 h-64` | 256px |

## フォーム（拡張）

### 検索バー

```tsx
import { SearchBar } from '@/components/form';

<SearchBar
  onSearch={(query) => handleSearch(query)}
  defaultValue={currentQuery}
  placeholder="商品名で検索..."
/>
// → Enter キーで検索実行
// → クリアボタンで入力をリセットし onSearch('') を呼び出し
```

- `role="search"` で検索ランドマークを提供
- クリアボタンは入力値がある場合のみ表示

### 数量セレクター

```tsx
import { QuantitySelector } from '@/components/product';

<QuantitySelector
  value={item.quantity}
  min={1}
  max={item.stock}
  onChange={(qty) => updateQuantity(item.id, qty)}
  disabled={isUpdating}
/>
// → -/+ ボタンで数量変更
// → min/max でボタン無効化
// → min > max の場合は全コントロール無効化
```

- `aria-live="polite"` で数値変更を支援技術に通知
- 各ボタンに `aria-label` 設定

## ユーティリティ関数

### 価格フォーマット

```tsx
import { formatPrice } from '@/components/utils';

formatPrice(1000);   // → '¥1,000'
formatPrice(0);      // → '無料'
formatPrice(15800);  // → '¥15,800'
formatPrice(-500);   // → '-¥500'
```

### 日時フォーマット

```tsx
import { formatDateTime, formatDate } from '@/components/utils';

formatDateTime('2026-02-07T14:30:00');  // → '2026/2/7 14:30'
formatDateTime(new Date());              // → '2026/2/7 10:00'
formatDateTime('invalid');               // → '-'

formatDate('2026-02-07T14:30:00');      // → '2026/2/7'
formatDate(new Date());                  // → '2026/2/7'
formatDate('invalid');                   // → '-'
```

### 日付デシリアライズ

```tsx
import { deserializeDates } from '@/components/utils';

// createdAt / updatedAt を string → Date に変換
const order = deserializeDates(rawOrder);
// order.createdAt は Date オブジェクト
```

### カート更新イベント

```tsx
import { emitCartUpdated } from '@/components/utils';

// カート変更後にイベントを発火（BuyerLayout がリスンしてカート数を更新）
emitCartUpdated();
```

## ファイル構成

```
src/components/
├── auth/               # 認証関連
│   └── Forbidden.tsx
├── data-display/       # データ表示
│   ├── DataView.tsx    # DataView<T> — Loading→Error→Empty→children の4段階 render prop
│   ├── ImagePlaceholder.tsx
│   ├── order-status.ts # orderStatusLabels, orderStatusColors
│   ├── ProductCard.tsx
│   ├── StatusBadge.tsx
│   └── index.ts
├── dialog/             # ダイアログ
│   ├── ConfirmDialog.tsx
│   └── index.ts
├── feedback/           # フィードバック
│   ├── AlertBanner.tsx # エラー/成功バリアントのバナー
│   ├── Toast.tsx
│   └── index.ts
├── form/               # フォーム
│   ├── FormField.tsx
│   ├── QuantitySelector.tsx
│   ├── SearchBar.tsx
│   └── index.ts
├── hooks/              # カスタムフック
│   ├── useFetch.ts     # データ取得（URL + params → { data, isLoading, error, refetch }）
│   ├── useFormSubmit.ts# フォーム送信（{ isSubmitting, error, submit }）
│   └── index.ts
├── layout/             # レイアウト関連
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Layout.tsx
├── layouts/            # ロール別レイアウト
│   ├── AdminLayout.tsx
│   ├── BuyerLayout.tsx
│   └── index.ts
├── navigation/         # ナビゲーション
│   ├── BackButton.tsx  # 左矢印アイコン付き戻るボタン
│   ├── Pagination.tsx  # PaginationData 型も export
│   └── index.ts
├── pages/              # 画面テンプレート
│   ├── detail.tsx
│   ├── form.tsx
│   ├── list.tsx
│   ├── login.tsx
│   ├── logout.tsx
│   └── index.ts
├── product/            # 商品関連
│   ├── QuantitySelector.tsx
│   └── index.ts
├── status/             # 状態表示
│   ├── Empty.tsx
│   ├── Error.tsx
│   └── Loading.tsx
├── utils/
│   ├── events.ts       # emitCartUpdated()
│   ├── format.ts       # formatPrice, formatDateTime, formatDate, deserializeDates
│   └── index.ts
├── index.ts            # バレルエクスポート（全共通モジュール）
└── DESIGN_GUIDE.md     # 本ファイル
```
