# Implementation Plan: 注文機能

**Branch**: `003-order-manage` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)

## サマリー

購入者がカートから注文を確定し、注文履歴・注文詳細を閲覧できる機能と、管理者が全注文のステータスを管理できる機能を実装する。注文ステータス遷移はステートマシンパターン（`OrderStateMachine` クラス）で厳密に管理し、`ValidStatusTransitions` テーブル（contracts 定義済み）を唯一の情報源とする。

既存コード（API routes・ドメインスタブ・インフラ・コントラクト）を活かしつつ、`Order` エンティティに `subtotal`/`tax` フィールドを追加する。

## 技術コンテキスト

**Language/Version**: TypeScript 5 (strict mode) + React 18
**Primary Dependencies**: Next.js 14 (App Router), Zod, Tailwind CSS 3
**Storage**: インメモリストア（`src/infrastructure/store.ts`・HMR 対応）
**Testing**: Vitest（単体・統合）, Playwright（E2E）
**Target Platform**: Web アプリケーション（ブラウザ + Node.js server）
**Performance Goals**: 一覧ページ初回ロード 3秒以内
**Constraints**: TypeScript strict エラー 0件・ESLint エラー 0件
**Scale/Scope**: シングルプロジェクト（buyer + admin 両ロール）

## Constitution Check

| 原則 | 評価 | 備考 |
|------|------|------|
| I. 共有基盤の利用 | ✅ | `@/components` barrel から UI 使用、`createRouteHandler` で API 統一 |
| II. ドメイン分離 | ✅ | `src/domains/orders/` に集約、ドメイン間は API 経由のみ |
| III. TDD 必須 | ✅ | 各 US で Red→Green→Refactor を厳守 |
| IV. 実装ガードレール | ✅ | Foundation/Templates/Components/Samples 変更なし。Contracts・Domains・App ルート・Tests のみ変更 |

**Complexity Tracking**: 違反なし。

## プロジェクト構造

### ドキュメント (本フィーチャー)

```text
specs/003-order-manage/
├── plan.md              # 本ファイル
├── spec.md              # 機能仕様
├── research.md          # Phase 0 調査結果
├── data-model.md        # エンティティ定義・ステートマシン
├── quickstart.md        # テストシナリオ
├── contracts/
│   └── api.md           # API コントラクト
├── checklists/
│   └── requirements.md  # 要件チェックリスト
└── tasks.md             # フェーズ2出力 (/speckit.tasks)
```

### ソースコード（実装完了後の目標状態）

```text
src/
├── contracts/
│   └── orders.ts                    # 更新: subtotal/tax フィールド追加
├── domains/orders/
│   ├── api/
│   │   ├── index.ts                 # 更新: 4関数の本番実装
│   │   └── state-machine.ts         # 新規: OrderStateMachine クラス
│   └── ui/
│       ├── index.tsx                # 更新: OrderList・OrderDetail エクスポート
│       ├── OrderList.tsx            # 新規: 注文一覧 UI コンポーネント
│       └── OrderDetail.tsx          # 新規: 注文詳細 UI コンポーネント
├── app/
│   ├── (buyer)/
│   │   ├── cart/page.tsx            # 更新: onCheckout prop を CartView に追加
│   │   ├── checkout/page.tsx        # 更新: 完全実装（useFetch + useFormSubmit）
│   │   ├── orders/
│   │   │   ├── page.tsx             # 更新: OrderList ドメイン UI を配線
│   │   │   └── [id]/page.tsx        # 更新: OrderDetail ドメイン UI を配線
│   │   └── nav.ts                   # 更新: 注文履歴リンク追加
│   ├── admin/
│   │   ├── orders/
│   │   │   ├── page.tsx             # 更新: 管理者注文一覧（フィルタ付き）
│   │   │   └── [id]/page.tsx        # 更新: 管理者注文詳細（ステータス更新）
│   │   └── nav.ts                   # 更新: 注文管理リンク追加
│   └── api/orders/
│       ├── route.ts                 # 更新: createRouteHandler に統一
│       └── [id]/route.ts            # 更新: createRouteHandler に統一
└── infrastructure/repositories/
    └── order.ts                     # 更新: create() に subtotal/tax を追加

tests/
├── unit/domains/orders/
│   ├── us1/                         # createOrder テスト
│   ├── us2/                         # getOrders テスト
│   ├── us3/                         # getOrderById テスト
│   ├── us4/                         # updateOrderStatus + OrderStateMachine テスト
│   └── us5/                         # アクセス制御テスト
├── integration/domains/orders/
│   ├── us1/                         # 注文作成 API 契約テスト
│   ├── us2/                         # 注文一覧 API 契約テスト
│   ├── us3/                         # 注文詳細 API 契約テスト
│   └── us4/                         # ステータス更新 API 契約テスト
└── e2e/
    ├── orders-us1.spec.ts            # チェックアウト・注文確定
    ├── orders-us2.spec.ts            # 注文履歴一覧
    ├── orders-us3.spec.ts            # 注文詳細
    ├── orders-us4.spec.ts            # 管理者注文管理
    └── orders-us5.spec.ts            # アクセス制御
```

## ユーザーストーリー詳細

### US1: チェックアウトと注文確定 (P1)

**実装対象**:
- `src/contracts/orders.ts` → `Order` に `subtotal`/`tax` 追加
- `src/infrastructure/repositories/order.ts` → `create()` に subtotal/tax 対応
- `src/domains/orders/api/state-machine.ts` → `OrderStateMachine` 新規作成
- `src/domains/orders/api/index.ts` → `createOrder` 実装
- `src/app/api/orders/route.ts` → `createRouteHandler` に統一
- `src/domains/cart/ui/index.tsx` → `CartView` に `onCheckout` props 追加
- `src/app/(buyer)/cart/page.tsx` → `onCheckout` を渡す
- `src/app/(buyer)/checkout/page.tsx` → 完全実装

**テスト**:
- `tests/unit/domains/orders/us1/` — createOrder 単体テスト（tax 計算・カートクリア・ForbiddenError・EmptyCartError）
- `tests/integration/domains/orders/us1/` — POST /api/orders 契約テスト
- `tests/e2e/orders-us1.spec.ts` — カート→チェックアウト→注文確定→完了画面

### US2: 注文履歴閲覧 (P2)

**実装対象**:
- `src/domains/orders/api/index.ts` → `getOrders` 実装
- `src/app/api/orders/route.ts` → GET 配線（createRouteHandler）
- `src/domains/orders/ui/OrderList.tsx` → 新規作成
- `src/domains/orders/ui/index.tsx` → `OrderList` エクスポート更新
- `src/app/(buyer)/orders/page.tsx` → `useFetch` + `OrderList` 配線

**テスト**:
- `tests/unit/domains/orders/us2/` — getOrders（buyer 絞り込み・ページネーション）
- `tests/integration/domains/orders/us2/` — GET /api/orders 契約テスト
- `tests/e2e/orders-us2.spec.ts` — 一覧表示・注文クリックで詳細へ

### US3: 注文詳細閲覧 (P3)

**実装対象**:
- `src/domains/orders/api/index.ts` → `getOrderById` 実装
- `src/app/api/orders/[id]/route.ts` → GET 配線
- `src/domains/orders/ui/OrderDetail.tsx` → 新規作成
- `src/domains/orders/ui/index.tsx` → `OrderDetail` エクスポート更新
- `src/app/(buyer)/orders/[id]/page.tsx` → `useFetch` + `OrderDetail` 配線

**テスト**:
- `tests/unit/domains/orders/us3/` — getOrderById（自分・他人・NotFound）
- `tests/integration/domains/orders/us3/` — GET /api/orders/:id 契約テスト
- `tests/e2e/orders-us3.spec.ts` — 詳細表示・他人の注文アクセス拒否

### US4: 管理者注文管理 (P4)

**実装対象**:
- `src/domains/orders/api/index.ts` → `updateOrderStatus` 実装（`OrderStateMachine.transition()` 使用）
- `src/app/api/orders/[id]/route.ts` → PATCH 配線
- `src/app/admin/orders/page.tsx` → 管理者一覧（ステータスフィルタ・ページネーション）
- `src/app/admin/orders/[id]/page.tsx` → 管理者詳細（ステータス更新・遷移制約 UI）
- `src/app/admin/nav.ts` → 注文管理リンク追加

**テスト**:
- `tests/unit/domains/orders/us4/` — updateOrderStatus・OrderStateMachine 全遷移検証
- `tests/integration/domains/orders/us4/` — PATCH /api/orders/:id 契約テスト
- `tests/e2e/orders-us4.spec.ts` — 管理者ステータス更新（有効・無効遷移）

### US5: アクセス制御 (P5)

**実装対象**:
- `src/app/(buyer)/orders/page.tsx` / `[id]/page.tsx` / `checkout/page.tsx` → `useFetch` の `loginUrl` オプション設定確認
- `src/app/(buyer)/nav.ts` → 注文履歴リンク追加

**テスト**:
- `tests/unit/domains/orders/us5/` — 未ログイン・権限不足シナリオ
- `tests/e2e/orders-us5.spec.ts` — 未ログインリダイレクト・buyer の管理画面アクセス拒否

## 実装上の注意事項

### OrderStateMachine クラスの設計

```typescript
// src/domains/orders/api/state-machine.ts
import { type OrderStatus, ValidStatusTransitions } from '@/contracts/orders';
import { InvalidStatusTransitionError } from '.';

export class OrderStateMachine {
  static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    return ValidStatusTransitions[current].includes(next);
  }

  static transition(current: OrderStatus, next: OrderStatus): void {
    if (!this.canTransition(current, next)) {
      throw new InvalidStatusTransitionError(
        `ステータスを ${current} から ${next} に変更できません`
      );
    }
  }

  static getAllowedTransitions(current: OrderStatus): readonly OrderStatus[] {
    return ValidStatusTransitions[current];
  }
}
```

### 消費税計算

```typescript
const subtotal = cart.subtotal;
const tax = Math.floor(subtotal * 0.1);
const totalAmount = subtotal + tax;
```

### CartView への onCheckout prop

```typescript
// CartView props 追加
onCheckout?: () => void;

// CartView 内: items.length > 0 の場合のみ表示
// ドメイン UI の制約: useRouter 禁止 → onCheckout コールバック
<Link href="/checkout">注文手続きへ</Link>
// ※ Link は next/link だが、href は固定文字列のため問題なし
// または: onCheckout コールバック props 経由
```

**注意**: ドメイン UI では `useRouter` 禁止だが `next/link` の `Link` は静的な href での使用は許可（インラインナビゲーション）。ただし、動的ルーティング（router.push 等）はコールバック経由。

### 既存 API routes の差し替え

現在 `src/app/api/orders/` の route ファイルは手書き try-catch パターン。`createRouteHandler` に統一する際はサンプルの実装 (`src/app/(samples)/sample/api/orders/`) を参照する。
