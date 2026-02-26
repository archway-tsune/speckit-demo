# API コントラクト: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **作成日**: 2026-02-27

> すべてのエンドポイントは既存ルートを使用する。新規ルート作成なし。

---

## GET /api/catalog/products

**認証**: 不要（公開エンドポイント）
**対応FR**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-011, FR-012, FR-013

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `page` | integer | No | 1 | ページ番号（1始まり） |
| `limit` | integer | No | 20 | 1ページ件数（最大100）。カタログ UI は 12 を指定 |
| `q` | string | No | - | キーワード検索（商品名・説明文の部分一致）【US3】 |

> 注: `status` パラメータは購入者アクセス時に `published` に強制上書きされる（認証不要 = guest = buyer 扱い）。

### レスポンス 200 OK

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "ミニマルTシャツ",
        "price": 4980,
        "description": "シンプルで上質なコットン100%のTシャツ。",
        "imageUrl": "https://picsum.photos/seed/tshirt/400/400",
        "stock": 50,
        "status": "published",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### レスポンス 0件

```json
{
  "success": true,
  "data": {
    "products": [],
    "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 }
  }
}
```

---

## GET /api/catalog/products/[id]

**認証**: 不要（公開エンドポイント）
**対応FR**: FR-006, FR-007, FR-008, FR-009, FR-010

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | UUID | Yes | 商品ID |

### レスポンス 200 OK

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "ミニマルTシャツ",
    "price": 4980,
    "description": "シンプルで上質なコットン100%のTシャツ。",
    "imageUrl": "https://picsum.photos/seed/tshirt/400/400",
    "stock": 50,
    "status": "published",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### レスポンス 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "商品が見つかりません"
  }
}
```

---

## 共通エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL_ERROR",
    "message": "エラーメッセージ",
    "fieldErrors": {}
  }
}
```

---

## ユーザーストーリーとエンドポイントのマッピング

| ユーザーストーリー | エンドポイント | パラメータ |
|---|---|---|
| US1: 商品一覧表示 | GET /api/catalog/products | page, limit=12 |
| US2: 商品詳細表示 | GET /api/catalog/products/[id] | - |
| US3: 商品検索 | GET /api/catalog/products | page, limit=12, q={keyword} |
