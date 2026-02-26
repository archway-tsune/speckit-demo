# リサーチ: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **作成日**: 2026-02-27

## フェーズ0 調査結果

---

### D1: Product エンティティへの stock フィールド追加

**判定**: 実装必要

**調査**: 既存の `src/contracts/catalog.ts` の `ProductSchema` を読んだ結果、`stock`（在庫数）フィールドが存在しない。仕様 FR-004（在庫切れ表示）・FR-007（在庫数表示）・FR-008（カート追加ボタン無効化）を満たすには `stock` フィールドが必須。

**決定**: `src/contracts/catalog.ts` の `ProductSchema` に `stock: z.number().int().min(0).default(0)` を追加する。`ProductRepository.findAll` のパラメータ型は変更不要（stock はフィルタではなく表示用）。

**却下案**:
- `status: 'out_of_stock'` で在庫切れを表現 → statusはdraft/published/archivedの公開状態を管理するもので在庫とは別の概念。混在は不可。
- クライアント側でフィルタリング → stock はサーバー側データとして持つべき

---

### D2: 商品検索パラメータ（US3）

**判定**: 実装必要

**調査**: 既存 `GetProductsInputSchema` に `q`（キーワード）パラメータなし。`ProductRepository.findAll` も `query` を受け付けない。APIルート `route.ts` も `q` を searchParams から読まない。

**決定**:
1. `GetProductsInputSchema` に `q: z.string().optional()` を追加
2. `ProductRepository` の `findAll` params に `query?: string` を追加
3. `productRepository.findAll` 実装で name/description の部分一致フィルタを追加
4. `src/app/api/catalog/products/route.ts` で `q = searchParams.get('q') || undefined` を追加

**却下案**:
- クライアント側 JS フィルタリング → APIがデータを全件返す必要があり非効率。ページネーションと相性が悪い。
- 外部検索エンジン（Elasticsearch等） → インメモリデモ用途に過剰

---

### D3: ページネーション方式（12件/ページ）

**判定**: 既存基盤で対応済み（UIパラメータで制御）

**調査**: 既存の `GetProductsInputSchema` は `limit` を受け付け（min:1, max:100, default:20）。`Pagination` コンポーネントも既存。APIルートは `limit` パラメータを通す。

**決定**: UIで `limit=12` を固定パラメータとして `useFetch` に渡す。コントラクト変更不要。

**却下案**:
- デフォルト limit を 12 に変更 → 管理画面など他ユーザーへの影響リスクあり。UIで制御が適切。

---

### D4: テストデータ（Lorem Picsum + ページネーション確認）

**判定**: 実装必要

**調査**: 既存 PRODUCTS 配列には5件（published:4, draft:1）。ページネーション（12件/ページ）を確認するには13件以上の published 商品が必要。ユーザー入力で Lorem Picsum URL（`https://picsum.photos/seed/{seed}/400/400`）使用指定あり。

**決定**: `src/infrastructure/repositories/product.ts` の PRODUCTS 配列を15件の published 商品に拡充する。内訳：
- 13件: 在庫あり（stock > 0）、Lorem Picsum 画像
- 1件: 在庫切れ（stock = 0）
- 1件: imageUrl なし（プレースホルダーテスト用）
- UUIDはシーケンシャルに付与（550e8400-e29b-41d4-a716-44665544000X）

**却下案**:
- 既存5件のまま → ページネーションテスト不可。US1の AC-2,3 を充足できない。

---

### D5: 「在庫切れ」バッジ表示（ProductCard の制約）

**判定**: ドメイン UI でラップ実装

**調査**: `src/components/product/ProductCard.tsx`（保護対象）は stock/在庫状況プロパティを持たない。コンポーネントは修正不可（憲章 IV: 保護対象への改変禁止）。

**決定**: `src/domains/catalog/ui/index.tsx` の `ProductList` 実装内でラッパーを使用し、`ProductCard` の上に在庫状況バッジをオーバーレイ表示する。具体的には各カードを `<div className="relative">` でラップし、stock=0 の場合に `在庫切れ` バッジを絶対配置で表示する。

**却下案**:
- `ProductCard` に stock プロップを追加 → コンポーネント改変禁止
- ドメイン UI 独自のカードコンポーネントを 1 から作成 → `ProductCard` を再利用しないのは「共有基盤の利用」原則違反

---

### D6: 検索クエリの状態管理方式

**判定**: URL クエリパラメータ経由（useFetch の params）

**調査**: 既存 `useFetch` フックは params オブジェクトを受け取り、変更時に自動 refetch する。

**決定**: `ProductList` コンポーネントが `useState` で検索キーワードを管理し、`useFetch` の params に `q` を渡す。SearchBar の `onSearch` コールバックで state を更新 → useFetch が自動的に再フェッチ。

**却下案**:
- Next.js の useSearchParams + URL 書き換え → SSR との境界が複雑になる。インメモリストアのデモ用途で過剰。

---

### D7: nav.ts へのカタログリンク追加

**判定**: 実装必要（US1完了後に追加）

**調査**: `src/app/(buyer)/nav.ts` は現在空配列。middleware の PUBLIC_PATHS に `/catalog` は既に含まれている（認証不要アクセス確認済み）。

**決定**: US1完了（ProductList実装後）に `buyerNavLinks` に `{ href: '/catalog', label: '商品一覧' }` を追加する。

---

### D8: ProductDetail の在庫数表示とカート追加ボタン無効化

**判定**: ドメイン UI で実装

**調査**: 既存サンプル `ProductDetail.tsx` は `stock` を表示しない（フィールド追加前）。カート追加ボタン無効化ロジックも未実装。

**決定**: `src/domains/catalog/ui/index.tsx` の `ProductDetail` 実装で：
- `product.stock` を「在庫数: {n}件」として表示
- `stock === 0` の場合は Button を `disabled` で表示、「在庫切れ」ラベルに変更
- カート追加コールバックは stock > 0 の場合のみ有効化（次ドメイン実装まではスタブで onClick なし）

---

## 解決確認チェック

| NEEDS CLARIFICATION | 解決手段 | 状態 |
|---|---|---|
| stock フィールド未定義 | contracts/catalog.ts に追加 | ✅ |
| 検索パラメータ未定義 | q フィールドを追加 | ✅ |
| テストデータ不足 | 15件に拡充（Lorem Picsum） | ✅ |
| 在庫切れバッジ表示 | ドメイン UI でラップ | ✅ |
| ページネーション件数 | UI で limit=12 を固定 | ✅ |
