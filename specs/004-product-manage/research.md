# リサーチ: 商品管理機能

**作成日**: 2026-02-27
**対応フィーチャー**: `004-product-manage`

---

## RQ-001: CQRS 分離方式

**課題**: catalog ドメインには現在 createProduct / updateProduct / deleteProduct のスタブがある。独立した product ドメインとしてどのように分離するか。

**Decision**: **新規 `products` ドメインを作成し、catalog を完全読み取り専用に変更する。**

- `src/domains/products/` を新規作成（admin CRUD 担当）
- `src/domains/catalog/` は読み取り専用のまま維持（buyer 向けカタログ閲覧）
- `src/contracts/catalog.ts` の `ProductRepository` から write メソッド（create / update / delete）を削除
- `src/contracts/products.ts` を新規作成し `ProductCommandRepository` を定義
- catalog domain api から createProduct / updateProduct / deleteProduct スタブを削除
- `src/app/api/catalog/products/route.ts` の POST ハンドラを削除
- `src/app/api/catalog/products/[id]/route.ts` の PUT / DELETE ハンドラを削除

**根拠**: ユーザー指示「独立した product ドメインとして新規作成し、catalog ドメインと完全に分離する」に準拠。CQRS 原則により、読み取り（Query）と書き込み（Command）を明確に分離する。

**却下案**:
- catalog domain にそのまま実装 → CQRS 分離に反するため却下
- 既存 `/api/catalog/products` ルートに admin 機能を追加 → 読み取り専用ルートとの混在になるため却下

---

## RQ-002: API ルート設計

**課題**: admin CRUD の API エンドポイントをどこに配置するか。

**Decision**: **新規 `/api/admin/products/` ルート群を作成。既存 catalog ルートから write ハンドラを削除。**

新規エンドポイント:
| メソッド | パス | 用途 |
|----------|------|------|
| `GET`    | `/api/admin/products` | 管理者向け全商品一覧（全ステータス） |
| `POST`   | `/api/admin/products` | 商品新規作成 |
| `GET`    | `/api/admin/products/[id]` | 商品詳細（編集フォーム用） |
| `PUT`    | `/api/admin/products/[id]` | 商品更新（部分更新） |
| `PATCH`  | `/api/admin/products/[id]/status` | ステータス即時変更（inline） |
| `DELETE` | `/api/admin/products/[id]` | 商品削除 |

**根拠**: admin 操作と buyer 向けカタログを URL 空間レベルで分離することで CQRS の意図が明確になる。

---

## RQ-003: ProductRepository の読み取り専用化

**課題**: 既存 `catalog.ts` の `ProductRepository` インターフェースに write メソッドがある。どうリファクタリングするか。

**Decision**: **`catalog.ts` の `ProductRepository` から create / update / delete を削除し、読み取りメソッドのみに限定する。**

`ProductRepository`（読み取り専用・`catalog.ts`）に残留するメソッド:
- `findAll(params)`: 商品一覧取得
- `findById(id)`: 商品詳細取得
- `count(status?, query?)`: 件数取得

`ProductCommandRepository`（新規・`products.ts`）に定義するメソッド:
- `findAll(params)`: 管理者向け一覧（全ステータス）
- `findById(id)`: 管理者向け詳細
- `count(status?, query?)`: 件数
- `create(data)`: 商品作成
- `update(id, data)`: 商品更新（部分更新）
- `updateStatus(id, status)`: ステータス更新（inline 用）
- `delete(id)`: 商品削除

**影響範囲**:
- `src/infrastructure/repositories/product.ts`: `productCommandRepository` を追加エクスポート（同一 in-memory ストアを Command インターフェースで公開）
- `src/infrastructure/repositories/index.ts`: `productCommandRepository` を追加エクスポート
- `src/domains/catalog/api/index.ts`: write 関連 import と stub を削除
- `src/app/api/catalog/products/route.ts`: POST ハンドラを削除
- `src/app/api/catalog/products/[id]/route.ts`: PUT・DELETE ハンドラを削除

---

## RQ-004: ステータス遷移ルール

**課題**: 注文ドメインでは OrderStateMachine がある。商品ステータス変更も同様のアプローチを取るべきか。

**Decision**: **ステータス遷移は制限なし（全遷移許可）。専用 State Machine は不要。ProductStatusSchema によるバリデーションのみ実施。**

仕様確認: spec.md US4 「全ステータス間の遷移が可能」— 全 6 方向の遷移が有効:
- draft ↔ published ✅
- draft ↔ archived ✅
- published ↔ archived ✅

**根拠**: 仕様で全遷移が許可されているため State Machine は over-engineering。Zod スキーマ検証で十分。

---

## RQ-005: 削除確認ダイアログ実装

**課題**: US5 で削除前に確認ダイアログが必要。`window.confirm` は禁止（ドメイン UI 制約）。

**Decision**: **`@/components` の `ConfirmDialog` コンポーネントを使用する。**

- UI state（`isConfirmOpen`, `targetId`）は `useState` で管理
- 削除ボタンクリック → `isConfirmOpen=true` → `ConfirmDialog` 表示 → 確認 → DELETE API 呼び出し

**根拠**: 憲章 IV「ドメイン UI では `window.confirm/alert/prompt` 禁止。`@/components/feedback` の `ConfirmDialog` 等を使用」に準拠。

---

## RQ-006: 管理者向け商品一覧フィルタリング

**課題**: 管理者の一覧は全ステータス表示が基本だが、ステータスでフィルタできるか？

**Decision**: **管理者一覧はデフォルトで全ステータス表示。ステータスフィルタ（任意）もサポートする。**

`GetAdminProductsInputSchema`:
- `page`, `limit`: ページネーション
- `status`: `ProductStatusSchema.optional()` — 未指定時は全ステータス
- `q`: キーワード検索（任意）

---

## 「実装不要」確認（既存コードによる AC 充足確認）

| 機能 | 既存コード | AC 充足確認 |
|------|------------|------------|
| 商品エンティティ定義 | `src/contracts/catalog.ts` - `ProductSchema` | ✅ US2/US3 のエンティティ定義として利用可 |
| 認証・認可基盤 | `src/foundation/auth/authorize.ts` - `authorize()` | ✅ FR-001〜FR-003 の RBAC 対応済み |
| バリデーション基盤 | `src/foundation/validation/runtime.ts` - `validate()` | ✅ FR-006〜FR-007 のバリデーション機構あり |
| `ConfirmDialog` | `src/components/` - `ConfirmDialog` | ✅ FR-013 の削除確認ダイアログ要件を充足 |
| `StatusBadge` | `src/components/` - `StatusBadge` | ✅ 商品ステータス表示に流用可 |
| `Pagination` | `src/components/` - `Pagination` | ✅ FR-005 のページネーション UI 対応 |
| `productRepository` ストア | `src/infrastructure/repositories/product.ts` | ✅ 既存ストアに create/update/delete メソッドあり、productCommandRepository として再公開 |
| 管理者プレースホルダーページ | `src/app/admin/products/` (3ページ) | ✅ ルート構造は既にスキャフォールド済み |
| `createRouteHandler` | `src/templates/api/route-handler.ts` | ✅ API Route 生成パターン対応済み |
