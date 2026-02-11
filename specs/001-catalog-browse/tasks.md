# タスク: カタログ閲覧機能

**入力**: `/specs/001-catalog-browse/` の設計ドキュメント
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: 必須 — 憲章（原則 III）は TDD 必須。各ユーザーストーリーは Red → Green → Refactor → 検証 の 4 ステップで実装する。

**構成**: タスクはユーザーストーリー単位でグループ化し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 所属するユーザーストーリー（例: US1, US2, US3）
- 各タスクに正確なファイルパスを含める

---

## Phase 1: セットアップ

**目的**: コントラクト拡張（全ストーリーの前提）

- [x] T001 ProductSchema に stock フィールド追加、GetProductsInputSchema に keyword フィールド追加、ProductRepository インターフェースに keyword パラメータ追加 in `src/contracts/catalog.ts`

---

## Phase 2: 基盤構築（ブロッキング前提条件）

**目的**: 全ユーザーストーリーの実装に必要なコアインフラストラクチャ

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの作業は開始不可

- [x] T002 [P] EXTENSION_PRODUCTS に20件以上の商品データ追加（Unsplash 画像 URL、stock バリエーション: 在庫あり17件・在庫切れ2件・画像未設定1件）+ productRepository.findAll/count に keyword 検索対応追加 in `src/infrastructure/repositories/product.ts`
- [x] T003 [P] 本番ユースケース作成（getProducts: 12件/ページ・published フィルタ・keyword 検索対応、getProductById: published チェック）in `src/domains/catalog/api/usecases.ts`
- [x] T004 [P] GET ハンドラに keyword パラメータの取得・受け渡し追加 in `src/app/api/catalog/products/route.ts`
- [x] T005 [P] navLinks の商品一覧リンク（`{ href: '/catalog', label: '商品一覧' }`）のコメント解除 in `src/app/(buyer)/layout.tsx`
- [x] T006 スタブを本番ユースケースのエクスポートに置換（T003 完了後） in `src/domains/catalog/api/index.ts`

**チェックポイント**: 基盤完了 — API が501ではなく正常レスポンスを返すことを確認

---

## Phase 3: ユーザーストーリー 1 - 商品一覧表示 (優先度: P1) 🎯 MVP

**ゴール**: 購入者が認証なしで商品一覧をカード形式で閲覧でき、12件/ページのページネーションで全商品を確認できる

**独立テスト**: `/catalog` にアクセスし、12件の商品カードが表示されること、ページネーションで次ページに遷移できること、在庫切れ商品に「在庫切れ」ラベルが表示されることを確認

### Red: テスト作成 (MANDATORY)

> **テスト種別**: 以下の 4 種別を必ず含める。テストは実装前に書き、全て FAIL することを確認する。
> - ユースケース単体テスト: getProducts のページネーション・buyer は published のみ・空結果
> - UI コンポーネント単体テスト: ProductCard（在庫切れラベル）・ProductList（グリッド・ページネーション・空状態）
> - API 統合テスト: GET /api/catalog/products（ページネーション・認証不要・published フィルタ）
> - E2E テスト: 商品一覧表示・ページネーション・在庫切れ・空状態

- [x] T007 [P] [US1] ユースケース単体テスト作成（getProducts: ページネーション付き商品リスト返却、buyer は published のみ取得、limit=12 のデフォルト動作、商品0件で空配列） in `tests/unit/domains/catalog/usecase.test.ts`
- [x] T008 [P] [US1] UI コンポーネント単体テスト作成（ProductCard: 商品画像・名前・価格・在庫切れラベル表示; ProductList: 12件グリッド表示・ページネーションボタン・「商品がありません」空状態・ローディング状態） in `tests/unit/domains/catalog/ui.test.tsx`
- [x] T009 [P] [US1] API 統合テスト作成（GET /api/catalog/products: 200 レスポンスで products 配列と pagination 返却、page/limit パラメータ動作、認証なしで published 商品のみ返却） in `tests/integration/domains/catalog/api.test.ts`
- [x] T010 [P] [US1] E2E テスト作成（/catalog アクセスで商品カード12件表示、ページネーション遷移、在庫切れ商品に「在庫切れ」表示、商品カードに画像・名前・価格含む） in `tests/e2e/catalog-browse.spec.ts`

### Green: 最小実装

- [x] T011 [P] [US1] ProductCard コンポーネント作成（商品画像・名前・価格表示、stock===0 で「在庫切れ」ラベル、画像未設定時プレースホルダー、詳細ページへのリンク） in `src/domains/catalog/ui/ProductCard.tsx`
- [x] T012 [P] [US1] ProductList コンポーネント作成（グリッド表示 sm:2列 lg:3列 xl:4列、ページネーション「前へ」「次へ」ボタン、Loading/Error/Empty 共通コンポーネント使用） in `src/domains/catalog/ui/ProductList.tsx`
- [x] T013 [US1] スタブを商品一覧ページコンポーネントに置換（/api/catalog/products からデータフェッチ、limit=12、ページ切替、ProductList に props 受け渡し）in `src/domains/catalog/ui/index.tsx`

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T014 [US1] リファクタリングと全テストパス確認（pnpm test:unit && pnpm test:integration）

### 検証: E2E テスト実行 + カバレッジ確認

> - E2E テスト実行結果を確認し、パス件数 0 件はエラーとする（実行スキップ不可）
> - `pnpm test:unit --coverage` でカバレッジ 80% 以上を確認する
> - 外部 URL を含む場合は HTTP リクエストで 200 応答を確認する（plan 時点では検証予定とし、検証済みとしない）

- [x] T015 [US1] E2E テスト実行（証跡付き）+ カバレッジ確認

**チェックポイント**: ユーザーストーリー 1 が独立して動作・テスト可能であること

---

## Phase 4: ユーザーストーリー 2 - 商品詳細表示 (優先度: P2)

**ゴール**: 購入者が商品詳細画面で商品画像・名前・価格・説明文・在庫数を確認でき、在庫あり商品をカートに追加できる

**独立テスト**: `/catalog/{id}` に直接アクセスし、商品情報が表示されること、在庫あり商品でカート追加ボタンが有効、在庫切れで無効化されること、画像未設定時にプレースホルダーが表示されることを確認

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T016 [P] [US2] ユースケース単体テスト追加（getProductById: 正常系で商品返却、存在しない ID で NotFoundError、buyer が draft 商品アクセスで NotFoundError） in `tests/unit/domains/catalog/usecase.test.ts`
- [x] T017 [P] [US2] UI コンポーネント単体テスト作成（ProductDetail: 商品画像・名前・価格・説明文・在庫数表示、stock===0 でカート追加ボタン disabled、画像未設定でプレースホルダー、カート追加クリックでコールバック発火） in `tests/unit/domains/catalog/ui.test.tsx`
- [x] T018 [P] [US2] API 統合テスト追加（GET /api/catalog/products/:id: 200 で商品データ返却、存在しない ID で 404、認証なしで published 商品のみ取得可能） in `tests/integration/domains/catalog/api.test.ts`
- [x] T019 [P] [US2] E2E テスト追加（商品詳細ページで情報表示、カート追加ボタンクリック、在庫切れ商品でボタン無効化、画像未設定でプレースホルダー表示） in `tests/e2e/catalog-browse.spec.ts`

### Green: 最小実装

- [x] T020 [US2] ProductDetail コンポーネント作成（商品画像・名前・価格・説明文・在庫数表示、stock===0 でカート追加ボタン disabled + 「在庫切れ」表示、画像未設定時プレースホルダー、戻るボタン、Loading/Error 共通コンポーネント使用） in `src/domains/catalog/ui/ProductDetail.tsx`
- [x] T021 [US2] スタブを商品詳細ページコンポーネントに置換（/api/catalog/products/:id からデータフェッチ、カート追加 API 連携 POST /api/cart/items、未ログイン時 /login リダイレクト） in `src/domains/catalog/ui/index.tsx`

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T022 [US2] リファクタリングと全テストパス確認（pnpm test:unit && pnpm test:integration）

### 検証: E2E テスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認

- [x] T023 [US2] E2E テスト実行（証跡付き）+ カバレッジ確認

**チェックポイント**: ユーザーストーリー 1 と 2 が共に独立して動作すること

---

## Phase 5: ユーザーストーリー 3 - 商品検索 (優先度: P3)

**ゴール**: 購入者がキーワードで商品名・説明文を検索でき、該当なし時にメッセージ表示、クリアで全商品一覧に戻れる

**独立テスト**: 商品一覧ページの検索フォームにキーワードを入力し、一致商品のみ表示されること、該当なしメッセージ、クリアで全件表示に戻ることを確認

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T024 [P] [US3] ユースケース単体テスト追加（getProducts with keyword: 商品名部分一致で絞り込み、説明文部分一致で絞り込み、該当なしで空配列、空キーワードで全件返却） in `tests/unit/domains/catalog/usecase.test.ts`
- [x] T025 [P] [US3] UI コンポーネント単体テスト作成（SearchBar: キーワード入力・検索実行コールバック・クリアボタンでコールバック発火・空文字でクリア動作） in `tests/unit/domains/catalog/ui.test.tsx`
- [x] T026 [P] [US3] API 統合テスト追加（GET /api/catalog/products?keyword=xxx: 検索結果返却・該当なしで空配列・ページネーションとの組み合わせ） in `tests/integration/domains/catalog/api.test.ts`
- [x] T027 [P] [US3] E2E テスト追加（検索フォーム入力で絞り込み表示、該当なしで「該当する商品が見つかりません」メッセージ、クリアで全商品一覧に復帰） in `tests/e2e/catalog-browse.spec.ts`

### Green: 最小実装

- [x] T028 [US3] SearchBar はテンプレート `@/templates/ui/components/form/SearchBar` を使用（憲章原則 IV: 共通UIコンポーネント利用義務）
- [x] T029 [US3] 商品一覧ページに SearchBar 統合（keyword 状態管理、keyword パラメータ付き API 呼び出し、検索時ページ1にリセット、該当なしメッセージ表示） in `src/domains/catalog/ui/index.tsx`

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T030 [US3] リファクタリングと全テストパス確認（pnpm test:unit && pnpm test:integration）

### 検証: E2E テスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認

- [x] T031 [US3] E2E テスト実行（証跡付き）+ カバレッジ確認

**チェックポイント**: 全ユーザーストーリーが独立して動作すること

---

## Phase 6: 仕上げ・横断的品質確認

**目的**: 全ストーリーにまたがる品質確認と最終検証

- [x] T032 [P] サンプルテストリグレッション確認（pnpm test:unit:samples && pnpm test:integration:samples）
- [x] T033 [P] TypeScript strict モードエラー 0 件確認（pnpm tsc --noEmit）
- [x] T034 [P] ESLint エラー 0 件確認（pnpm lint）
- [x] T035 外部リソース検証（EXTENSION_PRODUCTS の全 Unsplash URL に HTTP リクエスト送信、200 応答を確認、失敗 URL は代替 URL に置換）
- [x] T036 quickstart.md 検証（手順通りの動作確認）

---

## 依存関係と実行順序

### フェーズ依存

- **セットアップ (Phase 1)**: 依存なし — 即時開始可能
- **基盤構築 (Phase 2)**: Phase 1 完了に依存 — 全ユーザーストーリーをブロック
- **ユーザーストーリー (Phase 3-5)**: Phase 2 完了に依存
  - 優先度順に P1 → P2 → P3 で実行
  - US2 は US1 の ProductCard を利用するため US1 完了後に開始
  - US3 は US1 の一覧ページに SearchBar を統合するため US1 完了後に開始
- **仕上げ (Phase 6)**: 全ユーザーストーリー完了に依存

### ユーザーストーリー依存

- **US1 (P1)**: Phase 2 完了後に開始 — 他ストーリーへの依存なし
- **US2 (P2)**: US1 完了後に開始 — ProductCard コンポーネントを共有
- **US3 (P3)**: US1 完了後に開始 — 一覧ページに SearchBar を統合

### 各ストーリー内の順序

- **Red**: テストを先に書き、FAIL することを確認する（MANDATORY）
- **Green**: テストをパスさせる最小限の実装
- **Refactor**: 重複排除・命名改善・責務分離（全テストパスを検証）
- **検証**: E2E テスト実行（証跡付き）+ カバレッジ 80% 以上確認

### 並列実行の機会

- Phase 2: T002, T003, T004, T005 は並列実行可能（異なるファイル）
- US1 Red: T007, T008, T009, T010 は並列実行可能
- US1 Green: T011, T012 は並列実行可能（T013 はこれらに依存）
- US2 Red: T016, T017, T018, T019 は並列実行可能
- US3 Red: T024, T025, T026, T027 は並列実行可能
- Phase 6: T032, T033, T034 は並列実行可能

---

## 並列実行例: ユーザーストーリー 1

```bash
# Red: US1 の全テストを同時起動（MANDATORY）:
Task: "ユースケース単体テスト作成 in tests/unit/domains/catalog/usecase.test.ts"
Task: "UI コンポーネント単体テスト作成 in tests/unit/domains/catalog/ui.test.tsx"
Task: "API 統合テスト作成 in tests/integration/domains/catalog/api.test.ts"
Task: "E2E テスト作成 in tests/e2e/catalog-browse.spec.ts"

# Green: US1 のコンポーネントを同時作成:
Task: "ProductCard 作成 in src/domains/catalog/ui/ProductCard.tsx"
Task: "ProductList 作成 in src/domains/catalog/ui/ProductList.tsx"
# → 完了後: ページコンポーネント統合 in src/domains/catalog/ui/index.tsx
```

---

## 実装戦略

### MVP ファースト（ユーザーストーリー 1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤構築完了（重要 — 全ストーリーをブロック）
3. Phase 3: ユーザーストーリー 1（Red → Green → Refactor → 検証）
4. **停止・検証**: `/catalog` で12件表示・ページネーション・在庫切れ表示を確認
5. デプロイ/デモ可能

### インクリメンタルデリバリー

1. セットアップ + 基盤構築完了 → 基盤準備完了
2. US1 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ（MVP!）
3. US2 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ
4. US3 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ
5. 各ストーリーは前のストーリーを壊さずに価値を追加

---

## 備考

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルはタスクとユーザーストーリーのトレーサビリティを確保
- 各ユーザーストーリーは Red-Green-Refactor-検証 構造に従う
- Red フェーズのテストは Green 実装前に FAIL すること
- 検証フェーズ: E2E テスト実行証跡義務（パス件数 0 件はエラー）、カバレッジ 80% 以上確認
- 各タスクまたは論理グループの完了後にコミット
- チェックポイントで各ストーリーの独立動作を検証
- サンプルコード保護: contracts 変更は `.default()` / `.optional()` で互換性維持
