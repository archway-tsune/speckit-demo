# API コントラクト: 商品管理機能

**作成日**: 2026-02-27
**対応フィーチャー**: `004-product-manage`

---

## 概要

全エンドポイントは管理者（`admin`）ロールのセッションが必須。未認証は 401、buyer ロールは 403 を返す。

---

## エンドポイント一覧

### GET /api/admin/products — 商品一覧（US1）

管理者向け全商品一覧。全ステータス対象。ページネーション対応。

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `page` | `number` | 任意 | ページ番号（1始まり）、デフォルト: 1 |
| `limit` | `number` | 任意 | 1ページあたりの件数（1〜100）、デフォルト: 20 |
| `status` | `draft \| published \| archived` | 任意 | ステータスフィルタ |
| `q` | `string` | 任意 | キーワード検索（商品名・説明文の部分一致） |

**レスポンス 200**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "商品名",
        "price": 4980,
        "description": "説明文",
        "imageUrl": "https://example.com/image.jpg",
        "stock": 50,
        "status": "published",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 16,
      "totalPages": 1
    }
  }
}
```

**エラー**: 401 (未認証), 403 (buyer)

---

### POST /api/admin/products — 商品新規作成（US2）

新商品を作成する。初期ステータスは `draft`。

**リクエストボディ**:
```json
{
  "name": "新商品名",
  "price": 5000,
  "description": "商品説明（任意）",
  "imageUrl": "https://example.com/image.jpg",
  "stock": 10
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|----------------|
| `name` | `string` | ✅ | 1〜200文字 |
| `price` | `number` | ✅ | 0以上の整数 |
| `description` | `string` | 任意 | 最大2000文字 |
| `imageUrl` | `string` | 任意 | 有効なURL形式 |
| `stock` | `number` | 任意 | 0以上の整数、デフォルト: 0 |

**レスポンス 201**:
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "新商品名",
    "price": 5000,
    "status": "draft",
    "stock": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**エラー**: 401 (未認証), 403 (buyer), 422 (バリデーションエラー)

---

### GET /api/admin/products/[id] — 商品詳細（US3 編集フォーム用）

指定商品の全フィールドを返す（編集フォームのプリロード用）。

**パスパラメータ**: `id` (UUID)

**レスポンス 200**: Product オブジェクト（POST と同構造）

**エラー**: 401, 403, 404 (存在しない商品)

---

### PUT /api/admin/products/[id] — 商品更新（US3）

指定商品のフィールドを部分更新する。指定されたフィールドのみ更新。

**パスパラメータ**: `id` (UUID)

**リクエストボディ** (全フィールド任意):
```json
{
  "name": "更新後の商品名",
  "price": 5500,
  "description": "更新後の説明",
  "imageUrl": "https://example.com/new.jpg",
  "stock": 20
}
```

**レスポンス 200**: 更新後の Product オブジェクト

**エラー**: 401, 403, 404, 422

---

### PATCH /api/admin/products/[id]/status — ステータス更新（US4）

商品一覧の inline ドロップダウンからステータスを即時変更する専用エンドポイント。

**パスパラメータ**: `id` (UUID)

**リクエストボディ**:
```json
{
  "status": "published"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|----------------|
| `status` | `draft \| published \| archived` | ✅ | ProductStatusSchema |

**レスポンス 200**: 更新後の Product オブジェクト

**エラー**: 401, 403, 404, 422

---

### DELETE /api/admin/products/[id] — 商品削除（US5）

指定商品を削除する。UI 側で確認ダイアログを表示し、承認後にこのエンドポイントを呼び出す。

**パスパラメータ**: `id` (UUID)

**レスポンス 200**:
```json
{
  "success": true,
  "data": { "success": true }
}
```

**エラー**: 401, 403, 404

---

## 既存ルートの変更

| エンドポイント | 変更内容 |
|----------------|----------|
| `POST /api/catalog/products` | ハンドラを削除（admin CRUD は `/api/admin/products` へ移管） |
| `PUT /api/catalog/products/[id]` | ハンドラを削除 |
| `DELETE /api/catalog/products/[id]` | ハンドラを削除 |

---

## 契約ファイル

`src/contracts/products.ts` に以下を定義:

- `GetAdminProductsInputSchema` / `GetAdminProductsOutputSchema`
- `CreateProductInputSchema` / `CreateProductOutputSchema`
- `UpdateProductInputSchema` / `UpdateProductOutputSchema`
- `UpdateProductStatusInputSchema` / `UpdateProductStatusOutputSchema`
- `DeleteProductInputSchema` / `DeleteProductOutputSchema`
- `ProductCommandRepository` インターフェース

`src/contracts/catalog.ts` の変更:

- `ProductRepository` から `create()`, `update()`, `delete()` を削除（読み取り専用化）
- `CreateProductInputSchema`, `UpdateProductInputSchema`, `DeleteProductInputSchema` を削除
  （これらは `products.ts` へ移動）
