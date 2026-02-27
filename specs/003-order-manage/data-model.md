# データモデル: 注文機能

## エンティティ

### Order（注文）

`src/contracts/orders.ts` の `OrderSchema` を更新する（`subtotal`・`tax` フィールドを追加）。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK | 注文ID |
| userId | UUID | FK → User | 購入者ID |
| items | OrderItem[] | min(1) | 注文明細（スナップショット） |
| subtotal | int | min(0) | 税抜小計（カートの subtotal） |
| tax | int | min(0) | 消費税（floor(subtotal × 0.1)） |
| totalAmount | int | min(0) | 税込合計（subtotal + tax） |
| status | OrderStatus | enum | 注文ステータス |
| createdAt | DateTime | auto | 作成日時 |
| updatedAt | DateTime | auto | 更新日時 |

### OrderItem（注文明細）

注文作成時点の商品情報スナップショット。商品マスタとは独立して変更されない。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| productId | UUID | - | 商品ID（参照のみ） |
| productName | string | - | 商品名スナップショット |
| price | int | min(0) | 単価スナップショット |
| quantity | int | min(1) | 数量 |

---

## ステートマシン: OrderStatus

### 状態一覧

| ステータス値 | 表示名 | 説明 |
|-------------|--------|------|
| `pending` | 保留中 | 注文作成直後の初期状態 |
| `confirmed` | 確認済み | 管理者が注文を確認した状態 |
| `shipped` | 発送済み | 商品が発送された状態 |
| `delivered` | 配送完了 | 商品が届いた状態（終端） |
| `cancelled` | キャンセル | 注文がキャンセルされた状態（終端） |

### 遷移図

```
         ┌──────────────────────────────┐
         │                              │
         ▼                              │ cancel
    ┌─────────┐  confirm  ┌──────────┐  │
    │ pending │──────────▶│confirmed │──┤
    └─────────┘           └──────────┘  │
         │                    │ ship     │
         │ cancel             ▼          │
         │             ┌──────────┐     │
         └────────────▶│ shipped  │     │
                        └──────────┘     │
                             │ deliver    │
                             ▼           │
                        ┌──────────┐     │
                        │delivered │     │
                        └──────────┘     │
                                         │
                        ┌──────────┐     │
                        │cancelled │◀────┘
                        └──────────┘
```

### 遷移テーブル（ValidStatusTransitions）

| 現在の状態 | 遷移可能なステータス |
|-----------|---------------------|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `delivered` | （なし・終端） |
| `cancelled` | （なし・終端） |

### OrderStateMachine クラス（新規）

`src/domains/orders/api/state-machine.ts` に実装。

```typescript
class OrderStateMachine {
  static canTransition(current: OrderStatus, next: OrderStatus): boolean
  static transition(current: OrderStatus, next: OrderStatus): void
  // 不正遷移時: InvalidStatusTransitionError をスロー
  static getAllowedTransitions(current: OrderStatus): readonly OrderStatus[]
}
```

遷移テーブルは `@/contracts/orders` の `ValidStatusTransitions` を参照（二重管理しない）。

---

## エンティティ関係

```
User ──1:N──▶ Order ──1:N──▶ OrderItem
                                │
                                └──▶ Product (productId 参照のみ・スナップショット)

Cart ──(注文作成時に参照)──▶ Order
     └──(注文作成後にクリア)
```

---

## バリデーションルール

| ルール | 対象 | 内容 |
|--------|------|------|
| 空カート禁止 | createOrder | cart.items.length > 0 必須。違反時 EmptyCartError |
| ステータス遷移 | updateOrderStatus | ValidStatusTransitions に基づく。違反時 InvalidStatusTransitionError |
| 購入者専用 | createOrder | role === 'buyer' 必須。違反時 ForbiddenError |
| 管理者専用 | updateOrderStatus | role === 'admin' 必須。違反時 ForbiddenError |
| 他人の注文 | getOrderById | role === 'buyer' かつ userId 不一致時 NotFoundError（存在を漏らさない） |
