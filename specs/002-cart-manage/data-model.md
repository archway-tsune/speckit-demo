# データモデル: カート管理機能 (002-cart-manage)

**Phase 1 完了日**: 2026-02-27

---

## エンティティ一覧

### Cart（カート）

| フィールド | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, auto-generated | カートID |
| userId | UUID | FK → User | 購入者ID（1 User : 1 Cart） |
| items | CartItem[] | | カートアイテムの配列 |
| subtotal | number (int, ≥0) | | 商品合計金額（税抜） |
| itemCount | number (int, ≥0) | | 全アイテムの quantity 合計 |
| createdAt | Date | | 作成日時 |
| updatedAt | Date | | 最終更新日時 |

**ビジネスルール**:
- 1 購入者につき 1 カート（userId でキー）
- subtotal = Σ(item.price × item.quantity)
- itemCount = Σ(item.quantity)
- カートが存在しない場合は GET 時に自動作成（空カート）

---

### CartItem（カートアイテム）

| フィールド | 型 | 制約 | 説明 |
|---|---|---|---|
| productId | UUID | FK → Product | 商品ID |
| productName | string | | 商品名（追加時にスナップショット） |
| price | number (int, ≥0) | | 単価（追加時にスナップショット） |
| imageUrl | string (URL) | optional | 商品画像URL |
| quantity | number (int, 1〜99) | | 数量 |
| addedAt | Date | | カートへの追加日時 |

**ビジネスルール**:
- 同一 productId が既存の場合、quantity を加算（マージ）
- quantity の UI 制限: 1〜99（QuantitySelector max=99）
- quantity のサーバー制限: 在庫超過は 422 エラー
- price・productName はカート追加時に固定（後の価格変更は影響しない）
- quantity は 1 以上。数量変更で 0 にしたい場合は削除操作を使用

---

### Product（商品 - 参照のみ）

Catalog ドメインが管理。CartItem からの参照のみ。

| フィールド | 型 | 説明 |
|---|---|---|
| id | UUID | 商品ID |
| name | string | 商品名 |
| price | number (int) | 単価 |
| stock | number (int, ≥0) | 在庫数 |
| imageUrl | string (URL)? | 商品画像URL |
| status | 'published' \| 'draft' | 公開状態 |

**カートドメインでの利用**: `ProductFetcher` インターフェース経由でのみアクセス。

---

## エンティティ関係図

```text
User ──1:1──► Cart ──1:N──► CartItem ──N:1──► Product
                              (snapshot)        (参照元)
```

---

## 状態遷移

### Cart の状態

```text
[存在しない]
    │  GET /api/cart (自動作成)
    ▼
[空カート] (items = [])
    │  POST /api/cart/items
    ▼
[カートあり] (items.length > 0)
    │  DELETE /api/cart/items/:productId (最後の1件)
    ▼
[空カート]
```

### CartItem の数量変更制約

```text
条件: quantity_new ≤ min(99, stock)
違反時: 422 Unprocessable Entity (在庫不足エラー)
```

---

## バリデーションルール

| ルール | FR | 実装場所 |
|---|---|---|
| addToCart: カート内数量 + 1 ≤ stock | FR-003 | domains/cart/api - addToCart |
| addToCart: stock=0 商品は追加不可 | FR-004 | domains/catalog/ui - ボタン無効化 |
| updateCartItem: 1 ≤ quantity ≤ min(99, stock) | FR-011, FR-012 | domains/cart/api - updateCartItem |
| removeFromCart: カートに存在する商品のみ削除可 | FR-014 | domains/cart/api - removeFromCart |

---

## インフラストラクチャ

- **ストレージ**: インメモリ（`createStore<Cart>('carts')`、globalThis で HMR 対応）
- **永続性**: Next.js サーバーの生存期間（再起動でリセット）
- **将来の移行先**: DB 永続化（スコープ外）
