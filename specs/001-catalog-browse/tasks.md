---
description: "カタログ閲覧機能 タスクリスト"
---

# タスク: カタログ閲覧機能

**入力**: specs/001-catalog-browse/（plan.md, spec.md, data-model.md, contracts/, research.md）
**前提**: plan.md（必須）、spec.md（ユーザーストーリー）、data-model.md、contracts/

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル・依存関係なし）
- **[Story]**: 対象ユーザーストーリー（例: US1, US2, US3）
- 説明には正確なファイルパスを含める

## パス規約

- ドメイン: `src/domains/catalog/`
- コントラクト: `src/contracts/catalog.ts`
- インフラ: `src/infrastructure/repositories/product.ts`
- テスト（単体）: `tests/unit/domains/catalog/us<N>/`
- テスト（統合）: `tests/integration/domains/catalog/us<N>/`
- テスト（E2E）: `tests/e2e/catalog-us<N>.spec.ts`

---

## フェーズ 1: セットアップ

**目的**: 依存関係の確認

- [x] T001 依存関係確認: `pnpm install` を実行して node_modules が最新状態であることを確認

---

## フェーズ 2: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーが依存するスキーマ変更とテストデータ整備

⚠️ **CRITICAL**: このフェーズが完了するまでユーザーストーリーの実装を開始しない

- [x] T002 [P] src/contracts/catalog.ts を変更: `ProductSchema` に `stock: z.number().int().min(0).default(0)` を追加、`ProductRepository.findAll` の params に `query?: string` を追加（※ q の InputSchema 追加は US3 Green で行う）
- [x] T003 [P] src/infrastructure/repositories/product.ts の `PRODUCTS` 配列を 15件の published 商品に拡充: Lorem Picsum 画像（`https://picsum.photos/seed/{seed}/400/400`）、stock フィールド付き、在庫切れ2件（stock=0）・imageUrl なし1件を含む（data-model.md 参照）

**チェックポイント**: コントラクトとテストデータ準備完了

---

## フェーズ 2b: スキャフォールディング（Red テスト作成の前提）

**目的**: 全ストーリー分のスタブを一括生成しテスト基盤を確立

- [x] T004 前準備: `src/components/index.ts`, `src/templates/index.ts`, `src/app/(samples)/sample/api/catalog/products/route.ts`, `src/app/(samples)/sample/api/catalog/products/[id]/route.ts`, `src/components/hooks/useFetch.ts`, `src/samples/domains/catalog/ui/ProductList.tsx`, `src/samples/domains/catalog/ui/ProductDetail.tsx` を Read してバレル・フック API・サンプルパターンを把握する

- [x] T005 src/app/api/catalog/products/route.ts を `createRouteHandler` パターンに書き換え: サンプル route（T004 で読み込み済み）を参照し、手書き try-catch を削除。GET は `requireAuth: false` で公開、POST は認証必須

- [x] T006 src/app/api/catalog/products/[id]/route.ts を `createRouteHandler` パターンに書き換え: GET は `requireAuth: false`、PUT/DELETE は認証必須

- [x] T007 src/domains/catalog/api/index.ts と src/domains/catalog/ui/index.tsx のスタブを更新: T002 で追加した `stock` フィールドを含む型で型チェックが通る状態に調整。api/index.ts の先頭に以下を付与:
  ```
  // @see barrel: ProductCard, ImagePlaceholder, SearchBar, Pagination, BackButton,
  //              useFetch, useFormSubmit, formatPrice, Loading, Empty, Button
  ```
  ui/index.tsx の関数本体はスタブのまま（JSX 返却禁止、`throw new NotImplementedError('catalog', '<funcName>')` のみ）

- [x] T008 src/app/(buyer)/catalog/page.tsx と src/app/(buyer)/catalog/[id]/page.tsx を Read して既存のコンテナラッパー構造を確認。変更不要な場合はスキップ

**チェックポイント**: `pnpm typecheck` がエラーなしで通ること

---

## フェーズ 3: ユーザーストーリー 1 - 商品一覧を閲覧する（優先度: P1）🎯 MVP

**目標**: 購入者が認証なしで商品を12件/ページで閲覧でき、ページネーション・在庫切れ表示・空表示が機能する
**独立テスト**: `http://localhost:3000/catalog` にアクセスし、カード表示・ページネーション・在庫切れバッジ・空表示を確認

### Red

⚠️ 禁止: 引数なし `toThrow()`、条件付きアサーション(`if→expect`)、`it.todo`/`skip`、テスト名「未実装」

- [x] T009 [P] [US1] `tests/unit/domains/catalog/us1/usecase.test.ts` を作成 (AC-1,2,3,4,5, FR-001,003,004,005)。テスト対象: `getProducts`（published のみ返す、ページネーション計算、stock=0 商品を含む）。`pnpm test:unit:only tests/unit/domains/catalog/us1/ 2>&1` で全テスト FAIL 確認

- [x] T010 [P] [US1] `tests/unit/domains/catalog/us1/ui.test.tsx` を作成 (AC-1,2,3,4,5, FR-002,003,004,005)。テスト対象: `ProductList`（12件表示、ページネーション表示/非表示、在庫切れバッジ、空表示「商品がありません」）。`pnpm test:unit:only tests/unit/domains/catalog/us1/ 2>&1` で FAIL 確認

- [x] T011 [P] [US1] `tests/integration/domains/catalog/us1/api.test.ts` を作成 (AC-1,2)。テスト対象: `getProducts` ← 入出力スキーマ整合、buyer ロールで published のみ取得。`pnpm test:integration:only tests/integration/domains/catalog/us1/ 2>&1` で FAIL 確認

- [x] T012 [US1] `tests/e2e/catalog-us1.spec.ts` を作成 (AC-1〜5)。URL: `/catalog`。シナリオ: 認証なしアクセス可、カード表示、ページネーション「次へ」で2ページ目、在庫切れバッジ確認、空表示（`/api/test/reset` でデータクリア後）。`pnpm test:e2e --retries 0 tests/e2e/catalog-us1.spec.ts 2>&1` で FAIL 確認

### Green

テストコード変更禁止。実装コードのみで全テストを PASS させる。

- [x] T013 [US1] `src/domains/catalog/api/index.ts` の `getProducts` を実装: `validate(GetProductsInputSchema, rawInput)` → buyer は status='published' 強制 → `Promise.all([repo.findAll, repo.count])` → pagination 計算して返す。サンプル: `src/samples/domains/catalog/api/index.ts`。`pnpm test:unit:only tests/unit/domains/catalog/us1/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us1/ 2>&1` で PASS 確認

- [x] T014 [US1] `src/domains/catalog/ui/index.tsx` の `ProductList` を実装: `useFetch('/api/catalog/products', { page, limit: '12' })` でデータ取得 → `ProductCard` を `<div className="relative">` でラップして stock=0 時に「在庫切れ」バッジオーバーレイ → `Pagination` → 空表示は `Empty`（`src/components/feedback`）。`pnpm test:unit:only tests/unit/domains/catalog/us1/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us1.spec.ts 2>&1` で PASS 確認

- [x] T015 [US1] `src/app/(buyer)/nav.ts` に `{ href: '/catalog', label: '商品一覧' }` を追加。`pnpm test:e2e -x tests/e2e/catalog-us1.spec.ts 2>&1` で PASS 確認

### Refactor

- [x] T016 [US1] US1 で変更したコード（`getProducts`, `ProductList`）をリファクタリング。`pnpm test:unit:only tests/unit/domains/catalog/us1/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us1/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us1.spec.ts 2>&1` で全 PASS 確認

**チェックポイント**: US1 が独立して動作・テスト通過済み

---

## フェーズ 4: ユーザーストーリー 2 - 商品詳細を確認する（優先度: P2）

**目標**: 購入者が商品詳細で全情報を確認でき、在庫切れ時はカート追加ボタンが無効、画像なし時はプレースホルダーが表示される
**独立テスト**: `/catalog/[id]` に直接アクセスし、情報表示・ボタン状態・戻るナビを確認

### Red

⚠️ 禁止: 引数なし `toThrow()`、条件付きアサーション(`if→expect`)、`it.todo`/`skip`、テスト名「未実装」

- [x] T017 [P] [US2] `tests/unit/domains/catalog/us2/usecase.test.ts` を作成 (AC-1,2,3,4, FR-006,007,008,009,010)。テスト対象: `getProductById`（存在確認、buyer は published のみ、NotFoundError）。`pnpm test:unit:only tests/unit/domains/catalog/us2/ 2>&1` で FAIL 確認

- [x] T018 [P] [US2] `tests/unit/domains/catalog/us2/ui.test.tsx` を作成 (AC-1,2,3,4, FR-007,008,009,010)。テスト対象: `ProductDetail`（全フィールド表示、stock>0でボタン有効、stock=0でボタン無効、imageUrl未設定でプレースホルダー、戻るボタン）。`pnpm test:unit:only tests/unit/domains/catalog/us2/ 2>&1` で FAIL 確認

- [x] T019 [P] [US2] `tests/integration/domains/catalog/us2/api.test.ts` を作成 (AC-1,2)。テスト対象: `getProductById` ← 出力スキーマ整合、404 応答。`pnpm test:integration:only tests/integration/domains/catalog/us2/ 2>&1` で FAIL 確認

- [x] T020 [US2] `tests/e2e/catalog-us2.spec.ts` を作成 (AC-1〜4)。シナリオ: 詳細ページで全情報表示、在庫切れ商品のボタン無効（data-testid or disabled 属性）、imageUrl なし商品でプレースホルダー表示（`data-testid="image-placeholder"`）、戻るボタンで一覧ページに遷移。`pnpm test:e2e --retries 0 tests/e2e/catalog-us2.spec.ts 2>&1` で FAIL 確認

### Green

テストコード変更禁止。実装コードのみで全テストを PASS させる。

- [x] T021 [US2] `src/domains/catalog/api/index.ts` の `getProductById` を実装: `validate(GetProductByIdInputSchema, rawInput)` → `repo.findById(id)` → 存在/ステータスチェック → 返却。サンプル参照。`pnpm test:unit:only tests/unit/domains/catalog/us2/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us2/ 2>&1` で PASS 確認

- [x] T022 [US2] `src/domains/catalog/ui/index.tsx` の `ProductDetail` を実装: `useFetch('/api/catalog/products/${id}')` → `ImagePlaceholder`（src=imageUrl）、商品名・価格・説明文・在庫数表示、stock=0 なら `<Button disabled>在庫切れ</Button>`、stock>0 なら `<Button>カートに追加（未実装）</Button>`（onClick なし）、`BackButton` で一覧へ。`pnpm test:unit:only tests/unit/domains/catalog/us2/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us2.spec.ts 2>&1` で PASS 確認

### Refactor

- [x] T023 [US2] US2 で変更したコード（`getProductById`, `ProductDetail`）をリファクタリング。`pnpm test:unit:only tests/unit/domains/catalog/us2/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us2/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us2.spec.ts 2>&1` で全 PASS 確認

**チェックポイント**: US1 と US2 が両方独立して動作・テスト通過済み

---

## フェーズ 5: ユーザーストーリー 3 - 商品を検索する（優先度: P3）

**目標**: 購入者がキーワードで商品を絞り込みでき、0件時のメッセージとクリア機能が動作する
**独立テスト**: 検索バーにキーワードを入力して結果変化、クリアで全件表示を確認

### Red

⚠️ 禁止: 引数なし `toThrow()`、条件付きアサーション(`if→expect`)、`it.todo`/`skip`、テスト名「未実装」

- [x] T024 [P] [US3] `tests/unit/domains/catalog/us3/usecase.test.ts` を作成 (AC-1,2,3, FR-011,012,013)。テスト対象: `getProducts({ q: 'keyword' })`（name/description 部分一致フィルタ、0件時は空配列）。`pnpm test:unit:only tests/unit/domains/catalog/us3/ 2>&1` で FAIL 確認

- [x] T025 [P] [US3] `tests/unit/domains/catalog/us3/ui.test.tsx` を作成 (AC-1,2,3, FR-011,012,013)。テスト対象: `ProductList` の `SearchBar` 連携（Enter でリフェッチ、0件時「該当する商品が見つかりませんでした」、クリアで全件戻り）。`pnpm test:unit:only tests/unit/domains/catalog/us3/ 2>&1` で FAIL 確認

- [x] T026 [P] [US3] `tests/integration/domains/catalog/us3/api.test.ts` を作成 (AC-1,2)。テスト対象: `getProducts` ← q パラメータの入出力スキーマ整合、0件レスポンス。`pnpm test:integration:only tests/integration/domains/catalog/us3/ 2>&1` で FAIL 確認

- [x] T027 [US3] `tests/e2e/catalog-us3.spec.ts` を作成 (AC-1〜3)。シナリオ: 検索バーに存在するキーワードを入力→Enter→絞り込み結果表示、存在しないキーワード→「該当する商品が見つかりませんでした」表示、クリアボタン→全件表示。`pnpm test:e2e --retries 0 tests/e2e/catalog-us3.spec.ts 2>&1` で FAIL 確認

### Green

テストコード変更禁止。実装コードのみで全テストを PASS させる。

- [x] T028 [US3] `src/contracts/catalog.ts` の `GetProductsInputSchema` に `q: z.string().optional()` を追加

- [x] T029 [US3] `src/infrastructure/repositories/product.ts` の `productRepository.findAll` に keyword フィルタを追加: `params.query` が指定された場合、`name` または `description` に対して大文字小文字を無視した部分一致フィルタ

- [x] T030 [US3] `src/app/api/catalog/products/route.ts` の GET ハンドラで `q: searchParams.get('q') ?? undefined` を input に追加し `getProducts` へ渡す

- [x] T031 [US3] `src/domains/catalog/api/index.ts` の `getProducts` に `q` 対応を追加: バリデーション済み input の `q` を `repo.findAll({ ..., query: input.q })` へ渡す。`pnpm test:unit:only tests/unit/domains/catalog/us3/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us3/ 2>&1` で PASS 確認

- [x] T032 [US3] `src/domains/catalog/ui/index.tsx` の `ProductList` に `SearchBar` を追加: `useState('')` で `q` 管理 → `useFetch` の params に `q` を含める（空文字は undefined 扱い） → `SearchBar` の `onSearch` で state 更新 → 0件時「該当する商品が見つかりませんでした」表示。`pnpm test:unit:only tests/unit/domains/catalog/us3/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us3.spec.ts 2>&1` で PASS 確認

### Refactor

- [x] T033 [US3] US3 で変更したコード（contracts, repository, route, `getProducts`, `ProductList`）をリファクタリング。`pnpm test:unit:only tests/unit/domains/catalog/us3/ 2>&1` & `pnpm test:integration:only tests/integration/domains/catalog/us3/ 2>&1` & `pnpm test:e2e -x tests/e2e/catalog-us3.spec.ts 2>&1` で全 PASS 確認
<!-- T032 note: ProductList 検索 UI は US1 Green で実装済み。DataView emptyCheck を削除して ProductList の空状態表示に統一した -->

**チェックポイント**: 全ユーザーストーリーが独立して動作・テスト通過済み

---

## 最終フェーズ: ポリッシュ & 横断関心事

**目的**: 品質基準の最終確認とリグレッション検出

- [ ] T034 型チェックと Lint: `pnpm typecheck 2>&1` & `pnpm lint 2>&1` でエラー 0件を確認
- [ ] T035 全単体・統合テスト: `pnpm test:unit 2>&1` & `pnpm test:integration 2>&1` で全件 PASS 確認（カバレッジ 80% 以上）
- [ ] T036 全件 E2E テスト（リグレッション検出）: `pnpm test:e2e 2>&1` で全 E2E PASS 確認（catalog-us1, catalog-us2, catalog-us3 を含む）

---

## 依存関係と実行順序

### フェーズ依存関係

- **フェーズ 1（Setup）**: 依存なし・即開始可能
- **フェーズ 2（Foundational）**: フェーズ 1 完了後 — 全ストーリーをブロック
- **フェーズ 2b（Scaffolding）**: フェーズ 2 完了後 — Red テストの前提
- **フェーズ 3〜5（US1〜3）**: フェーズ 2b 完了後、優先度順（P1→P2→P3）
- **最終フェーズ**: 全ストーリー完了後

### ユーザーストーリー依存関係

- **US1 (P1)**: 2b 完了後に開始可能 — 独立
- **US2 (P2)**: 2b 完了後に開始可能（US1 の getProducts 実装を参照するが独立テスト可能）
- **US3 (P3)**: 2b 完了後に開始可能（US1 の ProductList を拡張するため US1 Green 完了後を推奨）

### 各ストーリー内の順序

- Red テストを作成・FAIL 確認してから Green 実装へ
- Green: usecase → ui → nav の順で実装
- Refactor: 全テスト PASS 後に実施

### 並列機会

- T002 と T003 は並列実行可能
- T009, T010, T011 は並列実行可能（Red フェーズ内）
- T017, T018, T019 は並列実行可能
- T024, T025, T026 は並列実行可能

---

## 実装戦略

### MVP First（US1 のみ）

1. フェーズ 1 完了
2. フェーズ 2 完了（必須前提）
3. フェーズ 2b 完了（スキャフォールディング）
4. フェーズ 3（US1）完了
5. **停止・検証**: `/catalog` で商品一覧、ページネーション、在庫切れ表示を確認

### 段階的デリバリー

1. Setup + Foundational + Scaffolding → 基盤完成
2. US1 → 商品一覧 MVP 完成・デモ可能
3. US2 → 商品詳細 追加・デモ可能
4. US3 → 検索機能 追加・デモ可能
5. Polish → 品質確認・リリース準備

---

## ノート

- `[P]` タスク = 異なるファイル・依存関係なし → 並列実行可能
- `[Story]` ラベルはトレーサビリティのためユーザーストーリーにタスクをマッピング
- 各ユーザーストーリーは独立して完了・テスト可能であること
- Red テストが FAIL していることを確認してから Green 実装に移ること
- 各タスクまたは論理グループごとにコミットすること
- チェックポイントで立ち止まりストーリーを独立して検証すること
