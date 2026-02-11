# データモデル: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-11

## エンティティ

### 商品（Product）

既存の `src/contracts/catalog.ts` の `ProductSchema` を拡張する。

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string (UUID) | ✅ | 商品ID |
| name | string (1-200文字) | ✅ | 商品名 |
| price | number (整数, ≥0) | ✅ | 価格（円） |
| description | string (≤2000文字) | ❌ | 商品説明 |
| imageUrl | string (URL) | ❌ | 商品画像URL（未設定時はプレースホルダー表示） |
| stock | number (整数, ≥0) | ❌ | 在庫数（デフォルト: 0）**← 新規追加** |
| status | enum: draft/published/archived | ✅ | 公開ステータス |
| createdAt | Date | ✅ | 作成日時 |
| updatedAt | Date | ✅ | 更新日時 |

**変更点**: `stock` フィールドを追加。`.default(0)` を付与しサンプルコード互換性を維持。

### 商品一覧レスポンス（GetProductsOutput）

既存の `GetProductsOutputSchema` をそのまま使用（変更なし）。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| products | Product[] | 商品リスト |
| pagination.page | number | 現在のページ番号 |
| pagination.limit | number | 1ページあたりの件数 |
| pagination.total | number | 総商品数 |
| pagination.totalPages | number | 総ページ数 |

### 商品一覧入力（GetProductsInput）

既存の `GetProductsInputSchema` を拡張する。

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| page | number (≥1) | ❌ | ページ番号（デフォルト: 1） |
| limit | number (1-100) | ❌ | 件数（デフォルト: 20）※本番UIは12で呼び出す |
| status | ProductStatus | ❌ | ステータスフィルタ |
| keyword | string | ❌ | 検索キーワード **← 新規追加** |

**変更点**: `keyword` フィールドを追加。`.optional()` でサンプルコード互換性を維持。

## リポジトリインターフェース変更

### ProductRepository.findAll

```
findAll(params: {
  status?: Product['status'];
  offset: number;
  limit: number;
  keyword?: string;    // ← 新規追加（オプショナル）
}): Promise<Product[]>
```

**検索ロジック**: `keyword` が指定された場合、`name` と `description` を
部分一致検索（大文字小文字無視）でフィルタリングする。

### ProductRepository.count

```
count(status?: Product['status'], keyword?: string): Promise<number>
```

**変更点**: `keyword` パラメータを追加（オプショナル）。
検索時の総件数をページネーションに反映するため。

## シードデータ設計

### BASE_PRODUCTS（不変 — 6件）

既存の6件をそのまま維持。`stock` フィールドは `.default(0)` により
自動的に 0 が設定されるが、明示的に設定しておくことが望ましい。
ただしベースデータは不変のため、`stock` は Zod の `.default(0)` で補完する。

### EXTENSION_PRODUCTS（新規追加 — 20件）

ページネーションテスト（12件/ページ × 3ページ以上）を満たすために
published 商品を20件以上追加する。BASE_PRODUCTS の published 5件と合わせて
合計25件以上の published 商品を確保する。

**バリエーション**:
- 在庫あり商品: 17件（stock: 5〜100）
- 在庫切れ商品: 2件（stock: 0）— 在庫切れ表示テスト用
- 画像未設定商品: 1件（imageUrl: undefined）— プレースホルダーテスト用

**画像**: Unsplash の URL を使用（実装時に HTTP リクエストで存在確認予定）
