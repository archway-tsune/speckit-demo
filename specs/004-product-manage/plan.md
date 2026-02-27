# 実装計画: 商品管理機能

**Branch**: `004-product-manage` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-product-manage/spec.md`

---

## サマリー

管理者が商品を CRUD 管理できる機能を実装する。既存の `catalog` ドメインを buyer 向けの読み取り専用（Query）に限定し、新規 `products` ドメインを admin 向け書き込み（Command）専用として新設する（CQRS 分離）。admin API は `/api/admin/products/` ルート群に配置し、catalog API ルートから write ハンドラを削除する。

---

## 技術コンテキスト

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 14 (App Router), React 18, Zod（バリデーション）, Tailwind CSS 3
**Storage**: In-memory Map（既存 `createStore()` パターン）
**Testing**: Vitest（`pnpm test:unit` / `pnpm test:integration`）, Playwright（`pnpm test:e2e`）
**Target Platform**: Web Application（Next.js）
**Performance Goals**: 商品一覧ページ初回ロード 1秒以内（SC-006）、ステータス変更即時反映（SC-002）
**Constraints**: TypeScript strict モード + ESLint エラー 0件
**Scale/Scope**: 16商品シードデータ（テスト環境）、20件/ページネーション

---

## 憲章チェック

*GATE: Phase 0 リサーチ前に必須。Phase 1 設計後に再確認。*

| 原則 | 確認 | 備考 |
|------|------|------|
| I. 共有基盤の利用 | ✅ | `@/components` の `ConfirmDialog`, `StatusBadge`, `Pagination` 等を使用。`createRouteHandler()` で API ルート生成 |
| II. ドメイン分離 | ✅ | catalog（Query）と products（Command）を完全分離。ドメイン間の直接 import なし |
| III. TDD 必須 | ✅ | 全 US で Red → Green → Refactor を実施 |
| IV. 実装ガードレール | ✅ | 保護対象（Foundation, Templates, Components, Samples）への変更なし。Contracts, Domains, Infrastructure, App ルートのみ変更 |

**Phase 1 設計後再確認**:

| 確認事項 | 結果 |
|----------|------|
| catalog.ts 変更は Products 仕様の範囲内か | ✅ catalog write メソッド削除は products ドメイン分離のための必要変更 |
| `window.confirm` を使っていないか | ✅ `ConfirmDialog` コンポーネントを使用 |
| ドメイン UI に `useRouter`/`next/link` がないか | ✅ コールバック props 注入パターンを使用 |

---

## プロジェクト構造

### ドキュメント（このフィーチャー）

```text
specs/004-product-manage/
├── plan.md              # このファイル
├── research.md          # Phase 0 出力（CQRS 設計決定）
├── data-model.md        # Phase 1 出力（Product エンティティ）
├── quickstart.md        # Phase 1 出力（テストシナリオ）
├── contracts/
│   └── api.md           # Phase 1 出力（API 仕様）
└── tasks.md             # Phase 2 出力（/speckit.tasks コマンド）
```

### ソースコード（変更・新規作成ファイル）

```text
src/
├── contracts/
│   ├── catalog.ts              # [REFACTOR] ProductRepository → read-only
│   │                           #   - ProductRepository から create/update/delete を削除
│   │                           #   - CreateProductInputSchema 等の write スキーマを削除
│   └── products.ts             # [NEW] admin CRUD 契約
│                               #   - GetAdminProductsInputSchema / OutputSchema
│                               #   - CreateProductInputSchema / OutputSchema
│                               #   - UpdateProductInputSchema / OutputSchema
│                               #   - UpdateProductStatusInputSchema / OutputSchema
│                               #   - DeleteProductInputSchema / OutputSchema
│                               #   - ProductCommandRepository インターフェース
│
├── domains/
│   ├── catalog/
│   │   └── api/
│   │       └── index.ts        # [MODIFY] createProduct/updateProduct/deleteProduct スタブを削除
│   └── products/               # [NEW] admin CRUD ドメイン
│       ├── api/
│       │   └── index.ts        # getAdminProducts, getAdminProductById,
│       │                       # createProduct, updateProduct,
│       │                       # updateProductStatus, deleteProduct
│       └── ui/
│           └── index.tsx       # ProductTable, ProductForm, ProductStatusSelect
│                               # (ConfirmDialog, StatusBadge, Pagination 等を @/components から import)
│
├── infrastructure/
│   └── repositories/
│       ├── product.ts          # [MODIFY] productCommandRepository を追加エクスポート
│       │                       #   - ProductCommandRepository インターフェース実装
│       │                       #   - updateStatus() メソッドを追加
│       │                       #   - 既存 productRepository の型を ProductRepository（read-only）に変更
│       └── index.ts            # [MODIFY] productCommandRepository を追加エクスポート
│
└── app/
    ├── api/
    │   ├── catalog/
    │   │   └── products/
    │   │       ├── route.ts     # [MODIFY] POST ハンドラを削除
    │   │       └── [id]/
    │   │           └── route.ts # [MODIFY] PUT・DELETE ハンドラを削除
    │   └── admin/
    │       └── products/        # [NEW] admin 専用 API ルート群
    │           ├── route.ts     # GET（一覧）+ POST（作成）
    │           └── [id]/
    │               ├── route.ts          # GET（詳細）+ PUT（更新）+ DELETE（削除）
    │               └── status/
    │                   └── route.ts      # PATCH（ステータス変更）
    │
    └── admin/
        ├── nav.ts               # [MODIFY] { href: '/admin/products', label: '商品管理' } を追加
        └── products/
            ├── page.tsx         # [IMPLEMENT] 商品一覧（inline ステータス変更・削除確認）
            ├── new/
            │   └── page.tsx     # [IMPLEMENT] 商品新規登録フォーム
            └── [id]/
                └── edit/
                    └── page.tsx # [IMPLEMENT] 商品編集フォーム（全フィールドプリロード）

tests/
├── unit/
│   └── domains/
│       └── products/            # [NEW] US 別単体テスト
│           ├── us1/             # getAdminProducts（認可・ページネーション・フィルタ）
│           ├── us2/             # createProduct（バリデーション・draft デフォルト）
│           ├── us3/             # updateProduct（部分更新・404）
│           ├── us4/             # updateProductStatus（ステータス変更）
│           └── us5/             # deleteProduct（削除）
├── integration/
│   └── domains/
│       └── products/            # [NEW] US 別統合テスト
│           ├── us1/             # API 契約検証
│           ├── us2/
│           ├── us3/
│           ├── us4/
│           └── us5/
└── e2e/
    ├── products-us1.spec.ts     # [NEW] 一覧・認可・ページネーション
    ├── products-us2.spec.ts     # [NEW] 新規登録フォーム
    ├── products-us3.spec.ts     # [NEW] 編集フォーム・プリロード
    ├── products-us4.spec.ts     # [NEW] inline ステータス変更
    └── products-us5.spec.ts     # [NEW] 削除確認ダイアログ
```

**構造決定**: Next.js App Router のドメイン分離パターンを採用。catalog = Query、products = Command の CQRS 構成。既存の orders ドメインパターン（api/index.ts + ui/index.tsx）に準拠。

---

## 依存関係グラフ

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            ├── catalog.ts 読み取り専用化
            ├── products.ts 新規契約
            └── infrastructure 更新
                    └── Phase 2b (Scaffolding)
                            ├── domains/products/api スタブ
                            ├── domains/products/ui スタブ
                            ├── API routes (admin/products) スタブ
                            └── catalog route write ハンドラ削除
                                    ├── US1: 商品一覧 (P1)
                                    ├── US2: 商品新規登録 (P2)
                                    ├── US3: 商品編集 (P3)
                                    ├── US4: ステータス変更 (P4)
                                    └── US5: 商品削除 (P5)
                                            └── Final Phase: 全件 E2E + polish
```

---

## 複雑性トラッキング

憲章違反なし。複雑性トラッキング不要。

---

## 設計メモ

### ドメイン UI 制約の遵守

- `window.confirm/alert/prompt` 禁止 → `ConfirmDialog`（`@/components`）を使用
- `useRouter`/`next/link` 禁止 → `onNavigate`, `onEdit`, `onDelete` 等のコールバック props で注入
- `useFetch` は page.tsx のみ（UI コンポーネント内禁止）

### page.tsx パターン（スキャフォールディング基準）

```tsx
// products/page.tsx スケルトン例
export default function AdminProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DataView
        useFetch={useFetch}
        loadingMessage="商品を読み込み中..."
        emptyMessage="商品がありません"
        emptyCheck={(data) => data.products.length === 0}
        apiPath="/api/admin/products"
      >
        {(data, refetch) => (
          <ProductTable
            products={data.products}
            pagination={data.pagination}
            onStatusChange={...}
            onDelete={...}
            onEdit={...}
            onPageChange={...}
          />
        )}
      </DataView>
    </div>
  );
}
```

### updateStatus メソッドの追加

`productCommandRepository` に `updateStatus(id, status)` を追加:
```ts
async updateStatus(id: string, status: ProductStatus): Promise<Product> {
  return this.update(id, { status });
}
```
（`update()` を内部で呼び出す薄いラッパー）
