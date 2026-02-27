# データモデル: 商品管理機能

**作成日**: 2026-02-27
**対応フィーチャー**: `004-product-manage`

---

## エンティティ

### Product（商品）

既存の `ProductSchema`（`src/contracts/catalog.ts`）を共有エンティティとして使用。新規エンティティ定義は不要。

| フィールド | 型 | 制約 | 備考 |
|-----------|-----|------|------|
| `id` | `string` (UUID) | 必須・一意 | 自動生成 |
| `name` | `string` | 必須・1〜200文字 | FR-006 |
| `price` | `number` (integer) | 必須・0以上 | FR-006 |
| `description` | `string \| undefined` | 任意・最大2000文字 | FR-007 |
| `imageUrl` | `string \| undefined` | 任意・有効なURL形式 | FR-007 |
| `stock` | `number` (integer) | 任意・0以上・デフォルト0 | FR-007 |
| `status` | `'draft' \| 'published' \| 'archived'` | 必須 | FR-015 |
| `createdAt` | `Date` | 必須 | 自動設定 |
| `updatedAt` | `Date` | 必須 | 更新時自動設定 |

---

## ステータス遷移

全ステータス間の遷移が許可される（制限なし）。

```
  ┌──────────────────────────────────────────┐
  │                                          │
  ▼           ▲                             │
draft ──────► published ──────► archived    │
  ▲           │                    │        │
  │           ▼                    ▼        │
  └─────────────────────────────────────────┘
```

- **draft（下書き）**: 新規作成時の初期ステータス（FR-008）
- **published（公開中）**: 購入者のカタログに表示される
- **archived（アーカイブ）**: 非公開・閲覧不可

---

## バリデーションルール

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| `name` | 必須、1〜200文字 | 「商品名を入力してください」/ 「商品名は200文字以内で入力してください」 |
| `price` | 必須、0以上の整数 | 「価格は0以上で入力してください」 |
| `description` | 任意、最大2000文字 | 「商品説明は2000文字以内で入力してください」 |
| `imageUrl` | 任意、有効なURL形式 | 「有効なURLを入力してください」 |
| `stock` | 任意、0以上の整数、デフォルト0 | 「在庫数は0以上で入力してください」 |
| `status` | `draft \| published \| archived` | — |

---

## リポジトリインターフェース

### ProductRepository（読み取り専用 / `catalog.ts`）

Catalog ドメイン（buyer 向け）専用。write メソッドを持たない。

```typescript
interface ProductRepository {
  findAll(params: {
    status?: ProductStatus;
    offset: number;
    limit: number;
    query?: string;
  }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  count(status?: ProductStatus, query?: string): Promise<number>;
}
```

### ProductCommandRepository（読み書き / `products.ts`）

Products ドメイン（admin 向け）専用。CRUD + 読み取りを提供。

```typescript
interface ProductCommandRepository {
  findAll(params: {
    status?: ProductStatus;
    offset: number;
    limit: number;
    query?: string;
  }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  count(status?: ProductStatus, query?: string): Promise<number>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  updateStatus(id: string, status: ProductStatus): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

---

## インフラストラクチャ

| リポジトリ変数 | ファイル | インターフェース |
|----------------|----------|-----------------|
| `productRepository` | `src/infrastructure/repositories/product.ts` | `ProductRepository`（read-only） |
| `productCommandRepository` | `src/infrastructure/repositories/product.ts` | `ProductCommandRepository`（CRUD） |

同一の in-memory `Map<string, Product>` を共有ストアとして使用し、2 つの異なるインターフェース視点で公開する。
