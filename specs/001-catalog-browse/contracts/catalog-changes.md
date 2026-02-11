# コントラクト変更仕様: カタログ閲覧機能

**対象ファイル**: `src/contracts/catalog.ts`
**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-11

## 変更 1: ProductSchema に stock フィールド追加

**変更前**:
```typescript
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  status: ProductStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
```

**変更後**:
```typescript
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  status: ProductStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
```

**サンプルコード保護**: `.default(0)` により既存データに `stock` がなくても
自動的に 0 が補完される。既存のサンプルテスト・BASE_PRODUCTS への影響なし。

---

## 変更 2: GetProductsInputSchema に keyword フィールド追加

**変更前**:
```typescript
export const GetProductsInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
});
```

**変更後**:
```typescript
export const GetProductsInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
  keyword: z.string().optional(),
});
```

**サンプルコード保護**: `.optional()` により既存の呼び出しに影響なし。

---

## 変更 3: ProductRepository.findAll に keyword パラメータ追加

**変更前**:
```typescript
export interface ProductRepository {
  findAll(params: {
    status?: Product['status'];
    offset: number;
    limit: number;
  }): Promise<Product[]>;
  // ...
  count(status?: Product['status']): Promise<number>;
}
```

**変更後**:
```typescript
export interface ProductRepository {
  findAll(params: {
    status?: Product['status'];
    offset: number;
    limit: number;
    keyword?: string;
  }): Promise<Product[]>;
  // ...
  count(status?: Product['status'], keyword?: string): Promise<number>;
}
```

**サンプルコード保護**: `keyword` はオプショナルのため既存実装への影響なし。

---

## 変更 4: API Route に keyword パラメータの受け渡し追加

**対象ファイル**: `src/app/api/catalog/products/route.ts`

GET ハンドラの `searchParams` から `keyword` を取得し、ユースケースに渡す。

**変更箇所**:
```typescript
const input = {
  page: searchParams.get('page') || '1',
  limit: searchParams.get('limit') || '20',
  status: session ? (searchParams.get('status') || undefined) : 'published',
  keyword: searchParams.get('keyword') || undefined,  // ← 追加
};
```
