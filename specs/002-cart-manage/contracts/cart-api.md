# API コントラクト: カート管理機能 (002-cart-manage)

**Phase 1 完了日**: 2026-02-27

---

## 共通仕様

- **認証**: 全エンドポイントで buyer ロールが必要。未認証時は `401 UNAUTHORIZED`
- **レスポンス形式**: `{ success: true, data: T }` または `{ success: false, error: { code, message } }`
- **実装ファイル**: `src/app/api/cart/`（既存、createRouteHandler に移行済み）

---

## GET /api/cart

**目的**: ログイン中購入者のカートを取得（存在しない場合は空カートを作成）

**認証**: buyer required

**入力**: なし

**出力**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "productName": "ミニマルTシャツ",
        "price": 4980,
        "imageUrl": "https://...",
        "quantity": 2,
        "addedAt": "2026-02-27T00:00:00.000Z"
      }
    ],
    "subtotal": 9960,
    "itemCount": 2,
    "createdAt": "2026-02-27T00:00:00.000Z",
    "updatedAt": "2026-02-27T00:00:00.000Z"
  }
}
```

**エラー**:
- `401` ログインが必要です

**テスト要件**:
- buyer でアクセス → 200 + CartSchema
- 未認証でアクセス → 401
- カートなし → 空カート（items=[]）を返す

---

## POST /api/cart/items

**目的**: カートに商品を追加（同一商品は数量加算）

**認証**: buyer required

**入力** (request body):
```json
{
  "productId": "uuid",
  "quantity": 1
}
```
- `productId`: 必須, UUID
- `quantity`: オプション, integer ≥1, default: 1

**出力**: `201 Created`
```json
{ "success": true, "data": { /* Cart */ } }
```

**エラー**:
- `401` ログインが必要です
- `404` 商品が見つかりません（productId が存在しない）
- `422` 在庫不足です（カート内数量 + quantity > stock の場合）
- `400` バリデーションエラー（無効な productId, quantity < 1）

**ビジネスルール**:
- 同一商品が既存の場合: `existing.quantity += quantity`（新規追加ではなくマージ）
- 追加後のカート内数量が stock を超える場合は拒否

**テスト要件**:
- 新商品追加 → 201 + カート内に商品あり
- 同一商品追加 → 201 + quantity が加算されている
- stock=0 商品 → 422
- カート内数量が stock に達した状態での追加 → 422
- 存在しない productId → 404
- 未認証 → 401

---

## PUT /api/cart/items/:productId

**目的**: カート内の商品数量を変更

**認証**: buyer required

**URL パラメータ**: `productId` (UUID)

**入力** (request body):
```json
{ "quantity": 3 }
```
- `quantity`: 必須, integer 1〜99

**出力**: `200 OK`
```json
{ "success": true, "data": { /* Cart */ } }
```

**エラー**:
- `401` ログインが必要です
- `404` カートアイテムが見つかりません
- `422` 在庫不足です（quantity > stock の場合）

**ビジネスルール**:
- quantity は 1〜min(99, stock) の範囲内でのみ変更可能

**テスト要件**:
- 有効な数量に変更 → 200 + 小計・合計更新
- stock 超過数量 → 422
- 99 超過数量 → 400 (バリデーション)
- カートにない商品 → 404

---

## DELETE /api/cart/items/:productId

**目的**: カートから特定商品を削除

**認証**: buyer required

**URL パラメータ**: `productId` (UUID)

**入力**: なし

**出力**: `200 OK`
```json
{ "success": true, "data": { /* Cart (商品削除後) */ } }
```

**エラー**:
- `401` ログインが必要です
- `404` カートアイテムが見つかりません

**テスト要件**:
- 存在する商品を削除 → 200 + items から除外
- 最後の1件を削除 → 200 + items=[], itemCount=0, subtotal=0
- カートにない商品 → 404
- 未認証 → 401

---

## テスト用スキーマ検証

### CartSchema
```typescript
import { CartSchema } from '@/contracts/cart';
CartSchema.parse(response.data); // throws if invalid
```

### 統合テスト用リセット
```typescript
import { resetCartStore } from '@/infrastructure/repositories';
beforeEach(() => resetCartStore());
```
