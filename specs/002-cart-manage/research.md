# Research: カート管理機能 (002-cart-manage)

**Phase 0 完了日**: 2026-02-27

---

## 調査結果サマリー

既存のカートインフラ（contracts/cart.ts・infrastructure/repositories/cart.ts・API routes）は大部分が実装済み。ドメイン API と UI のみスタブ状態。`ProductFetcher` への `stock` フィールド追加が唯一の設計変更点。

---

## Decision 1: 既存カートインフラの充足性

**調査対象**: contracts/cart.ts, infrastructure/repositories/cart.ts, app/api/cart/\*

| コンポーネント | 状態 | 詳細 |
|---|---|---|
| `src/contracts/cart.ts` | ✅ 完全実装済み | CartSchema, CartItemSchema, 全 I/O スキーマ, CartRepository, ProductFetcher |
| `src/infrastructure/repositories/cart.ts` | ✅ 完全実装済み | インメモリ CRUD, subtotal/itemCount 自動計算, createStore (HMR 対応) |
| `src/app/api/cart/route.ts` | ⚠️ 要リファクタリング | 手書き try-catch → createRouteHandler に置換が必要 |
| `src/app/api/cart/items/route.ts` | ⚠️ 要リファクタリング | 同上 |
| `src/app/api/cart/items/[productId]/route.ts` | ⚠️ 要リファクタリング | 同上 |
| `src/domains/cart/api/index.ts` | ❌ スタブのみ | 全関数が NotImplementedError |
| `src/domains/cart/ui/index.tsx` | ❌ スタブのみ | "ドメイン未実装" プレースホルダー |
| `src/app/(buyer)/cart/page.tsx` | ⚠️ スキャフォールド済み | CartView をレンダリングするだけ（データなし） |

**Decision**: インフラはそのまま利用。ドメイン実装（domain/api + domain/ui）が主作業。API ルートは createRouteHandler パターンに更新する。

**根拠**: サンプル実装 (`src/samples/domains/cart/`) がそのまま参照パターンとして利用可能。

---

## Decision 2: ProductFetcher への stock フィールド追加

**問題**: FR-003（カート追加時の在庫チェック）・FR-012（数量変更時の在庫チェック）を実装するには、ドメイン層でstock情報が必要。しかし現在の `ProductFetcher.findById` は `{ id, name, price, imageUrl? }` のみを返し **stock を含まない**。

**調査**: `infrastructure/repositories/cart.ts` の productFetcher は既に `productRepository.findById()` を経由して stock を持つ product を取得しているが、返却時に stock を除外している。

**Decision**: `contracts/cart.ts` の `ProductFetcher` インターフェースを拡張し `stock: number` を追加。`infrastructure/repositories/cart.ts` の productFetcher 実装にも `stock` を追加。

```typescript
// contracts/cart.ts の ProductFetcher 変更
export interface ProductFetcher {
  findById(productId: string): Promise<{
    id: string;
    name: string;
    price: number;
    stock: number;   // ← 追加
    imageUrl?: string;
  } | null>;
}
```

**根拠**: Contracts・Infrastructure は変更許可対象。既存インフラの小さな拡張で実現可能。

---

## Decision 3: API Routes の createRouteHandler 移行

**問題**: 現在の API ルートは手書き try-catch パターン（samples/domains/cart/api 以外）。constitution 原則 I（共有基盤の利用）に反する。

**Decision**: Phase 2b で `createRouteHandler` パターンに置換。サンプル実装 (`src/app/(samples)/sample/api/cart/`) がそのまま参照パターン。

```typescript
// 移行後パターン
const { handler } = createRouteHandler<Session>({ getSession: getServerSession });
export async function GET(request: NextRequest) {
  return handler(request, async (_req, ctx) => { ... });
}
```

**根拠**: `src/app/` は変更許可対象。サンプルに完全な参照実装あり。

---

## Decision 4: ProductDetail への onAddToCart prop 追加

**問題**: `src/domains/catalog/ui/index.tsx` の `ProductDetail` コンポーネントは "カートに追加" ボタンを持つが、クリックハンドラがない（何も起きない）。

**Decision**: `ProductDetailProps` に `onAddToCart?: (productId: string) => void` を追加。`catalog/[id]/page.tsx` で `useFormSubmit` を使って API 呼び出しを担う。

```typescript
// ProductDetailProps 変更
export interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart?: (productId: string) => void;  // ← 追加
  isAddingToCart?: boolean;  // ← 追加（ボタン無効化用）
}
```

**根拠**: ドメイン UI (domains/catalog/ui) は変更許可対象。page.tsx は useFetch/useFormSubmit を担い、UI は callback props で受け取る（アーキテクチャ制約に準拠）。

---

## Decision 5: 消費税計算の配置

**問題**: FR-009「商品合計・消費税（商品合計 × 10%、端数切り捨て）・総合計」

**調査**: CartSchema の `subtotal` は商品合計（税抜）。税額はリポジトリ・ドメインに保存されない。

**Decision**: CartView（UI 層）で表示時に計算。

```typescript
const tax = Math.floor(cart.subtotal * 0.1);
const total = cart.subtotal + tax;
```

**根拠**: 表示用の計算はUI層の責務。スペックの前提条件「消費税は一律10%（軽減税率対象外）」により単純計算で充足。

---

## Decision 6: cart/page.tsx の実装パターン

**問題**: 現在の `app/(buyer)/cart/page.tsx` は `<CartView />` を props なしでレンダリングするだけで、データ取得・操作ができない。

**Decision**: `'use client'` + `useFetch('/api/cart')` + `useFormSubmit` パターンに書き換え。CartView は `CartViewProps` (cart, onUpdateQuantity, onRemove) を受け取る。

```typescript
// cart/page.tsx パターン
const { data: cart, isLoading, error, refetch } = useFetch<Cart>('/api/cart');
const { submit } = useFormSubmit();

const handleUpdateQuantity = (productId: string, quantity: number) => {
  submit(async () => {
    await fetch(`/api/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
    await refetch();
    emitCartUpdated();
  });
};
```

**根拠**: `page.tsx` は useFetch・useFormSubmit の唯一の利用場所（アーキテクチャ制約）。

---

## Decision 7: 未ログイン時リダイレクト (FR-007)

**問題**: FR-007「未ログイン購入者がカート追加を試みた場合はログインページにリダイレクト、ログイン後元ページに戻る」

**調査**: BuyerLayout はログイン状態を表示するが、未認証アクセスのリダイレクトはしない。API は 401 を返す。

**Decision**: `catalog/[id]/page.tsx` でカート追加 API が 401 を返した場合、`useRouter().push('/login?callbackUrl=...')` でリダイレクト。ログイン成功後 `callbackUrl` に戻る（認証テンプレートが処理）。

**根拠**: `page.tsx` はルーター操作可能。ドメイン UI（ProductDetail）はコールバック props のみで動作。

---

## Decision 8: emitCartUpdated の呼び出しタイミング

**調査**: `emitCartUpdated()` は CustomEvent('cart-updated') を発火。BuyerLayout がリスナーとして `/api/cart` を再取得し `cartCount` を更新。

**Decision**: カート変更後に必ず呼び出す。
- `addToCart` 成功後（ProductDetailPage）
- `updateCartItem` 成功後（cart/page.tsx）
- `removeFromCart` 成功後（cart/page.tsx）

**根拠**: FR-006「ヘッダーのカートアイコン件数をカート合計数量に更新する」の実現手段。

---

## Decision 9: カート永続化の実現方法 (FR-015)

**調査**: `infrastructure/repositories/cart.ts` は `createStore` を使って `globalThis` にデータを保持。Next.js のサーバーサイドでメモリが維持される。

**Decision**: 既存のインメモリ実装がそのまま FR-015 を満たす。ページ遷移・リロード時は `/api/cart` GET を再呼び出しすることでカート内容が復元される。

**根拠**: 仕様の前提「カートの永続化はインメモリとし、DB 永続化は将来フェーズとする」に合致。US5 は主にテストで動作確認するのみ。

---

## Decision 10: nav.ts へのカートリンク追加

**Decision**: Final Phase で `{ href: '/cart', label: 'カート' }` を追加。

**根拠**: 開発ワークフロー原則「実装完了後に nav.ts へのエントリ追加で段階的に機能公開する」

---

## 「既存で対応済み」AC 確認

| AC | FR | 対応コード | 充足確認 |
|---|---|---|---|
| US5 AC-1（ページ遷移後保持） | FR-015 | createStore → globalThis | ✅ API 再呼び出しで復元 |
| US5 AC-2（リロード後保持） | FR-015 | 同上 | ✅ 同上 |
| US4 AC-1（削除前確認ダイアログ） | FR-013 | CartView サンプル ConfirmDialog | ✅ サンプル参照で実装 |

---

## NEEDS CLARIFICATION: なし

全項目解決済み。
