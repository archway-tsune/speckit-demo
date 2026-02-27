# タスク: 商品管理機能

**Input**: `/specs/004-product-manage/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Organization**: ユーザーストーリー単位でフェーズ分割。各ストーリーは独立して実装・テスト可能。

## Format: `[ID] [P?] [Story] Description`

---

## フェーズ 1: セットアップ

**目的**: 依存関係確認

- [x] T001 `pnpm install` で依存関係を確認。`pnpm build` が通ることを確認（型エラーがあれば記録）

---

## フェーズ 2: 基盤（ブロッキング前提条件）

**目的**: CQRS 分離のための contracts・infrastructure リファクタリング。全 US の前提条件。

**⚠️ CRITICAL**: このフェーズが完了するまで US 実装を開始してはならない

- [x] T002 `src/contracts/catalog.ts` をリファクタリング（FR-001）: `ProductRepository` インターフェースから `create()` / `update()` / `delete()` を削除（読み取り専用化）。`CreateProductInputSchema` / `UpdateProductInputSchema` / `DeleteProductInputSchema` とその Output 型も削除

- [x] T003 [P] `src/contracts/products.ts` を新規作成（FR-001, FR-006〜FR-008, FR-015）: `GetAdminProductsInputSchema` / `OutputSchema`、`CreateProductInputSchema` / `OutputSchema`、`UpdateProductInputSchema` / `OutputSchema`、`UpdateProductStatusInputSchema` / `OutputSchema`、`DeleteProductInputSchema` / `OutputSchema`、`ProductCommandRepository` インターフェース（findAll・findById・count・create・update・updateStatus・delete）を定義。`ProductSchema` / `ProductStatus` は `@/contracts/catalog` から re-import

- [x] T004 `src/infrastructure/repositories/product.ts` を更新（FR-001）: `ProductCommandRepository`（`@/contracts/products` から import）を実装した `productCommandRepository` を追加エクスポート。`updateStatus(id, status)` メソッドを追加（`update()` の薄いラッパー）。既存 `productRepository` の型を read-only `ProductRepository` に変更

- [x] T005 `src/infrastructure/repositories/index.ts` に `productCommandRepository` を追加エクスポート（T004 依存）

- [x] T006 `src/domains/catalog/api/index.ts` から `createProduct` / `updateProduct` / `deleteProduct` スタブと関連 import（`CreateProductOutput` 等）を削除（T002 依存）

**チェックポイント**: `pnpm build` が catalog 関連のエラーなしで通ること（型エラーは次フェーズで解消）

---

## フェーズ 2b: スキャフォールディング

**目的**: 全 US 分のスタブを一括生成。Red テスト作成の前提条件。

- [x] T007 前準備: `src/components/index.ts`・`src/templates/index.ts`・`src/app/(samples)/sample/api/` 配下の catalog 関連サンプル Route を Read。フック（`useFetch`・`useFormSubmit`）のソースと使用例も Read。サンプルドメイン UI（`src/samples/domains/catalog/ui/`）を Read してパターンを把握

- [x] T008 [P] `src/app/api/admin/products/route.ts` を新規作成: T007 で読んだサンプルに従い `createRouteHandler()` で GET（getAdminProducts スタブ）+ POST（createProduct スタブ）を実装。両ハンドラは `NotImplementedError` を throw

- [x] T009 [P] `src/app/api/admin/products/[id]/route.ts` を新規作成: `createRouteHandler()` で GET（getAdminProductById スタブ）+ PUT（updateProduct スタブ）+ DELETE（deleteProduct スタブ）。`NotImplementedError` を throw

- [x] T010 [P] `src/app/api/admin/products/[id]/status/route.ts` を新規作成: `createRouteHandler()` で PATCH（updateProductStatus スタブ）。`NotImplementedError` を throw

- [x] T011 [P] `src/app/api/catalog/products/route.ts` から POST ハンドラを削除（CQRS 分離）。GET のみ残す。`createProduct` import も削除

- [x] T012 [P] `src/app/api/catalog/products/[id]/route.ts` から PUT・DELETE ハンドラを削除。GET のみ残す

- [x] T013 `src/domains/products/api/index.ts` + `src/domains/products/ui/index.tsx` を新規作成（T007 依存）:
  - `api/index.ts`: `ProductsContext`（session + repository: ProductCommandRepository）を定義。`getAdminProducts`・`getAdminProductById`・`createProduct`・`updateProduct`・`updateProductStatus`・`deleteProduct` を全て `throw new NotImplementedError()` で実装。先頭に `// @see barrel: [T007 で読んだ @/components の全エクスポートをそのまま列挙]` コメントを付与
  - `ui/index.tsx`: `ProductTable`・`ProductForm`（JSX 返却禁止、`throw new NotImplementedError()` のみ）。Props 型は `@/contracts/products` から導出。先頭に `// @see barrel:` コメント

- [x] T014 [P] admin products page.tsx × 3 をコンテナスタブに更新:
  - `src/app/admin/products/page.tsx`: `<div className="mx-auto max-w-7xl ..."><ProductTable ... /></div>` 形式。`useFetch`・`DataView` パターン。`ProductTable` import
  - `src/app/admin/products/new/page.tsx`: `<div ...><ProductForm ... /></div>` 形式
  - `src/app/admin/products/[id]/edit/page.tsx`: `<div ...><ProductForm ... /></div>` 形式

**チェックポイント**: `pnpm build` が通ること（NotImplementedError スタブは型エラーにならない）

---

## フェーズ 3: US1 - 商品一覧表示（優先度: P1）🎯 MVP

**ゴール**: 管理者が `/admin/products` で全商品テーブル（全ステータス）を確認できる。

**独立テスト**: 管理者でログインし `/admin/products` にアクセスすると全商品テーブルが表示される（draft 含む）。

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [x] T015 [P] [US1] `tests/unit/domains/products/us1/api.test.ts` を作成（AC-5, AC-6, FR-001〜FR-005）。テスト対象: `getAdminProducts`。admin は全ステータス取得・ページネーション・ステータスフィルタ、buyer は ForbiddenError。`pnpm test:unit:only tests/unit/domains/products/us1/ 2>&1` で FAIL 確認

- [x] T016 [P] [US1] `tests/integration/domains/products/us1/api.test.ts` を作成（FR-004, FR-005）。`GetAdminProductsOutputSchema.parse(result)` 契約検証。draft 商品が含まれることを確認。`pnpm test:integration:only tests/integration/domains/products/us1/ 2>&1` で FAIL 確認

- [x] T017 [US1] `tests/e2e/products-us1.spec.ts` を作成（AC-1, AC-2, AC-4, AC-5, AC-6）。`src/app/admin/products/page.tsx` と UI コンポーネントのソースを Read して testid を確認してから記述。`page.goto` 後に `waitForLoadState('networkidle')` → 即判定 `{ timeout: 0 }`。`pnpm test:e2e --retries 0 tests/e2e/products-us1.spec.ts 2>&1` で FAIL 確認（Bash timeout: 120000ms）

### Green

- [x] T018 [US1] `src/domains/products/api/index.ts` の `getAdminProducts` を実装（FR-001〜FR-005）: `authorize(admin)` → validate → findAll（全ステータス）→ count → pagination 計算。`pnpm test:unit:only tests/unit/domains/products/us1/ 2>&1` で PASS 確認

- [x] T019 [US1] `src/app/api/admin/products/route.ts` の GET ハンドラを実装（FR-004, FR-005）: `productCommandRepository` + `getAdminProducts` を呼ぶ。`pnpm test:integration:only tests/integration/domains/products/us1/ 2>&1` で PASS 確認

- [x] T020 [US1] `src/domains/products/ui/index.tsx` の `ProductTable` を実装（FR-004, FR-005, SC-006）: 商品名・価格・在庫数・ステータスバッジ・編集リンク・削除ボタン・ステータス select プレースホルダーを含む table。`@/components` の `StatusBadge`・`Pagination`・`Button` を使用。props: products, pagination, onEdit, onDelete, onStatusChange, onPageChange

- [x] T021 [US1] `src/app/admin/products/page.tsx` を実装（AC-1, AC-2, AC-4）: `useFetch('/api/admin/products', ...)` + `DataView` + `ProductTable`。「新規登録」ボタンを含む。`pnpm test:e2e -x tests/e2e/products-us1.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

- [x] T022 [US1] `src/app/admin/nav.ts` に `{ href: '/admin/products', label: '商品管理' }` を追加

### Refactor

- [x] T023 [US1] US1 で変更したコードをレビュー・リファクタリング。`tests/unit/app/nav-config.test.ts` に admin products エントリのアサーションを追加（`toContainEqual({ href: '/admin/products', label: '商品管理' })`）。`pnpm test:unit:only tests/unit/domains/products/us1/ && pnpm test:unit:only tests/unit/app/ 2>&1` で PASS 確認

---

## フェーズ 4: US2 - 商品新規登録（優先度: P2）

**ゴール**: 管理者が新商品を登録できる。登録後は draft ステータスで一覧に遷移。

**独立テスト**: 管理者として登録フォームに名前と価格を入力して送信すると draft 状態で商品が作成され一覧に表示される。

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [x] T024 [P] [US2] `tests/unit/domains/products/us2/api.test.ts` を作成（AC-1〜AC-6, FR-006〜FR-008）。テスト対象: `createProduct`。正常登録で status='draft'、名前空欄/201文字/価格なし/負の価格/無効URL のバリデーションエラー。`pnpm test:unit:only tests/unit/domains/products/us2/ 2>&1` で FAIL 確認

- [x] T025 [P] [US2] `tests/integration/domains/products/us2/api.test.ts` を作成（FR-008）。`ProductSchema.parse(result)`、status が 'draft' であること。`pnpm test:integration:only tests/integration/domains/products/us2/ 2>&1` で FAIL 確認

- [x] T026 [US2] `tests/e2e/products-us2.spec.ts` を作成（AC-1, AC-2, AC-7）。フォームソースを Read して input name / testid を確認してから記述。登録成功フロー + 名前空欄バリデーション + キャンセル。`pnpm test:e2e --retries 0 tests/e2e/products-us2.spec.ts 2>&1` で FAIL 確認（Bash timeout: 120000ms）

### Green

- [x] T027 [US2] `src/domains/products/api/index.ts` の `createProduct` を実装（FR-006〜FR-008）: `authorize(admin)` → validate → `repository.create({ ...data, status: 'draft', stock: data.stock ?? 0 })`。`pnpm test:unit:only tests/unit/domains/products/us2/ 2>&1` で PASS 確認

- [x] T028 [US2] `src/app/api/admin/products/route.ts` の POST ハンドラを実装（FR-008, FR-009）: 201 レスポンス。`pnpm test:integration:only tests/integration/domains/products/us2/ 2>&1` で PASS 確認

- [x] T029 [US2] `src/domains/products/ui/index.tsx` の `ProductForm` を実装（FR-006〜FR-007, FR-009, FR-016）: 商品名・価格（必須）・説明・画像URL・在庫数（任意）。`@/components` の `FormField`・`TextInput`・`TextArea`・`Button`・`useFormSubmit` を使用。props: initialValues?, onSubmit(data), onCancel, isSubmitting?

- [x] T030 [US2] `src/app/admin/products/new/page.tsx` を実装（AC-1, AC-7）: `ProductForm` を呼び出し、onSubmit で POST /api/admin/products、成功後 `/admin/products` に遷移。`pnpm test:e2e -x tests/e2e/products-us2.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

### Refactor

- [x] T031 [US2] US2 で変更したコードをレビュー・リファクタリング。`pnpm test:unit:only tests/unit/domains/products/us2/ && pnpm test:integration:only tests/integration/domains/products/us2/ 2>&1` で PASS 確認

---

## フェーズ 5: US3 - 商品編集（優先度: P3）

**ゴール**: 管理者が既存商品を編集できる。編集フォームには既存データがプリロードされ、部分更新をサポート。

**独立テスト**: 管理者として既存商品の編集ページを開き名前を変更して保存すると変更が反映される。

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [x] T032 [P] [US3] `tests/unit/domains/products/us3/api.test.ts` を作成（AC-1〜AC-5, FR-010〜FR-012）。テスト対象: `getAdminProductById`・`updateProduct`。プリロード（全フィールド返却）、部分更新（説明のみ変更で他フィールド不変）、存在しない ID で NotFoundError。`pnpm test:unit:only tests/unit/domains/products/us3/ 2>&1` で FAIL 確認

- [x] T033 [P] [US3] `tests/integration/domains/products/us3/api.test.ts` を作成（FR-010〜FR-011）。`ProductSchema.parse(result)` 契約検証、部分更新の確認。`pnpm test:integration:only tests/integration/domains/products/us3/ 2>&1` で FAIL 確認

- [x] T034 [US3] `tests/e2e/products-us3.spec.ts` を作成（AC-1, AC-2, AC-5）。編集フォームのプリロード確認 + 保存後の反映 + キャンセル。ソースを Read して testid を確認してから記述。`pnpm test:e2e --retries 0 tests/e2e/products-us3.spec.ts 2>&1` で FAIL 確認（Bash timeout: 120000ms）

### Green

- [x] T035 [US3] `src/domains/products/api/index.ts` の `getAdminProductById`・`updateProduct` を実装（FR-010〜FR-012）: `getAdminProductById`: authorize(admin) → findById → 404 on null。`updateProduct`: authorize(admin) → validate → findById → 404 on null → repository.update（指定フィールドのみ）。`pnpm test:unit:only tests/unit/domains/products/us3/ 2>&1` で PASS 確認

- [x] T036 [US3] `src/app/api/admin/products/[id]/route.ts` の GET・PUT ハンドラを実装（FR-010〜FR-012）。`pnpm test:integration:only tests/integration/domains/products/us3/ 2>&1` で PASS 確認

- [x] T037 [US3] `src/app/admin/products/[id]/edit/page.tsx` を実装（AC-1, AC-2, AC-5, FR-010, FR-016）: `useFetch('/api/admin/products/[id]', ...)` でプリロード → `ProductForm` に `initialValues` として渡す。onSubmit で PUT /api/admin/products/[id]、成功後 `/admin/products` に遷移。`pnpm test:e2e -x tests/e2e/products-us3.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

### Refactor

- [x] T038 [US3] US3 で変更したコードをレビュー・リファクタリング。`pnpm test:unit:only tests/unit/domains/products/us3/ && pnpm test:integration:only tests/integration/domains/products/us3/ 2>&1` で PASS 確認

---

## フェーズ 6: US4 - ステータス変更（優先度: P4）

**ゴール**: 管理者が商品一覧のドロップダウンからステータスを即時変更できる（全遷移許可）。

**独立テスト**: 管理者として商品一覧でドロップダウンから「公開中」を選択するとステータスが即座に更新される。

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [x] T039 [P] [US4] `tests/unit/domains/products/us4/api.test.ts` を作成（AC-1〜AC-3, FR-014〜FR-015）。テスト対象: `updateProductStatus`。admin による全ステータス遷移（draft→published、published→archived、archived→draft）、buyer は ForbiddenError。`pnpm test:unit:only tests/unit/domains/products/us4/ 2>&1` で FAIL 確認

- [x] T040 [P] [US4] `tests/integration/domains/products/us4/api.test.ts` を作成（FR-014〜FR-015）。`ProductSchema.parse(result)`、status が指定値に更新されていることを確認。`pnpm test:integration:only tests/integration/domains/products/us4/ 2>&1` で FAIL 確認

- [x] T041 [US4] `tests/e2e/products-us4.spec.ts` を作成（AC-1, AC-2）。ProductTable の status select の testid を Read して確認してから記述。select 変更後の即時更新（ページリロードなし）。`pnpm test:e2e --retries 0 tests/e2e/products-us4.spec.ts 2>&1` で FAIL 確認（Bash timeout: 120000ms）

### Green

- [x] T042 [US4] `src/domains/products/api/index.ts` の `updateProductStatus` を実装（FR-014〜FR-015）: `authorize(admin)` → validate → findById → 404 on null → `repository.updateStatus(id, status)`。ProductStatusSchema バリデーションのみ（遷移制限なし）。`pnpm test:unit:only tests/unit/domains/products/us4/ 2>&1` で PASS 確認

- [x] T043 [US4] `src/app/api/admin/products/[id]/status/route.ts` の PATCH ハンドラを実装（FR-014）。`pnpm test:integration:only tests/integration/domains/products/us4/ 2>&1` で PASS 確認

- [x] T044 [US4] `src/domains/products/ui/index.tsx` の `ProductTable` を更新（FR-014, SC-002）: 各行の status cell を `<select>` に変更。onChange で `PATCH /api/admin/products/[id]/status` を fetch し、成功後に `onStatusChange(id, newStatus)` コールバックを呼ぶ（または page.tsx の `refetch()` を呼ぶ）。`pnpm test:e2e -x tests/e2e/products-us4.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

### Refactor

- [x] T045 [US4] US4 で変更したコードをレビュー・リファクタリング。`pnpm test:unit:only tests/unit/domains/products/us4/ && pnpm test:integration:only tests/integration/domains/products/us4/ 2>&1` で PASS 確認

---

## フェーズ 7: US5 - 商品削除（優先度: P5）

**ゴール**: 管理者が確認ダイアログを経て商品を削除できる。誤削除防止。

**独立テスト**: 管理者として削除ボタンをクリックし確認ダイアログで承認すると商品が削除され一覧から消える。

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [x] T046 [P] [US5] `tests/unit/domains/products/us5/api.test.ts` を作成（AC-1〜AC-3, FR-013）。テスト対象: `deleteProduct`。admin による削除成功（{success: true}）、buyer は ForbiddenError、存在しない ID は NotFoundError。`pnpm test:unit:only tests/unit/domains/products/us5/ 2>&1` で FAIL 確認

- [x] T047 [P] [US5] `tests/integration/domains/products/us5/api.test.ts` を作成（FR-013）。`DeleteProductOutputSchema.parse(result)` 契約検証、削除後に findById が null を返すことを確認。`pnpm test:integration:only tests/integration/domains/products/us5/ 2>&1` で FAIL 確認

- [x] T048 [US5] `tests/e2e/products-us5.spec.ts` を作成（AC-1, AC-2, AC-3, FR-013）。`ConfirmDialog` のソースを Read して dialog の testid・ボタンを確認してから記述。削除ボタン → ダイアログ表示 → 確認 → 一覧から消える + キャンセルフロー。`pnpm test:e2e --retries 0 tests/e2e/products-us5.spec.ts 2>&1` で FAIL 確認（Bash timeout: 120000ms）

### Green

- [x] T049 [US5] `src/domains/products/api/index.ts` の `deleteProduct` を実装（FR-013）: `authorize(admin)` → validate → findById → 404 on null → `repository.delete(id)` → `{ success: true }`。`pnpm test:unit:only tests/unit/domains/products/us5/ 2>&1` で PASS 確認

- [x] T050 [US5] `src/app/api/admin/products/[id]/route.ts` の DELETE ハンドラを実装（FR-013）。`pnpm test:integration:only tests/integration/domains/products/us5/ 2>&1` で PASS 確認

- [x] T051 [US5] `src/domains/products/ui/index.tsx` の `ProductTable` を更新（FR-013, SC-003）: 削除ボタンクリック → `@/components` の `ConfirmDialog` を表示（useState で isOpen・targetId 管理）。確認後に `DELETE /api/admin/products/[id]` を fetch し `onDelete(id)` コールバック呼び出し。`pnpm test:e2e -x tests/e2e/products-us5.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

### Refactor

- [x] T052 [US5] US5 で変更したコードをレビュー・リファクタリング。`pnpm test:unit:only tests/unit/domains/products/us5/ && pnpm test:integration:only tests/integration/domains/products/us5/ 2>&1` で PASS 確認

---

## Final フェーズ: ポリッシュ＆クロスカッティング

**目的**: 全体品質確認・リグレッション検出

- [x] T053 TypeScript strict チェック: `pnpm exec tsc --noEmit 2>&1` でエラー 0件を確認

- [x] T054 ESLint チェック: `pnpm lint 2>&1` でエラー 0件を確認（警告は許容）

- [x] T055 単体テスト全件: `pnpm test:unit 2>&1` で全 PASS 確認（サンプルテスト除く）

- [x] T056 統合テスト全件: `pnpm test:integration 2>&1` で全 PASS 確認

- [x] T057 E2E テスト全件（リグレッション確認）: `pnpm test:e2e 2>&1` で全 PASS 確認（Bash timeout: 300000ms）。サンプルテスト（`pnpm test:e2e:samples`）は実行しない

---

## 依存関係と実行順序

### フェーズ依存関係

- **フェーズ 1 → フェーズ 2**: Setup 完了後に Foundational 開始
- **フェーズ 2 → フェーズ 2b**: CQRS 契約変更完了後にスキャフォールディング開始
- **フェーズ 2b → フェーズ 3〜7**: スキャフォールディング完了後に US 実装開始（順次）
- **フェーズ 3〜7 → Final**: 全 US 完了後にポリッシュ

### US 内タスク依存関係

- **Red**: T015/T016/T017 は並行可（T015, T016 は [P]）
- **Green**: T018 → T019 → T020 → T021 （順次）
- **Refactor**: Green 完了後

### 並行実行例（フェーズ 2b）

```bash
# T008, T009, T010, T011, T012 は並行実行可
Task: src/app/api/admin/products/route.ts スタブ
Task: src/app/api/admin/products/[id]/route.ts スタブ
Task: src/app/api/admin/products/[id]/status/route.ts スタブ
Task: catalog/products/route.ts POST 削除
Task: catalog/products/[id]/route.ts PUT+DELETE 削除
```

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. フェーズ 1〜2b 完了（基盤）
2. フェーズ 3（US1）Red → Green → Refactor
3. **STOP & VALIDATE**: `/admin/products` で商品一覧を確認

### 増分デリバリー

1. US1 → 商品一覧表示（管理者が商品を把握できる）
2. US2 → 新規登録（カタログ拡充）
3. US3 → 編集（情報修正・在庫更新）
4. US4 → ステータス変更（公開/非公開の即時切り替え）
5. US5 → 削除（不要商品の安全な削除）

---

## タスク集計

| フェーズ | タスク数 |
|---------|---------|
| フェーズ 1: Setup | 1 |
| フェーズ 2: Foundational | 5 |
| フェーズ 2b: Scaffolding | 8 |
| フェーズ 3: US1 | 9 |
| フェーズ 4: US2 | 8 |
| フェーズ 5: US3 | 7 |
| フェーズ 6: US4 | 7 |
| フェーズ 7: US5 | 7 |
| Final: Polish | 5 |
| **合計** | **57** |
