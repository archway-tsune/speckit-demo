# 実装計画: カート管理機能

**Branch**: `002-cart-manage` | **Date**: 2026-02-27 | **Spec**: specs/002-cart-manage/spec.md

**Input**: Feature specification from `/specs/002-cart-manage/spec.md`

## サマリー

購入者が商品をカートに追加し、内容確認・数量変更・削除・永続化を行えるカート管理機能の実装。ドメイン API スタブ（getCart/addToCart/updateCartItem/removeFromCart）と UI スタブ（CartView）を本番実装に置き換える。`ProductFetcher` への `stock` フィールド追加が唯一の設計変更。

## 技術コンテキスト

**Language/Version**: TypeScript 5 (strict mode) + Next.js 14 (App Router) + React 18
**Primary Dependencies**: Zod（バリデーション）, Tailwind CSS 3
**Storage**: インメモリ（createStore / globalThis、HMR 対応）
**Testing**: Vitest（単体・統合: `pnpm test:unit` / `pnpm test:integration`）, Playwright（E2E: `pnpm test:e2e`）
**Target Platform**: Web browser (Next.js SSR + Client Components)
**Project Type**: Web アプリケーション（EC サイト購入者向け）
**Performance Goals**: カート追加操作 3秒以内完了（SC-001）
**Constraints**: TypeScript strict + ESLint エラー 0件、テストカバレッジ 80% 以上
**Scale/Scope**: シングルサーバー・デモ環境

## Constitution Check

*GATE: 研究フェーズ前に通過必須。Phase 1 設計後に再チェック。*

| 原則 | 状態 | 備考 |
|---|---|---|
| I. 共有基盤の利用 | ✅ PASS | components/ (ConfirmDialog, QuantitySelector, useFormSubmit, emitCartUpdated 等) を使用。templates/api/route-handler の createRouteHandler を API ルートに適用 |
| II. ドメイン分離 | ✅ PASS | domains/cart/ に独立実装。catalog ドメインへの直接依存は ProductFetcher 経由のみ |
| III. TDD 必須 | ✅ PASS | US1〜US5 各ストーリーで Red→Green→Refactor を順守 |
| IV. 実装ガードレール | ✅ PASS | Foundation/Templates/Components/Samples は変更しない。Contracts・Infrastructure・Domains・App ルートのみ変更 |

**Phase 1 設計後再チェック**: ✅ PASS（ProductFetcher の stock 追加は Contracts 変更として許可範囲内）

## プロジェクト構造

### ドキュメント（このフィーチャー）

```text
specs/002-cart-manage/
├── plan.md              # 本ファイル
├── research.md          # Phase 0 完了
├── data-model.md        # Phase 1 完了
├── quickstart.md        # Phase 1 完了
├── contracts/
│   └── cart-api.md      # Phase 1 完了
└── tasks.md             # /speckit.tasks コマンドで生成予定
```

### ソースコード（実装対象ファイル）

```text
src/
├── contracts/
│   └── cart.ts                    # ProductFetcher に stock: number 追加
│
├── infrastructure/
│   └── repositories/
│       └── cart.ts                # productFetcher に stock を含める
│
├── app/
│   ├── api/
│   │   └── cart/
│   │       ├── route.ts           # createRouteHandler に移行
│   │       └── items/
│   │           ├── route.ts       # createRouteHandler に移行
│   │           └── [productId]/
│   │               └── route.ts   # createRouteHandler に移行
│   └── (buyer)/
│       ├── cart/
│       │   └── page.tsx           # 'use client' + useFetch + CartView
│       └── catalog/
│           └── [id]/
│               └── page.tsx       # onAddToCart + 未ログインリダイレクト追加
│
├── domains/
│   ├── cart/
│   │   ├── api/
│   │   │   └── index.ts           # getCart/addToCart/updateCartItem/removeFromCart 実装
│   │   └── ui/
│   │       └── index.tsx          # CartView（CartItemRow, 税金表示, ConfirmDialog, QuantitySelector）
│   └── catalog/
│       └── ui/
│           └── index.tsx          # ProductDetail に onAddToCart/isAddingToCart prop 追加
│
└── app/
    └── (buyer)/
        └── nav.ts                 # カートリンク追加（Final Phase）

tests/
├── unit/
│   └── domains/
│       └── cart/
│           ├── us1/               # addToCart 単体
│           ├── us2/               # getCart 単体
│           ├── us3/               # updateCartItem 単体
│           ├── us4/               # removeFromCart 単体
│           └── us5/               # persistence 単体
├── integration/
│   └── domains/
│       └── cart/
│           ├── us1/               # POST /api/cart/items 統合
│           ├── us2/               # GET /api/cart 統合
│           ├── us3/               # PUT /api/cart/items/:id 統合
│           └── us4/               # DELETE /api/cart/items/:id 統合
└── e2e/
    ├── cart-us1.spec.ts           # 商品追加 E2E
    ├── cart-us2.spec.ts           # カート確認 E2E
    ├── cart-us3.spec.ts           # 数量変更 E2E
    ├── cart-us4.spec.ts           # 商品削除 E2E
    └── cart-us5.spec.ts           # 永続化 E2E
```

**Structure Decision**: 既存の src/domains/cart/（スタブ）を本番実装に置き換える。新規ファイル作成は最小限。

## ユーザーストーリーと実装方針

### US1 (P1): カートに商品を追加する

**主要変更ファイル**:
- `src/contracts/cart.ts` — ProductFetcher に `stock: number` を追加
- `src/infrastructure/repositories/cart.ts` — productFetcher に stock を含める
- `src/domains/cart/api/index.ts` — addToCart 実装（stock チェック付き）
- `src/domains/catalog/ui/index.tsx` — ProductDetail に `onAddToCart`/`isAddingToCart` prop 追加
- `src/app/(buyer)/catalog/[id]/page.tsx` — useFormSubmit で addToCart API 呼び出し + 401 リダイレクト + emitCartUpdated

**在庫チェックロジック** (FR-003):
```typescript
// domains/cart/api/index.ts - addToCart
const product = await context.productFetcher.findById(input.productId);
if (!product) throw new NotFoundError('商品が見つかりません');
const cart = await context.repository.findByUserId(userId) || { items: [] };
const existing = cart.items.find(i => i.productId === input.productId);
const currentQty = existing?.quantity ?? 0;
if (currentQty + (input.quantity ?? 1) > product.stock) {
  throw new AppError(ErrorCode.UNPROCESSABLE_ENTITY, '在庫不足です');
}
```

**二重送信防止** (FR-005): useFormSubmit の `isSubmitting` を `isAddingToCart` として ProductDetail に渡す

**未ログインリダイレクト** (FR-007): fetch が 401 → `router.push('/login?callbackUrl=' + encodeURIComponent(pathname))`

---

### US2 (P2): カート内容を確認する

**主要変更ファイル**:
- `src/domains/cart/api/index.ts` — getCart 実装
- `src/domains/cart/ui/index.tsx` — CartView 実装（税金表示含む）
- `src/app/(buyer)/cart/page.tsx` — 'use client' + useFetch('/api/cart') + CartView

**税金計算** (FR-009):
```typescript
// CartView 内
const tax = Math.floor(cart.subtotal * 0.1);
const total = cart.subtotal + tax;
```

**空カート表示** (FR-010):
```tsx
{cart.items.length === 0 && (
  <Empty message="カートに商品がありません">
    <Link href="/catalog">商品一覧を見る</Link>
  </Empty>
)}
```

---

### US3 (P3): カート内の数量を変更する

**主要変更ファイル**:
- `src/domains/cart/api/index.ts` — updateCartItem 実装（stock チェック付き）
- `src/domains/cart/ui/index.tsx` — CartItemRow の QuantitySelector に max=min(99, stock) を渡す

**在庫超過チェック** (FR-012):
```typescript
// domains/cart/api/index.ts - updateCartItem
const product = await context.productFetcher.findById(input.productId);
if (!product) throw new CartItemNotFoundError('商品が見つかりません');
if (input.quantity > product.stock) {
  throw new AppError(ErrorCode.UNPROCESSABLE_ENTITY, '在庫不足です');
}
```

**QuantitySelector の max**: 仕様 US3 AC-3「1未満または100以上の値を入力しようとする → 入力が制限され変更できない」に基づき `max={99}` を使用。在庫チェックはサーバー側で実施（422 → useToast でエラー表示）。CartItemSchema への stock 追加は不要。

---

### US4 (P4): カートから商品を削除する

**主要変更ファイル**:
- `src/domains/cart/api/index.ts` — removeFromCart 実装
- `src/domains/cart/ui/index.tsx` — ConfirmDialog 確認付き削除（サンプル参照）

**削除パターン** (FR-013, FR-014): サンプル `CartView.tsx` をそのまま参照。`pendingRemoveId` state + ConfirmDialog。

---

### US5 (P5): カート内容を永続化する

**主要変更ファイル**: なし（既存インフラで充足）

**検証**: E2E テストでページ遷移・リロード後の保持を確認。

---

## 技術決定事項サマリー

| 決定 | 内容 | 参照 |
|---|---|---|
| ProductFetcher stock 追加 | contracts/cart.ts + infra に stock フィールドを追加 | research.md Decision 2 |
| QuantitySelector max=99 | CartItem に stock 追加せず。UI は max=99 で 1〜99 制限。在庫チェックはサーバー側 | plan US3 |
| API ルート移行 | createRouteHandler パターンに統一 | research.md Decision 3 |
| 税金計算 | CartView (UI) で Math.floor(subtotal * 0.1) | research.md Decision 5 |
| 未ログインリダイレクト | catalog/[id]/page.tsx で 401 → router.push('/login?callbackUrl=...') | research.md Decision 7 |
| nav.ts 更新 | Final Phase でカートリンク追加 | research.md Decision 10 |

## 複雑性トラッキング

Constitution Check 違反なし。トラッキング不要。
