# データモデル: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **作成日**: 2026-02-27

## エンティティ定義

### Product（商品）

カタログ上の購入可能な商品を表す。

| フィールド | 型 | バリデーション | 説明 |
|---|---|---|---|
| `id` | string (UUID) | uuid形式必須 | 一意な商品識別子 |
| `name` | string | min:1, max:200 | 商品名 |
| `price` | number (int) | min:0 | 税込価格（円） |
| `description` | string? | max:2000 | 商品説明文（任意） |
| `imageUrl` | string (URL)? | url形式 | 商品画像URL（任意） |
| `stock` | number (int) | min:0, default:0 | 在庫数【新規追加】 |
| `status` | enum | draft/published/archived | 公開ステータス |
| `createdAt` | Date | ISO日時 | 作成日時 |
| `updatedAt` | Date | ISO日時 | 更新日時 |

**ビジネスルール**:
- `status === 'published'` の商品のみ購入者に表示する
- `stock === 0` の商品は「在庫切れ」とし、カート追加ボタンを無効化する
- `imageUrl` が未設定の場合はプレースホルダー画像を表示する

---

### GetProductsInput（商品一覧取得リクエスト）

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `page` | number (int) | 1 | ページ番号（1始まり） |
| `limit` | number (int) | 20 | 1ページの件数（1-100） |
| `status` | ProductStatus? | - | ステータスフィルタ（admin用） |
| `q` | string? | - | キーワード検索（名称・説明文）【新規追加】 |

**利用時の注意**:
- 購入者（buyer）ロール: `status` は常に `'published'` に上書きされる
- カタログ一覧 UI では `limit=12` を固定で渡す

---

### GetProductsOutput（商品一覧取得レスポンス）

| フィールド | 型 | 説明 |
|---|---|---|
| `products` | Product[] | 商品配列 |
| `pagination.page` | number | 現在ページ |
| `pagination.limit` | number | 1ページの件数 |
| `pagination.total` | number | 総件数 |
| `pagination.totalPages` | number | 総ページ数 |

---

### テストデータ設計（src/infrastructure/repositories/product.ts）

| # | name | price | stock | imageUrl | status |
|---|---|---|---|---|---|
| 1 | E2Eテスト商品 | 3,000 | 10 | picsum/seed/e2e/400/400 | published |
| 2 | ミニマルTシャツ | 4,980 | 50 | picsum/seed/tshirt/400/400 | published |
| 3 | レザーウォレット | 12,800 | 3 | picsum/seed/wallet/400/400 | published |
| 4 | キャンバストートバッグ | 6,800 | 15 | picsum/seed/bag/400/400 | published |
| 5 | ウールニット | 15,800 | 8 | picsum/seed/knit/400/400 | published |
| 6 | デニムパンツ | 9,800 | 0 | picsum/seed/denim/400/400 | published |
| 7 | レザースニーカー | 18,000 | 5 | picsum/seed/sneakers/400/400 | published |
| 8 | コットンシャツ | 7,500 | 20 | picsum/seed/shirt/400/400 | published |
| 9 | ウールコート | 45,000 | 2 | picsum/seed/coat/400/400 | published |
| 10 | シルクスカーフ | 8,800 | 12 | picsum/seed/scarf/400/400 | published |
| 11 | レザーベルト | 5,500 | 30 | picsum/seed/belt/400/400 | published |
| 12 | キャップ | 4,200 | 0 | picsum/seed/cap/400/400 | published |
| 13 | サングラス | 22,000 | 7 | picsum/seed/sunglasses/400/400 | published |
| 14 | 腕時計 | 68,000 | 1 | - (imageUrl なし) | published |
| 15 | リネンパンツ | 11,800 | 25 | picsum/seed/linen/400/400 | published |
| - | (非公開ドラフト) | - | - | - | draft |

**ページネーション確認**: 15件の published 商品 → page1=12件、page2=3件

**エッジケーステスト対象**:
- No.6 デニムパンツ（stock=0）: 「在庫切れ」バッジ + カートボタン無効
- No.12 キャップ（stock=0）: 同上（2件目の在庫切れ）
- No.14 腕時計（imageUrl なし）: プレースホルダー画像表示

---

## 変更が必要なスキーマ

### src/contracts/catalog.ts（変更箇所のみ）

```typescript
// ProductSchema に stock フィールドを追加
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),   // ← 新規追加
  status: ProductStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// GetProductsInputSchema に q フィールドを追加
export const GetProductsInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
  q: z.string().optional(),   // ← 新規追加
});

// ProductRepository.findAll の params に query を追加
findAll(params: {
  status?: Product['status'];
  offset: number;
  limit: number;
  query?: string;   // ← 新規追加
}): Promise<Product[]>;
```
