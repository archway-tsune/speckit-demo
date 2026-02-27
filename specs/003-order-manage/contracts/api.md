# API コントラクト: 注文機能

ベース URL: `/api/orders`

既存の route ファイルをそのまま利用し、実装を差し替える。新規 endpoint は不要。

---

## GET /api/orders — 注文一覧取得

**認可**: buyer（自分の注文のみ）/ admin（全注文）

**クエリパラメーター**:

| パラメーター | 型 | デフォルト | 説明 |
|------------|-----|---------|------|
| page | number | 1 | ページ番号（1始まり） |
| limit | number | 20 | 1ページあたりの件数（max 100） |
| status | OrderStatus | - | ステータス絞り込み（admin のみ有効） |
| userId | UUID | - | ユーザー絞り込み（admin のみ有効） |

**レスポンス 200**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "userId": "uuid",
        "items": [
          { "productId": "uuid", "productName": "商品名", "price": 4980, "quantity": 2 }
        ],
        "subtotal": 9960,
        "tax": 996,
        "totalAmount": 10956,
        "status": "pending",
        "createdAt": "2026-02-27T00:00:00.000Z",
        "updatedAt": "2026-02-27T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

**エラー**:
- 401: 未認証

---

## GET /api/orders/:id — 注文詳細取得

**認可**: buyer（自分の注文のみ）/ admin（全注文）

**パスパラメーター**: `id` (UUID)

**レスポンス 200**: Order オブジェクト（上記と同形）

**エラー**:
- 401: 未認証
- 404: 注文が存在しない / buyer が他人の注文にアクセス

---

## POST /api/orders — 注文作成

**認可**: buyer のみ

**リクエストボディ**:
```json
{ "confirmed": true }
```

`confirmed: true` はチェックアウト画面の確認ステップ通過の証跡。

**処理**:
1. カートを取得（空なら EmptyCartError → 400）
2. cart.items → OrderItem[] に変換（スナップショット）
3. tax = `Math.floor(cart.subtotal * 0.1)`
4. totalAmount = `cart.subtotal + tax`
5. 注文を `status: 'pending'` で作成
6. カートをクリア

**レスポンス 201**: 作成された Order オブジェクト

**エラー**:
- 400: カートが空 / confirmed: true でない
- 401: 未認証
- 403: admin がアクセス

---

## PATCH /api/orders/:id — ステータス更新

**認可**: admin のみ

**リクエストボディ**:
```json
{ "status": "confirmed" }
```

**処理**:
1. 注文を取得（存在しない場合 NotFoundError → 404）
2. `OrderStateMachine.transition(order.status, input.status)` で遷移検証
3. リポジトリで status 更新

**レスポンス 200**: 更新された Order オブジェクト

**エラー**:
- 400: 不正なステータス遷移（InvalidStatusTransitionError）
- 401: 未認証
- 403: admin 以外がアクセス
- 404: 注文が存在しない

---

## テスト要件

### 単体テスト対象

| 関数 | テストケース |
|------|-------------|
| `createOrder` | ① 正常: buyer・カートあり → 注文作成・カートクリア・tax計算正確 |
| `createOrder` | ② 異常: カート空 → EmptyCartError |
| `createOrder` | ③ 異常: confirmed: true でない → ValidationError |
| `createOrder` | ④ 異常: admin がアクセス → ForbiddenError |
| `getOrders` | ⑤ 正常: buyer → 自分の注文のみ返す |
| `getOrders` | ⑥ 正常: admin → 全注文返す |
| `getOrders` | ⑦ 正常: admin + status フィルタ → 絞り込み結果 |
| `getOrderById` | ⑧ 正常: buyer が自分の注文取得 |
| `getOrderById` | ⑨ 異常: buyer が他人の注文取得 → NotFoundError |
| `getOrderById` | ⑩ 異常: 存在しない ID → NotFoundError |
| `updateOrderStatus` | ⑪ 正常: admin が有効遷移 (pending→confirmed) |
| `updateOrderStatus` | ⑫ 異常: 無効遷移 (delivered→pending) → InvalidStatusTransitionError |
| `updateOrderStatus` | ⑬ 異常: buyer がアクセス → ForbiddenError |
| `OrderStateMachine.transition` | ⑭ 全有効遷移のテーブル検証 |
| `OrderStateMachine.transition` | ⑮ 全無効遷移のテーブル検証 |
| `OrderStateMachine.canTransition` | ⑯ 終端状態（delivered/cancelled）から遷移不可 |

### 統合テスト対象

| テスト | 内容 |
|--------|------|
| POST /api/orders | Schema.parse() で Order 契約検証 |
| GET /api/orders | ページネーション構造検証 |
| PATCH /api/orders/:id | ステータス更新後の状態検証 |

### E2E テスト対象

| ストーリー | シナリオ |
|-----------|---------|
| US1 | カート→チェックアウト→注文確定→完了画面・カートクリア |
| US2 | 注文履歴一覧表示・注文クリックで詳細へ遷移 |
| US3 | 注文詳細表示・他人の注文アクセス拒否 |
| US4 | 管理者ステータス更新（有効・無効遷移） |
| US5 | 未ログインリダイレクト・buyer の管理画面アクセス拒否 |
