# リサーチ結果: 注文機能

## 既存コードの調査結果

### 事前配線済みの要素

| 要素 | パス | 状態 |
|------|------|------|
| API Route: 注文一覧/作成 | `src/app/api/orders/route.ts` | 手書き try-catch → createRouteHandler に差し替え必要 |
| API Route: 注文詳細/更新 | `src/app/api/orders/[id]/route.ts` | 同上 |
| ドメイン API スタブ | `src/domains/orders/api/index.ts` | NotImplementedError 実装済み・カスタムエラークラス定義済み |
| ドメイン UI スタブ | `src/domains/orders/ui/index.tsx` | OrderList・OrderDetail 定義済み（props なし） |
| インフラ: リポジトリ | `src/infrastructure/repositories/order.ts` | インメモリ実装完成済み |
| コントラクト | `src/contracts/orders.ts` | ValidStatusTransitions 定義済み・Order スキーマ要更新 |
| 購入者ページ: 注文一覧 | `src/app/(buyer)/orders/page.tsx` | OrderList import 済み（props なし呼び出し） |
| 購入者ページ: 注文詳細 | `src/app/(buyer)/orders/[id]/page.tsx` | OrderDetail import 済み（props なし呼び出し） |
| 購入者ページ: チェックアウト | `src/app/(buyer)/checkout/page.tsx` | 完全な生スタブ（domain import なし） |
| 管理者ページ: 注文一覧 | `src/app/admin/orders/page.tsx` | 完全な生スタブ |
| 管理者ページ: 注文詳細 | `src/app/admin/orders/[id]/page.tsx` | 完全な生スタブ |

---

## Decision 1: Order エンティティに subtotal/tax フィールドを追加する

**問題**: 仕様では「注文エンティティに小計・消費税・合計金額の3つを記録する」と定義されているが、現在の `src/contracts/orders.ts` の `OrderSchema` には `totalAmount` のみで `subtotal`・`tax` フィールドが存在しない。

**決定**: `src/contracts/orders.ts` の `OrderSchema` に `subtotal` と `tax` フィールドを追加する。`OrderRepository.create()` インターフェースも同様に更新する。

**実装**:
```typescript
export const OrderSchema = z.object({
  // 既存フィールド...
  subtotal: z.number().int().min(0),    // 追加: 税抜小計
  tax: z.number().int().min(0),         // 追加: 消費税（10%、端数切り捨て）
  totalAmount: z.number().int().min(0), // 既存: 税込合計
  // ...
});
```

計算式: `tax = Math.floor(subtotal * 0.1)`, `totalAmount = subtotal + tax`

**却下案**:
- `totalAmount` のみに留め UI で再計算する → 注文履歴表示時に再計算が必要になりデータの一貫性が失われる

---

## Decision 2: ステータス遷移をステートマシンパターンで管理する

**要求**: ユーザー指示「ステータス遷移はステートマシンパターンで厳密に管理する」

**既存資産**: `ValidStatusTransitions: Record<OrderStatus, OrderStatus[]>` が `src/contracts/orders.ts` に定義済み。

**決定**: `src/domains/orders/api/state-machine.ts` に `OrderStateMachine` クラスを作成し、遷移ルールを一箇所で管理する。全ての遷移検証はこのクラスを通じて行う。

```typescript
export class OrderStateMachine {
  static canTransition(current: OrderStatus, next: OrderStatus): boolean
  static transition(current: OrderStatus, next: OrderStatus): void  // 不正遷移時 InvalidStatusTransitionError
  static getAllowedTransitions(current: OrderStatus): readonly OrderStatus[]
}
```

- 遷移テーブルは `ValidStatusTransitions`（contracts）から参照（二重管理回避）
- `transition()` は状態変更時に必ず呼ぶゲートウェイ関数
- `canTransition()` は UI で利用可能ボタンを判定するための純粋関数
- `getAllowedTransitions()` は管理画面のセレクトボックス選択肢に使用

**却下案**:
- switch 文でインライン検証 → ドメイン分散・テスト困難
- 都度 `ValidStatusTransitions` を直接参照 → ステートマシンの責務が不明確

---

## Decision 3: API Route を createRouteHandler に統一する

**問題**: 現在の `src/app/api/orders/` の route ファイルは手書き try-catch パターンを使用しており、プロジェクトの憲章（共有基盤の利用）に違反している。

**決定**: `createRouteHandler()` を使用して書き直す。サンプル (`src/app/(samples)/sample/api/orders/`) と同じパターンに統一する。

---

## Decision 4: 購入者 UI コンポーネント設計

**CartView への「注文手続きへ」ボタン追加**:
- `CartView` に `onCheckout?: () => void` props を追加
- `CartPage` で `useRouter().push('/checkout')` を渡す
- カートが空（`items.length === 0`）の場合はボタンを非表示

**OrderList・OrderDetail コンポーネント**:
- `src/domains/orders/ui/` に `OrderList.tsx`・`OrderDetail.tsx` を新規作成
- サンプル実装（`src/samples/domains/orders/ui/`）をベースに `@/contracts/orders` 型を使用
- ドメイン UI の制約遵守: `useRouter` 禁止 → `onOrderClick`, `onBack` コールバック props を使用

**チェックアウトページ**:
- サンプル実装（`src/app/(samples)/sample/(buyer)/checkout/page.tsx`）をベースに `/api/orders` endpoint を参照
- `useFetch` + `useFormSubmit` フックを使用
- 注文確定後 `/orders/:id?completed=true` にリダイレクト

**管理者 Order List・Detail**:
- サンプル実装（`src/app/(samples)/sample/admin/orders/`）をベースに実装
- `OrderStateMachine.getAllowedTransitions()` でセレクトボックス選択肢を動的生成

---

## Decision 5: アクセス制御方針

**購入者ページ**: `useFetch` の `loginUrl` オプションで未ログイン時リダイレクト（既存パターン）。

**ドメイン API**: `authorize(session, 'buyer')` / `authorize(session, 'admin')` で RBAC 強制（`@/foundation/auth/authorize` 利用）。

**他人の注文へのアクセス**: `getOrderById` で `order.userId !== session.userId` の場合は `NotFoundError`（セキュリティ上、存在を漏らさない）。

**管理者ページ**: `src/app/admin/layout.tsx` の `AdminLayout` が `loginPath="/admin/login"` で保護。購入者ロールでログインした場合は `/forbidden` にリダイレクト（`AdminLayout` の既存機能）。

---

## Decision 6: 注文 UI での金額表示

チェックアウト・注文詳細での表示:
- 商品合計（小計・税抜）: `cart.subtotal` / `order.subtotal`
- 消費税（10%）: `Math.floor(subtotal * 0.1)` = `order.tax`
- 合計（税込）: `order.totalAmount`

cart.tsx との一貫性: CartView では `cart.subtotal` × 0.1 で表示しているため同じロジックを踏襲。

---

## 「実装不要」確認

| 確認事項 | 確認結果 |
|----------|----------|
| `OrderRepository` インメモリ実装 | ✅ `src/infrastructure/repositories/order.ts` に完全実装済み。`subtotal`/`tax` フィールド追加後は `create()` に渡す data の型が変わるだけで実装変更不要 |
| `getServerSession` | ✅ `src/infrastructure/auth/index.ts` に実装済み |
| 管理者レイアウト/認証保護 | ✅ `src/app/admin/layout.tsx` が `AdminLayout` で保護済み |
| 購入者レイアウト/認証保護 | ✅ `src/app/(buyer)/layout.tsx` が `BuyerLayout` で保護済み |
| `ValidStatusTransitions` テーブル | ✅ `src/contracts/orders.ts` に定義済み（OrderStateMachine が参照） |
