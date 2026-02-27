# タスクリスト: カート管理機能 (002-cart-manage)

**Input**: `specs/002-cart-manage/` (plan.md, spec.md, research.md, data-model.md, contracts/cart-api.md)
**合計タスク数**: 49
**並列実行可能タスク**: 各フェーズ Red の単体・統合テスト作成（[P]マーク）

---

## フェーズ 1: セットアップ

**目的**: 依存関係確認

- [ ] T001 `pnpm install` で依存関係が揃っていることを確認。`pnpm typecheck` と `pnpm lint` がエラー 0 件で通ることを確認

---

## フェーズ 2: 基盤整備（ブロッキング前提条件）

**目的**: 全 US に先行して必要な変更（ProductFetcher への stock 追加）

⚠️ **CRITICAL**: このフェーズ完了前にユーザーストーリーの作業を始めてはならない

- [ ] T002 `src/contracts/cart.ts` の `ProductFetcher` インターフェースに `stock: number` を追加（research.md Decision 2）
- [ ] T003 `src/infrastructure/repositories/cart.ts` の `productFetcher.findById` 戻り値に `stock: product.stock` を追加（T002 に依存）

---

## フェーズ 2b: スキャフォールディング

**目的**: 全 US のスタブ一括生成。Red テスト作成の前提条件。

- [ ] T004 前準備: `src/components/index.ts`, `src/templates/index.ts`, `src/app/(samples)/sample/api/cart/route.ts`, `src/app/(samples)/sample/api/cart/items/route.ts`, `src/app/(samples)/sample/api/cart/items/[productId]/route.ts`, `src/samples/domains/cart/api/index.ts`, `src/samples/domains/cart/ui/CartView.tsx` を Read し、createRouteHandler パターン・バレルエクスポート・CartViewProps を把握する

- [ ] T005 `src/app/api/cart/route.ts` を T004 で読んだサンプルに従い `createRouteHandler()` で書き換え（手書き try-catch 禁止）

- [ ] T006 `src/app/api/cart/items/route.ts` を `createRouteHandler()` で書き換え（手書き try-catch 禁止）

- [ ] T007 `src/app/api/cart/items/[productId]/route.ts` を `createRouteHandler()` で書き換え（手書き try-catch 禁止）

- [ ] T008 `src/domains/cart/api/index.ts` と `src/domains/cart/ui/index.tsx` を更新:
  - api: `getCart`/`addToCart`/`updateCartItem`/`removeFromCart` は引き続き `throw new NotImplementedError(...)` のまま（JSX 返却禁止）
  - api 先頭に `// @see barrel: [T004 で読んだ @/components の全エクスポートを列挙]` コメントを付与
  - ui: `CartView` は `throw new NotImplementedError('cart', 'CartView')` のみ（JSX 返却禁止）
  - ui 先頭に `// @see barrel: [T004 で読んだ @/components の全エクスポートを列挙]` コメントを付与

- [ ] T009 `src/domains/catalog/ui/index.tsx` の `ProductDetailProps` に `onAddToCart?: (productId: string) => void` と `isAddingToCart?: boolean` を追加し、ボタン `onClick` と `disabled` に接続するスタブを記述

- [ ] T010 `src/app/(buyer)/cart/page.tsx` を `'use client'` + `useFetch<Cart>('/api/cart')` + `<DataView>` + `{(cart) => <CartView cart={cart} />}` 形式に書き換え（CartView は T008 のスタブを使用）。`loadingMessage="カートを読み込み中..."` を設定

---

## フェーズ 3: US1 - 商品をカートに追加する（優先度: P1）🎯 MVP

**ゴール**: 商品詳細ページからカート追加・在庫チェック・未ログインリダイレクトが動作する

**独立テスト**: `/catalog/[id]` で「カートに追加」を押し、トーストとカートアイコン更新を確認

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T011 [P] [US1] `tests/unit/domains/cart/us1/usecase.test.ts` を作成 (AC-1,2,3,5 / FR-001,002,003,007)。テスト対象: `addToCart`。モック: `CartRepository`, `ProductFetcher`。`pnpm test:unit:only tests/unit/domains/cart/us1/ 2>&1` で FAIL 確認

- [ ] T012 [P] [US1] `tests/unit/domains/cart/us1/product-detail.test.tsx` を作成 (AC-4,6 / FR-004,005)。テスト対象: `ProductDetail`。stock=0 でボタン disabled、isAddingToCart=true でボタン disabled、onAddToCart がクリック時に呼ばれる。`pnpm test:unit:only tests/unit/domains/cart/us1/ 2>&1` で FAIL 確認

- [ ] T013 [P] [US1] `tests/integration/domains/cart/us1/api.test.ts` を作成 (AC-1,2,3,5 / FR-001,002,003,007)。テスト対象: `POST /api/cart/items`。`resetCartStore()` を beforeEach で実行。`pnpm test:integration:only tests/integration/domains/cart/us1/ 2>&1` で FAIL 確認

- [ ] T014 [US1] `tests/e2e/cart-us1.spec.ts` を作成 (AC-1,5)。`src/app/(buyer)/catalog/[id]/page.tsx` と seed データを Read 後に作成。「カートに追加」→ トースト表示 (AC-1)、未ログイン→ /login リダイレクト (AC-5)。`pnpm test:e2e --retries 0 tests/e2e/cart-us1.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T015 [US1] `src/domains/cart/api/index.ts` の `addToCart` を実装 (FR-001〜007)。`authorize(session,'buyer')` → `validate` → `productFetcher.findById` → 在庫チェック → `repository.addItem`。在庫不足は `AppError(ErrorCode.UNPROCESSABLE_ENTITY, '在庫不足です')`。`pnpm test:unit:only tests/unit/domains/cart/us1/ 2>&1` で PASS 確認

- [ ] T016 [US1] `src/domains/catalog/ui/index.tsx` の `ProductDetail` で `onAddToCart` を button の onClick に接続。`src/app/(buyer)/catalog/[id]/page.tsx` に `useFormSubmit` で addToCart API 呼び出し・401時 router.push('/login?callbackUrl=...')・`emitCartUpdated()`・`useToast` を追加。`pnpm test:unit:only tests/unit/domains/cart/us1/ 2>&1` と `pnpm test:integration:only tests/integration/domains/cart/us1/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us1.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T017 [US1] T015〜T016 で変更したファイルを Read しレビュー → 必要に応じてリファクタリング → `pnpm test:unit:only tests/unit/domains/cart/us1/ 2>&1` と `pnpm test:integration:only tests/integration/domains/cart/us1/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us1.spec.ts 2>&1` で PASS 確認

---

## フェーズ 4: US2 - カート内容を確認する（優先度: P2）

**ゴール**: カートページで商品一覧・税込合計金額・空カートメッセージが正確に表示される

**独立テスト**: カートに商品追加後、/cart を開いて税金計算が正確なことを確認

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T018 [P] [US2] `tests/unit/domains/cart/us2/usecase.test.ts` を作成 (AC-1,2,3 / FR-008,009,010)。テスト対象: `getCart`。カートなし→空カート作成、カートあり→返却。`pnpm test:unit:only tests/unit/domains/cart/us2/ 2>&1` で FAIL 確認

- [ ] T019 [P] [US2] `tests/unit/domains/cart/us2/cart-view.test.tsx` を作成 (AC-1,2,3 / FR-008,009,010)。テスト対象: `CartView`。商品一覧表示・税金計算表示・空カートメッセージ。`pnpm test:unit:only tests/unit/domains/cart/us2/ 2>&1` で FAIL 確認

- [ ] T020 [P] [US2] `tests/integration/domains/cart/us2/api.test.ts` を作成 (AC-1,2,3)。テスト対象: `GET /api/cart`。`resetCartStore()` を beforeEach で実行。`pnpm test:integration:only tests/integration/domains/cart/us2/ 2>&1` で FAIL 確認

- [ ] T021 [US2] `tests/e2e/cart-us2.spec.ts` を作成 (AC-1,2,3)。`src/app/(buyer)/cart/page.tsx` と `src/samples/domains/cart/ui/CartView.tsx` の testid を Read 後に作成。商品合計・消費税・総合計の表示確認 (AC-2)、空カートメッセージと商品一覧リンク (AC-3)。`pnpm test:e2e --retries 0 tests/e2e/cart-us2.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T022 [US2] `src/domains/cart/api/index.ts` の `getCart` を実装 (FR-008〜010)。`authorize` → `findByUserId` → なければ `create`。`pnpm test:unit:only tests/unit/domains/cart/us2/ 2>&1` で PASS 確認

- [ ] T023 [US2] `src/domains/cart/ui/index.tsx` の `CartView` を実装 (FR-008〜010)。`src/samples/domains/cart/ui/CartView.tsx` を参照。税金計算 `Math.floor(cart.subtotal * 0.1)`、空カート時は「カートに商品がありません」+ 商品一覧リンク。`pnpm test:unit:only tests/unit/domains/cart/us2/ 2>&1` で PASS 確認

- [ ] T024 [US2] `src/app/(buyer)/cart/page.tsx` を更新: `useFetch<Cart>('/api/cart')` の結果を `<DataView>` → `{(cart) => <CartView cart={cart} />}` で表示。`pnpm test:e2e -x tests/e2e/cart-us2.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T025 [US2] T022〜T024 で変更したファイルを Read しレビュー → リファクタリング → `pnpm test:unit:only tests/unit/domains/cart/us2/ 2>&1` と `pnpm test:integration:only tests/integration/domains/cart/us2/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us2.spec.ts 2>&1` で PASS 確認

---

## フェーズ 5: US3 - カート内の数量を変更する（優先度: P3）

**ゴール**: カートページで数量変更が在庫チェック付きで動作し、小計・合計が即時更新される

**独立テスト**: カートページで + ボタン押下 → 小計更新。在庫超過数量 → エラー表示

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T026 [P] [US3] `tests/unit/domains/cart/us3/usecase.test.ts` を作成 (AC-1,2 / FR-011,012)。テスト対象: `updateCartItem`。有効範囲内→成功、在庫超過→エラー。`pnpm test:unit:only tests/unit/domains/cart/us3/ 2>&1` で FAIL 確認

- [ ] T027 [P] [US3] `tests/unit/domains/cart/us3/cart-view.test.tsx` を作成 (AC-3 / FR-011)。テスト対象: `CartView`。`QuantitySelector` が `onChange` 呼び出し時に `onUpdateQuantity` を呼ぶ。`pnpm test:unit:only tests/unit/domains/cart/us3/ 2>&1` で FAIL 確認

- [ ] T028 [P] [US3] `tests/integration/domains/cart/us3/api.test.ts` を作成 (AC-1,2 / FR-011,012)。テスト対象: `PUT /api/cart/items/:productId`。`resetCartStore()` を beforeEach で実行。`pnpm test:integration:only tests/integration/domains/cart/us3/ 2>&1` で FAIL 確認

- [ ] T029 [US3] `tests/e2e/cart-us3.spec.ts` を作成 (AC-1,2)。CartView の testid を Read 後に作成（data-testid="quantity-increment" 等）。+ ボタン → 数量増加・小計更新 (AC-1)。在庫超過時エラートースト (AC-2)。`pnpm test:e2e --retries 0 tests/e2e/cart-us3.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T030 [US3] `src/domains/cart/api/index.ts` の `updateCartItem` を実装 (FR-011,012)。`authorize` → `validate` → `productFetcher.findById` → 在庫チェック → `repository.updateItemQuantity`。`pnpm test:unit:only tests/unit/domains/cart/us3/ 2>&1` で PASS 確認

- [ ] T031 [US3] `src/app/(buyer)/cart/page.tsx` に `handleUpdateQuantity` を追加: `PUT /api/cart/items/:productId` 呼び出し → `refetch()` → `emitCartUpdated()`。エラー時は `useToast` で表示。CartView に `onUpdateQuantity={handleUpdateQuantity}` を渡す。`pnpm test:integration:only tests/integration/domains/cart/us3/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us3.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T032 [US3] T030〜T031 で変更したファイルを Read しレビュー → リファクタリング → `pnpm test:unit:only tests/unit/domains/cart/us3/ 2>&1` と `pnpm test:integration:only tests/integration/domains/cart/us3/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us3.spec.ts 2>&1` で PASS 確認

---

## フェーズ 6: US4 - カートから商品を削除する（優先度: P4）

**ゴール**: 確認ダイアログ付きの削除が動作し、最後の1件削除で空カート表示になる

**独立テスト**: 削除ボタン → ConfirmDialog 表示 → 承認 → 商品削除確認

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T033 [P] [US4] `tests/unit/domains/cart/us4/usecase.test.ts` を作成 (AC-2,3 / FR-014)。テスト対象: `removeFromCart`。削除成功・最後の1件削除→空カート。`pnpm test:unit:only tests/unit/domains/cart/us4/ 2>&1` で FAIL 確認

- [ ] T034 [P] [US4] `tests/unit/domains/cart/us4/cart-view.test.tsx` を作成 (AC-1,4 / FR-013)。テスト対象: `CartView`。削除ボタンクリック→ ConfirmDialog 表示 (data-testid="confirm-dialog")、キャンセル→ダイアログ非表示。`pnpm test:unit:only tests/unit/domains/cart/us4/ 2>&1` で FAIL 確認

- [ ] T035 [P] [US4] `tests/integration/domains/cart/us4/api.test.ts` を作成 (AC-2,3)。テスト対象: `DELETE /api/cart/items/:productId`。`resetCartStore()` を beforeEach で実行。`pnpm test:integration:only tests/integration/domains/cart/us4/ 2>&1` で FAIL 確認

- [ ] T036 [US4] `tests/e2e/cart-us4.spec.ts` を作成 (AC-1,2,3,4)。ConfirmDialog の testid を確認済み（data-testid="confirm-dialog","confirm-button","cancel-button"）。削除フロー全体を検証。`pnpm test:e2e --retries 0 tests/e2e/cart-us4.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T037 [US4] `src/domains/cart/api/index.ts` の `removeFromCart` を実装 (FR-013,014)。`authorize` → `validate` → カート存在チェック → アイテム存在チェック → `repository.removeItem`。`pnpm test:unit:only tests/unit/domains/cart/us4/ 2>&1` で PASS 確認

- [ ] T038 [US4] `src/app/(buyer)/cart/page.tsx` に `handleRemove` を追加: `DELETE /api/cart/items/:productId` 呼び出し → `refetch()` → `emitCartUpdated()`。CartView に `onRemove={handleRemove}` を渡す。`pnpm test:integration:only tests/integration/domains/cart/us4/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us4.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T039 [US4] T037〜T038 で変更したファイルを Read しレビュー → リファクタリング → `pnpm test:unit:only tests/unit/domains/cart/us4/ 2>&1` と `pnpm test:integration:only tests/integration/domains/cart/us4/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us4.spec.ts 2>&1` で PASS 確認

---

## フェーズ 7: US5 - カート内容を永続化する（優先度: P5）

**ゴール**: ページ遷移・リロード後もカート内容が保持される

**独立テスト**: カート追加後に別ページへ遷移し /cart に戻る。リロードしてもカート保持

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T040 [P] [US5] `tests/unit/domains/cart/us5/usecase.test.ts` を作成 (AC-1,2 / FR-015)。テスト対象: `getCart`（既存アイテムがある場合）。事前に addItem → getCart → items が保持されている。`pnpm test:unit:only tests/unit/domains/cart/us5/ 2>&1` で FAIL 確認（getCart 未実装のため）

- [ ] T041 [US5] `tests/e2e/cart-us5.spec.ts` を作成 (AC-1,2)。カート追加→/catalog に遷移→/cart に戻る→保持確認 (AC-1)。カート追加→リロード→保持確認 (AC-2)。`pnpm test:e2e --retries 0 tests/e2e/cart-us5.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T042 [US5] 既存の `createStore` によるインメモリ実装が FR-015 を充足（実装変更なし）。`pnpm test:unit:only tests/unit/domains/cart/us5/ 2>&1` で PASS 確認（getCart が US2 で実装済みのため）。`pnpm test:e2e -x tests/e2e/cart-us5.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T043 [US5] `pnpm test:unit:only tests/unit/domains/cart/us5/ 2>&1` と `pnpm test:e2e -x tests/e2e/cart-us5.spec.ts 2>&1` で全件 PASS 確認。変更なし

---

## 最終フェーズ: ポリッシュ・横断的関心事

**目的**: TypeScript/lint チェック・nav.ts 更新・全件テストでリグレッション検出

- [ ] T044 `pnpm typecheck 2>&1` でエラー 0 件を確認。エラーがあれば修正する

- [ ] T045 `pnpm lint 2>&1` でエラー 0 件を確認。エラーがあれば修正する

- [ ] T046 `src/app/(buyer)/nav.ts` に `{ href: '/cart', label: 'カート' }` を追加

- [ ] T047 `pnpm test:unit 2>&1` で全件 PASS を確認

- [ ] T048 `pnpm test:integration 2>&1` で全件 PASS を確認

- [ ] T049 `pnpm test:e2e 2>&1` で全件 PASS を確認（リグレッション検出）

---

## 依存関係と実行順

### フェーズ依存関係

- **フェーズ 1 (Setup)**: 即時開始可能
- **フェーズ 2 (基盤整備)**: フェーズ 1 完了後。全 US をブロック
- **フェーズ 2b (スキャフォールディング)**: フェーズ 2 完了後。全 US Red の前提
- **フェーズ 3〜7 (US1〜US5)**: フェーズ 2b 完了後、P1 → P2 → P3 → P4 → P5 の順で実施
- **最終フェーズ**: 全 US 完了後

### US 間の依存関係

- **US1 (P1)**: 独立。フェーズ 2b 完了後に開始可能
- **US2 (P2)**: US1 の Green 完了後（addToCart が実装済みでないとカートが空のまま）
- **US3 (P3)**: US2 の Green 完了後（CartView が必要）
- **US4 (P4)**: US2 の Green 完了後（CartView が必要）。US3 と並列可
- **US5 (P5)**: US1・US2 の Green 完了後（addToCart・getCart が必要）

### 各 US 内の順序

```
Red（T[unit]・T[ui]・T[integration] は [P]で並列）→ T[e2e]（直列）
→ Green（実装 → テスト PASS 確認）
→ Refactor（変更ファイル確認 → テスト PASS 確認）
```

---

## 並列実行例

```bash
# US1 Red フェーズの並列作業:
# T011: unit/us1/usecase.test.ts
# T012: unit/us1/product-detail.test.tsx
# T013: integration/us1/api.test.ts
# → いずれも独立したファイル作成。並列実行可能

# US4 Red フェーズの並列作業:
# T033: unit/us4/usecase.test.ts
# T034: unit/us4/cart-view.test.tsx
# T035: integration/us4/api.test.ts
```

---

## 実装戦略

### MVP（US1 のみ）

1. フェーズ 1 → フェーズ 2 → フェーズ 2b 完了
2. フェーズ 3（US1）: Red → Green → Refactor
3. STOP: カート追加が独立して動作することを確認

### 段階的デリバリー

1. Setup + 基盤整備 + スキャフォールディング → 基盤完了
2. US1 → 商品追加可能（MVP）
3. US2 → カート確認可能（カートページ完成）
4. US3 → 数量変更可能
5. US4 → 削除可能（カート管理フル機能）
6. US5 → 永続化確認（横断的関心事）

---

## 注記

- `[P]` = 別ファイル・依存なし → 並列実行可能
- `[Story]` = 各タスクが属するユーザーストーリー
- `resetCartStore()` は `@/infrastructure/repositories` から import
- CartView のテストは `render` + `screen` (testing-library/react)
- E2E テストは `src/samples/tests/e2e/` を参照パターンとして活用
- サンプルテスト（`pnpm test:*:samples`）は実行しない
