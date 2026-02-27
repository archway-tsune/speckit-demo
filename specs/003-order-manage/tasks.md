# タスク: 注文機能

**入力**: `specs/003-order-manage/` 設計ドキュメント
**前提条件**: plan.md・spec.md・research.md・data-model.md・contracts/api.md

---

## フェーズ 1: セットアップ

- [ ] T001 依存関係確認: `pnpm install` を実行し、既存パッケージが正しく揃っていることを確認する

---

## フェーズ 2: 基盤（全 US の前提条件）

⚠️ このフェーズが完了するまでユーザーストーリーの作業を開始できない

- [ ] T002 `src/contracts/orders.ts` の `OrderSchema` に `subtotal`・`tax` フィールドを追加し、`OrderRepository.create()` インターフェースも更新する（research.md Decision 1 参照）
- [ ] T003 `src/infrastructure/repositories/order.ts` の `orderRepository.create()` を更新し、`subtotal`・`tax` を受け取って保存できるようにする

**チェックポイント**: contracts と repository が新フィールドに対応した

---

## フェーズ 2b: スキャフォールディング

- [ ] T004 前準備: `src/components/index.ts`・`src/templates/index.ts`・`src/app/(samples)/sample/api/orders/route.ts`・`src/app/(samples)/sample/api/orders/[id]/route.ts`・`src/samples/domains/orders/api/index.ts`・`src/samples/domains/orders/ui/` 配下全ファイルを Read し、barrel エクスポート一覧・createRouteHandler パターン・サンプル UI 使用例を把握する

- [ ] T005 `src/app/api/orders/route.ts` を T004 のサンプルに従い `createRouteHandler()` で書き換える（手書き try-catch 禁止）

- [ ] T006 `src/app/api/orders/[id]/route.ts` を T004 のサンプルに従い `createRouteHandler()` で書き換える（手書き try-catch 禁止）

- [ ] T007 ドメインスタブ更新:
  - `src/domains/orders/api/state-machine.ts` を新規作成（`OrderStateMachine` クラスのメソッドを `throw new NotImplementedError()` で実装）
  - `src/domains/orders/api/index.ts` 先頭の `// @see barrel:` コメントを T004 で読んだバレル全エクスポートで更新
  - `src/domains/orders/ui/OrderList.tsx` を新規作成（T004 で把握した props 型付きスタブ、JSX 返却禁止）
  - `src/domains/orders/ui/OrderDetail.tsx` を新規作成（同上）
  - `src/domains/orders/ui/index.tsx` を更新（OrderList・OrderDetail・props 型を export）

- [ ] T008 page.tsx スタブ更新:
  - `src/app/(buyer)/checkout/page.tsx`: `useFetch<Cart>('/api/cart')` + `DataView` + `CheckoutView` コンポーネント呼び出し形式のスタブに置き換え
  - `src/app/(buyer)/orders/page.tsx`: `useFetch` + `DataView` + `OrderList` 配線形式のスタブに更新（既存 import を活かしコンテナラッパーを追加）
  - `src/app/(buyer)/orders/[id]/page.tsx`: `useFetch` + `DataView` + `OrderDetail` 配線形式のスタブに更新（同上）
  - `src/app/admin/orders/page.tsx`: 管理者注文一覧スタブに更新
  - `src/app/admin/orders/[id]/page.tsx`: 管理者注文詳細スタブに更新

**チェックポイント**: `pnpm tsc --noEmit` がスタブ段階でエラーなし（NotImplementedError は除く）

---

## フェーズ 3: US1 - チェックアウトと注文確定 (優先度: P1) 🎯 MVP

**ゴール**: 購入者がカートから注文を確定し、注文完了画面と空カートを確認できる
**独立テスト**: カートに商品追加 → /checkout → 注文確定 → /orders/:id?completed=true が表示され /cart が空

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T009 [P] [US1] `tests/unit/domains/orders/us1/create-order.test.ts` を作成 (AC-4, AC-5, FR-004, FR-005)。テスト対象: `createOrder`（tax 計算・カートクリア・EmptyCartError・ForbiddenError）。`pnpm test:unit:only tests/unit/domains/orders/us1/ 2>&1` で FAIL 確認
- [ ] T010 [P] [US1] `tests/unit/domains/orders/us1/cart-view.test.tsx` を作成 (AC-1, AC-2, FR-001, FR-002)。テスト対象: `CartView` の `onCheckout` props（カートあり→ボタン表示、空→非表示）。`pnpm test:unit:only tests/unit/domains/orders/us1/ 2>&1` で FAIL 確認
- [ ] T011 [P] [US1] `tests/integration/domains/orders/us1/api.test.ts` を作成 (AC-4, FR-004)。テスト対象: `POST /api/orders`。Schema.parse() で Order 契約検証・subtotal/tax/totalAmount 計算正確。`pnpm test:integration:only tests/integration/domains/orders/us1/ 2>&1` で FAIL 確認
- [ ] T012 [US1] `tests/e2e/orders-us1.spec.ts` を作成 (AC-1, AC-2, AC-3, AC-4, AC-5)。カート→チェックアウト→注文確定→完了画面・カートクリア。`pnpm test:e2e --retries 0 tests/e2e/orders-us1.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T013 [US1] `src/domains/orders/api/state-machine.ts` に `OrderStateMachine` クラスを実装（`canTransition`・`transition`・`getAllowedTransitions`、`ValidStatusTransitions` 参照）
- [ ] T014 [US1] `src/domains/orders/api/index.ts` の `createOrder` を実装（authorize buyer・EmptyCartError・tax 計算・cartFetcher.clear）。`pnpm test:unit:only tests/unit/domains/orders/us1/ 2>&1` で PASS 確認
- [ ] T015 [US1] `src/domains/cart/ui/index.tsx` の `CartView` に `onCheckout?: () => void` props を追加し、`items.length > 0` の場合のみ「注文手続きへ」リンクを表示 (FR-001, FR-002)
- [ ] T016 [US1] `src/app/(buyer)/cart/page.tsx` に `onCheckout={() => router.push('/checkout')}` を追加配線
- [ ] T017 [US1] `src/app/(buyer)/checkout/page.tsx` を完全実装（`useFetch<Cart>` + `useFormSubmit` + POST /api/orders → /orders/:id?completed=true リダイレクト。空カート時 /cart リダイレクト）。`pnpm test:e2e -x tests/e2e/orders-us1.spec.ts 2>&1` で PASS 確認（Bash timeout: 120000ms）

### Refactor

- [ ] T018 [US1] US1 で変更した全ファイルを Read しレビュー → リファクタリング（必要があれば）。`pnpm test:unit:only tests/unit/domains/orders/us1/ && pnpm test:integration:only tests/integration/domains/orders/us1/ && pnpm test:e2e -x tests/e2e/orders-us1.spec.ts 2>&1` で PASS 確認

---

## フェーズ 4: US2 - 注文履歴閲覧 (優先度: P2)

**ゴール**: 購入者が自分の注文一覧をページネーション付きで閲覧できる
**独立テスト**: 複数注文がある状態で /orders にアクセス → 一覧表示・自分の注文のみ・ページネーション

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T019 [P] [US2] `tests/unit/domains/orders/us2/get-orders.test.ts` を作成 (AC-1, AC-2, FR-007, FR-008)。テスト対象: `getOrders`（buyer→自分の注文のみ・admin→全注文・ページネーション計算）。`pnpm test:unit:only tests/unit/domains/orders/us2/ 2>&1` で FAIL 確認
- [ ] T020 [P] [US2] `tests/integration/domains/orders/us2/api.test.ts` を作成 (AC-1, AC-2, FR-008)。テスト対象: `GET /api/orders`。Schema.parse() でページネーション構造検証。`pnpm test:integration:only tests/integration/domains/orders/us2/ 2>&1` で FAIL 確認
- [ ] T021 [US2] `tests/e2e/orders-us2.spec.ts` を作成 (AC-1, AC-3)。注文一覧表示・order-row クリックで詳細へ遷移。`pnpm test:e2e --retries 0 tests/e2e/orders-us2.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T022 [US2] `src/domains/orders/api/index.ts` の `getOrders` を実装（buyer 自分のみ・admin 全件・ページネーション）。`pnpm test:unit:only tests/unit/domains/orders/us2/ 2>&1` で PASS 確認
- [ ] T023 [US2] `src/domains/orders/ui/OrderList.tsx` を実装（サンプル `src/samples/domains/orders/ui/OrderList.tsx` 参照・`@/contracts/orders` 型使用）
- [ ] T024 [US2] `src/domains/orders/ui/index.tsx` を更新（`OrderList`・`OrderListProps` を export）
- [ ] T025 [US2] `src/app/(buyer)/orders/page.tsx` を実装（`useFetch<GetOrdersOutput>` + `DataView` + `OrderList` 配線・`loginUrl: '/login'`）。`pnpm test:e2e -x tests/e2e/orders-us2.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T026 [US2] US2 で変更した全ファイルを Read しレビュー → リファクタリング。`pnpm test:unit:only tests/unit/domains/orders/us2/ && pnpm test:integration:only tests/integration/domains/orders/us2/ && pnpm test:e2e -x tests/e2e/orders-us2.spec.ts 2>&1` で PASS 確認

---

## フェーズ 5: US3 - 注文詳細閲覧 (優先度: P3)

**ゴール**: 購入者が注文詳細を確認でき、他人の注文にはアクセスできない
**独立テスト**: /orders/:id で詳細表示・別ユーザーの ID では 404/拒否

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T027 [P] [US3] `tests/unit/domains/orders/us3/get-order-by-id.test.ts` を作成 (AC-1, AC-2, FR-009, FR-010)。テスト対象: `getOrderById`（自分→返す・他人→NotFoundError・存在しない→NotFoundError）。`pnpm test:unit:only tests/unit/domains/orders/us3/ 2>&1` で FAIL 確認
- [ ] T028 [P] [US3] `tests/integration/domains/orders/us3/api.test.ts` を作成 (AC-1, AC-2)。テスト対象: `GET /api/orders/:id`。Schema.parse() で Order 構造検証・他人 404。`pnpm test:integration:only tests/integration/domains/orders/us3/ 2>&1` で FAIL 確認
- [ ] T029 [US3] `tests/e2e/orders-us3.spec.ts` を作成 (AC-1, AC-2)。注文詳細表示・他人の注文 URL で 404/拒否。`pnpm test:e2e --retries 0 tests/e2e/orders-us3.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T030 [US3] `src/domains/orders/api/index.ts` の `getOrderById` を実装（buyer 自分のみ・admin 全件・NotFoundError）。`pnpm test:unit:only tests/unit/domains/orders/us3/ 2>&1` で PASS 確認
- [ ] T031 [US3] `src/domains/orders/ui/OrderDetail.tsx` を実装（サンプル `src/samples/domains/orders/ui/OrderDetail.tsx` 参照・`@/contracts/orders` 型使用・subtotal/tax 表示含む）
- [ ] T032 [US3] `src/domains/orders/ui/index.tsx` を更新（`OrderDetail`・`OrderDetailProps` を export）
- [ ] T033 [US3] `src/app/(buyer)/orders/[id]/page.tsx` を実装（`useParams`・`useFetch<Order>` + `DataView` + `OrderDetail` 配線・`?completed=true` でお礼メッセージ表示・`loginUrl: '/login'`）。`pnpm test:e2e -x tests/e2e/orders-us3.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T034 [US3] US3 で変更した全ファイルを Read しレビュー → リファクタリング。`pnpm test:unit:only tests/unit/domains/orders/us3/ && pnpm test:integration:only tests/integration/domains/orders/us3/ && pnpm test:e2e -x tests/e2e/orders-us3.spec.ts 2>&1` で PASS 確認

---

## フェーズ 6: US4 - 管理者注文管理 (優先度: P4)

**ゴール**: 管理者が全注文を閲覧し、ステートマシンで制御されたステータス更新ができる
**独立テスト**: admin ログイン → /admin/orders 全注文表示・フィルタ・ステータス更新（有効・無効遷移）

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T035 [P] [US4] `tests/unit/domains/orders/us4/state-machine.test.ts` を作成（OrderStateMachine の全遷移テーブル検証・終端状態からの遷移不可・canTransition）。`pnpm test:unit:only tests/unit/domains/orders/us4/ 2>&1` で FAIL 確認
- [ ] T036 [P] [US4] `tests/unit/domains/orders/us4/update-order-status.test.ts` を作成 (AC-3, AC-4, AC-5, FR-012, FR-013)。テスト対象: `updateOrderStatus`（有効遷移・InvalidStatusTransitionError・ForbiddenError）。`pnpm test:unit:only tests/unit/domains/orders/us4/ 2>&1` で FAIL 確認
- [ ] T037 [P] [US4] `tests/integration/domains/orders/us4/api.test.ts` を作成 (AC-3, AC-5)。テスト対象: `PATCH /api/orders/:id`。Schema.parse() で更新後 Order 検証・無効遷移 400。`pnpm test:integration:only tests/integration/domains/orders/us4/ 2>&1` で FAIL 確認
- [ ] T038 [US4] `tests/e2e/orders-us4.spec.ts` を作成 (AC-1, AC-2, AC-3, AC-5, AC-6)。管理者一覧表示・フィルタ・ステータス更新・buyer の管理画面アクセス拒否。`pnpm test:e2e --retries 0 tests/e2e/orders-us4.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T039 [US4] `src/domains/orders/api/index.ts` の `updateOrderStatus` を実装（`OrderStateMachine.transition()` 使用・authorize admin・NotFoundError）。`pnpm test:unit:only tests/unit/domains/orders/us4/ 2>&1` で PASS 確認
- [ ] T040 [US4] `src/app/admin/orders/page.tsx` を実装（サンプル `src/app/(samples)/sample/admin/orders/page.tsx` 参照・`/api/orders` useFetch・ステータスフィルタ・ページネーション・`loginUrl: '/admin/login'`）
- [ ] T041 [US4] `src/app/admin/orders/[id]/page.tsx` を実装（サンプル参照・`useFetch<Order>` + ステータス更新 PATCH・`OrderStateMachine.getAllowedTransitions()` でセレクト選択肢生成・`loginUrl: '/admin/login'`）。`pnpm test:e2e -x tests/e2e/orders-us4.spec.ts 2>&1` で PASS 確認
- [ ] T042 [US4] `src/app/admin/nav.ts` に注文管理リンク `{ href: '/admin/orders', label: '注文管理' }` を追加

### Refactor

- [ ] T043 [US4] US4 で変更した全ファイルを Read しレビュー → リファクタリング。`pnpm test:unit:only tests/unit/domains/orders/us4/ && pnpm test:integration:only tests/integration/domains/orders/us4/ && pnpm test:e2e -x tests/e2e/orders-us4.spec.ts 2>&1` で PASS 確認

---

## フェーズ 7: US5 - アクセス制御とリダイレクト (優先度: P5)

**ゴール**: 未ログインユーザーがログインページにリダイレクトされ、ログイン後に元ページへ復帰する
**独立テスト**: 未ログインで /checkout・/orders・/orders/:id にアクセス → ログインページへリダイレクト

### Red

⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」

- [ ] T044 [US5] `tests/e2e/orders-us5.spec.ts` を作成 (AC-1, AC-2, FR-014)。未ログイン → /checkout・/orders・/orders/:id → ログインページリダイレクト・ログイン後元ページ復帰。`pnpm test:e2e --retries 0 tests/e2e/orders-us5.spec.ts 2>&1` で FAIL 確認

### Green

- [ ] T045 [US5] `src/app/(buyer)/checkout/page.tsx`・`src/app/(buyer)/orders/page.tsx`・`src/app/(buyer)/orders/[id]/page.tsx` の `useFetch` に `loginUrl: '/login'` が設定されていることを確認し、未設定なら追加する (FR-014)
- [ ] T046 [US5] `src/app/(buyer)/nav.ts` に注文履歴リンク `{ href: '/orders', label: '注文履歴' }` を追加。`pnpm test:e2e -x tests/e2e/orders-us5.spec.ts 2>&1` で PASS 確認

### Refactor

- [ ] T047 [US5] US5 で変更した全ファイルを Read しレビュー → リファクタリング（必要があれば）。`pnpm test:e2e -x tests/e2e/orders-us5.spec.ts 2>&1` で PASS 確認

---

## 最終フェーズ: ポリッシュ & クロスカット

- [ ] T048 TypeScript 型チェック: `pnpm tsc --noEmit 2>&1` でエラー 0件を確認し、あれば修正
- [ ] T049 ESLint: `pnpm lint 2>&1` でエラー 0件を確認し、あれば修正
- [ ] T050 全件単体テスト: `pnpm test:unit 2>&1` で全テスト PASS 確認
- [ ] T051 全件統合テスト: `pnpm test:integration 2>&1` で全テスト PASS 確認
- [ ] T052 全件 E2E（リグレッション検出）: `pnpm test:e2e 2>&1` で全テスト PASS 確認（Bash timeout: 120000ms）

---

## 依存関係と実行順序

### フェーズ依存関係

- **フェーズ 1**: 依存なし（即時開始可能）
- **フェーズ 2**: フェーズ 1 完了後 → 全 US をブロック
- **フェーズ 2b**: フェーズ 2 完了後 → 全 US の Red をブロック
- **フェーズ 3〜7（US1〜US5）**: フェーズ 2b 完了後 → 優先度順に順次実行
- **最終フェーズ**: 全 US 完了後

### US 内の依存関係

- **Red（テスト作成）→ Green（実装）→ Refactor（改善）** の順を厳守
- Green ではテストコード変更禁止（実装コードのみで PASS させる）
- US1 の state-machine.ts（T013/T014）は US4 の updateOrderStatus でも使用する
- US2（OrderList）→ US2 の E2E で注文クリック → US3 の詳細ページへの遷移テストを含む

### 並列実行可能なタスク

- T002・T003（フェーズ 2）: 独立して並列実行可
- T009・T010・T011（US1 Red）: 並列実行可 [P]
- T019・T020（US2 Red）: 並列実行可 [P]
- T027・T028（US3 Red）: 並列実行可 [P]
- T035・T036・T037（US4 Red）: 並列実行可 [P]

---

## 実装戦略

### MVP（US1 のみ）

1. フェーズ 1・2・2b 完了
2. US1 完了（カートから注文確定まで）
3. **停止して検証**: 注文作成・完了画面・カートクリアを独立テスト
4. デモ可能な状態

### 段階的デリバリー

1. フェーズ 1・2・2b → 基盤完成
2. US1 → 注文確定（MVP）
3. US2 → 注文履歴一覧
4. US3 → 注文詳細
5. US4 → 管理者管理（フル機能完成）
6. US5 → アクセス制御確認
7. 最終フェーズ → 全件テスト・ポリッシュ

---

## タスク数サマリー

| フェーズ | タスク数 |
|---------|---------|
| フェーズ 1（セットアップ） | 1 |
| フェーズ 2（基盤） | 2 |
| フェーズ 2b（スキャフォールディング） | 5 |
| フェーズ 3（US1） | 10 |
| フェーズ 4（US2） | 8 |
| フェーズ 5（US3） | 8 |
| フェーズ 6（US4） | 9 |
| フェーズ 7（US5） | 4 |
| 最終フェーズ | 5 |
| **合計** | **52** |
