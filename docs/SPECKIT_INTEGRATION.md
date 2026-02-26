# Speckit連携ガイド

このアーキテクチャテンプレートをspeckitで使用する方法を説明します。

## 関連ドキュメント

- [README.md](../README.md) - セットアップ手順・アーキテクチャ概要
- [constitution-example.md](./examples/constitution-example.md) - `/speckit.constitution` の入力例
- [spec-template.md](./examples/spec-template.md) - 機能仕様のテンプレート例

---

## 1. セットアップフロー

```
1. git clone <your-repo-url>               # GitHubリポジトリをクローン
2. cd <your-repo>                          # リポジトリのルートに移動
3. specify init --here --ai claude         # speckit設定を初期化
4. ec-site-arch.zip 解凍                    # アーキテクチャコードを展開（.specify/templates/ を上書き）
5. /speckit.constitution                   # プロジェクト憲法を作成（セットアップ手順を含む）
6. 開発開始
```

> **注意**: 手順 3 → 4 の順序が重要です。`specify init` で作成される `.specify/templates/` は ZIP 展開時に上書きされ、品質ガード付きのテンプレートが適用されます。

### ディレクトリ構成

```
リポジトリのルート/
├── .claude/
│   └── commands/           ← specify init で作成（スキル定義）
│       ├── speckit.specify.md
│       ├── speckit.plan.md
│       ├── speckit.tasks.md
│       ├── speckit.implement.md
│       └── ...
│
├── .github/
│   └── agents/             ← ZIP から展開（Copilot 用エージェント定義）
│       ├── speckit.specify.agent.md
│       └── ...
│
├── .specify/               ← specify init で作成 → ZIP 展開で templates/ を上書き
│   ├── memory/
│   │   └── constitution.md ← /speckit.constitution で作成
│   └── templates/          ← ZIP から展開（品質ガード付きタスクテンプレート）
│
├── src/                    ← ZIP から展開
│   ├── middleware.ts       # Next.js ミドルウェア（認証・認可の二重防御）
│   ├── app/                # Next.js App Router
│   │   ├── (buyer)/        #   購入者画面（@/domains/ に依存、スタブ状態）
│   │   │   ├── loading.tsx #   購入者ページ共通ローディング（Next.js Suspense boundary）
│   │   │   ├── logout/     #   ログアウトページ（callbackUrl で元ページにリダイレクト）
│   │   │   └── nav.ts     #   購入者ナビリンク設定（ドメイン実装時にエントリ追加）
│   │   ├── admin/          #   管理者画面（@/domains/ に依存、スタブ状態）
│   │   │   ├── loading.tsx #   管理者ページ共通ローディング（Next.js Suspense boundary）
│   │   │   ├── login/      #   管理者ログインページ
│   │   │   ├── logout/     #   管理者ログアウトページ
│   │   │   └── nav.ts     #   管理者ナビリンク設定（ドメイン実装時にエントリ追加）
│   │   ├── api/            #   本番 API Routes（@/domains/ に依存、501 応答）
│   │   └── (samples)/sample/  # サンプル画面・API（@/samples/ に依存）
│   ├── components/         # 共有 UI コンポーネント・フック・ユーティリティ
│   │   ├── hooks/          #   useFetch, useFormSubmit
│   │   ├── navigation/     #   BackButton, Pagination（PaginationData 型）
│   │   ├── feedback/       #   AlertBanner, Toast, ConfirmDialog, Loading/Error/Empty
│   │   ├── data-display/   #   StatusBadge, orderStatusLabels/Colors, DataView
│   │   ├── form/           #   Button, FormField, TextInput, TextArea, Select, SearchBar
│   │   ├── product/        #   QuantitySelector, ImagePlaceholder
│   │   ├── layouts/        #   AdminLayout, BuyerLayout（ロール別レイアウト）
│   │   ├── pages/          #   LoginPage, LogoutPage（画面テンプレート）
│   │   ├── utils/          #   formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated
│   │   └── index.ts        #   バレルエクスポート（利用可能モジュールのカタログ）
│   ├── contracts/          # 本番インターフェース（DTO・リポジトリ契約、自由に変更可）
│   ├── domains/            # ドメイン実装（NotImplementedError スタブ → 本番置換）
│   │   ├── catalog/        #   api/index.ts（スタブ）, ui/index.tsx（スタブ）
│   │   ├── cart/           #   同上
│   │   └── orders/         #   同上
│   ├── foundation/         # 共通基盤（認証・エラー・ログ・バリデーション）
│   ├── infrastructure/     # 本番インフラ層（@/contracts/ に依存、自由に変更可）
│   │   ├── id.ts           #   generateId() — UUID 生成共通ユーティリティ
│   │   ├── store.ts        #   createStore<T>() — HMR 対応インメモリストア
│   │   ├── auth/           #   セッション管理
│   │   └── repositories/   #   リポジトリ実装（cart, order, product）
│   ├── samples/            # サンプル実装（独立した参照コード、凍結）
│   │   ├── contracts/      #   サンプル専用インターフェース（凍結・読取専用）
│   │   ├── infrastructure/ #   サンプル専用リポジトリ実装（凍結・読取専用）
│   │   ├── domains/        #   catalog, cart, orders のサンプル実装
│   │   └── tests/          #   サンプルテスト（unit, integration, e2e）
│   └── templates/          # テンプレート（ファクトリ関数・スキーマ）
│       ├── api/            #   createRouteHandler(), createLoginHandler/LogoutHandler/SessionHandler
│       ├── infrastructure/ #   createHmrSafeStore, createHmrSafeUserStore, createSessionManager, createResetHandler
│       └── index.ts        #   バレルエクスポート
│
├── tests/                  ← ZIP から展開
│   ├── e2e/                #   本番 E2Eテスト（Playwright）— smoke.spec.ts 初期同梱
│   ├── integration/        #   統合テスト（domains, foundation, templates）
│   │   ├── domains/
│   │   ├── foundation/
│   │   └── templates/
│   └── unit/               #   単体テスト（domains, foundation, templates）
│       ├── components/
│       ├── domains/
│       ├── foundation/
│       └── templates/
│
├── docs/                   ← ZIP から展開
└── package.json            ← ZIP から展開
```

> **保護レベル**: `src/foundation/`, `src/templates/`, `src/components/` = 共有基盤・改変禁止・新規追加禁止（import のみ許可） | `src/contracts/` = 本番専用・自由に変更可 | `src/infrastructure/` = 本番専用・自由に変更可 | `src/samples/contracts/`, `src/samples/infrastructure/` = サンプル専用・凍結・読取専用 | `src/domains/` = 変更許可（スタブ→本番置換） | `src/app/` = 変更許可（samples 除く） | `tests/` = 変更許可

---

## 2. 開発ワークフロー

### 新機能を追加する場合

```bash
# 1. 機能仕様を作成
/speckit.specify "ユーザープロフィール機能を追加"

# 2. 仕様の曖昧さを解消（任意）
/speckit.clarify

# 3. 実装計画を作成
/speckit.plan

# 4. タスクを生成
/speckit.tasks

# 5. 実装を開始
/speckit.implement
```

### 機能仕様の例

`/speckit.specify` を実行すると、以下のような仕様書が生成されます：

```markdown
# Feature: ユーザープロフィール

## 概要
ユーザーが自分のプロフィール情報を閲覧・編集できる機能

## ユーザーストーリー
- As a buyer, I want to view my profile, so that I can check my information
- As a buyer, I want to edit my profile, so that I can update my information

## 機能要件

### FR-001: プロフィール表示
- 説明: ログインユーザーが自分のプロフィールを閲覧できる
- 優先度: Must
- 関連UI: `src/domains/profile/ui/ProfileView.tsx`
- 関連API: `GET /api/profile`
```

---

## 3. アーキテクチャとの対応表

### コンポーネントとテンプレートの違い

| | コンポーネント (`src/components/`) | テンプレート (`src/templates/`) |
|---|---|---|
| **役割** | ランタイムで使用する UI 部品・フック・ユーティリティ | ファクトリ関数（インスタンス生成パターン） |
| **利用場所** | ドメイン UI (`src/domains/*/ui/`)、ページ (`src/app/`) | API Route (`src/app/api/`)、インフラ (`src/infrastructure/`) |
| **依存制約** | `@/contracts/` への import 禁止（props で受け取る） | `@/contracts/` への import 禁止（呼び出し側がマッピング） |
| **バレル** | `src/components/index.ts` | `src/templates/index.ts` |
| **保護レベル** | 改変禁止・import のみ許可 | 改変禁止・import のみ許可 |

### 共有コンポーネント（`src/components/`）

| カテゴリ | モジュール | パス |
|---------|-----------|------|
| レイアウト | Layout, Header, Footer + NavLink 型 | `@/components/layout/` |
| レイアウトテンプレート | AdminLayout, BuyerLayout | `@/components/layouts/` |
| ページ | LoginPage, LogoutPage, isAdmin, isBuyer, allowAny | `@/components/pages/` |
| 認証 | Forbidden | `@/components/auth/` |
| フィードバック | Loading, Error, Empty, ConfirmDialog, AlertBanner, ToastProvider, useToast | `@/components/feedback/` |
| 商品 | ProductCard, ImagePlaceholder, QuantitySelector | `@/components/product/` |
| フォーム | Button, FormField, TextInput, TextArea, Select, SearchBar + ButtonProps 型 | `@/components/form/` |
| ナビゲーション | Pagination, BackButton + PaginationData 型 | `@/components/navigation/` |
| データ表示 | StatusBadge, orderStatusLabels, orderStatusColors, DataView + DataViewProps 型 | `@/components/data-display/` |
| フック | useFetch, useFormSubmit | `@/components/hooks/` |
| ユーティリティ | formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated | `@/components/utils/` |

### テンプレート（`src/templates/`）

| カテゴリ | モジュール | パス |
|---------|-----------|------|
| API ルートハンドラ | createRouteHandler + CreateRouteHandlerOptions, RouteHandlerContext, RouteSession 型 | `@/templates/api/route-handler` |
| 認証 API | createLoginHandler, createLogoutHandler, createSessionHandler | `@/templates/api/auth` |
| インフラ | createHmrSafeStore, createHmrSafeUserStore, createSessionManager, createResetHandler + UserTypeConfig 型 | `@/templates/infrastructure/` |

> **共通モジュール発見**: `src/components/index.ts` と `src/templates/index.ts` のバレルエクスポートが正規カタログ。実装時はこれを Read して利用可能モジュールを把握する。

### 認証・認可

| 要件 | 実装 |
|-----|------|
| API ルート認証必須 | `createRouteHandler({ getSession, requireAuth: true })` |
| API ルート認証不要 | `createRouteHandler({ getSession, requireAuth: false })` |
| ドメイン層で管理者のみ | `authorize(context.session, 'admin')` |
| ドメイン層で購入者のみ | `authorize(context.session, 'buyer')` |
| ミドルウェア保護 | `src/middleware.ts` で BUYER_PATHS / ADMIN_PATHS を設定 |

---

## 4. タスク生成の指針

`/speckit.tasks` はTDD（Red → Green → Refactor）ワークフローに沿ったタスクを生成します。
既存ドメイン（catalog, cart, orders）には本番ページ・API Routes が配置済みで、`@/domains/` のスタブを置換すれば動作します。

### フェーズ構成

```
フェーズ 1: セットアップ（pnpm install 等）
フェーズ 2: 基盤整備（contracts, infrastructure の変更）
フェーズ 2b: スキャフォールディング（全ユーザーストーリー分のスタブ一括生成）
フェーズ 3+: ユーザーストーリー（優先度順、各ストーリーで Red → Green → Refactor）
フェーズ N: ポリッシュ（ナビリンク追加、全体リグレッションテスト）
```

### Phase 2b スキャフォールディングの構成

1. **前準備**: `src/components/index.ts`, `src/templates/index.ts`, サンプル API Route を Read
2. **API Route**: `createRouteHandler()` パターンに書き換え（手書き try-catch 禁止）
3. **ドメインスタブ**: `throw new NotImplementedError()`（JSX 返却禁止）+ `// @see barrel:` コメント
4. **page.tsx**: 既存はコンテナラッパー維持、新規はコンテナ + import 形式

### ナビゲーション

ナビリンクは `nav.ts` で管理します（layout.tsx にハードコードしない）。

```typescript
// src/app/(buyer)/nav.ts — ドメイン実装時にエントリ追加
export const buyerNavLinks: NavLink[] = [
  { href: '/catalog', label: '商品一覧' },
];
```

管理者側も同様に `src/app/admin/nav.ts` にエントリを追加します。

> **ポイント**: 本番ページ（`src/app/(buyer)/catalog/page.tsx` 等）と API Routes（`src/app/api/catalog/products/route.ts` 等）は
> 既に `@/domains/` をインポートしているため、スタブ置換後は自動的に動作します。

---

## 5. サンプル実装の参照

speckitで実装する際は、独立した参照コードであるサンプル実装を参考にしてください。
サンプルは `@/samples/contracts/` と `@/samples/infrastructure/` に依存しており、本番コード（`@/contracts/`, `@/infrastructure/`）から完全に分離されています。

### Catalogドメイン（商品管理）
- 一覧・詳細表示
- 検索・フィルタ
- ページネーション

参照: `src/samples/domains/catalog/`

### Cartドメイン（カート）
- 商品追加・削除
- 数量変更
- 合計計算

参照: `src/samples/domains/cart/`

### Ordersドメイン（注文）
- 注文作成
- 注文履歴
- ステータス管理

参照: `src/samples/domains/orders/`

### 本番実装のパス

実装は `src/domains/` に配置します。既存ドメイン（catalog, cart, orders）の場合：

- **本番ページ**（`src/app/(buyer)/`, `src/app/admin/`）は配置済みで `@/domains/` をインポート
- **本番 API Routes**（`src/app/api/`）も配置済みで `@/domains/` をインポート（スタブ状態では 501 応答）
- **スタブ**（`src/domains/*/api/index.ts`, `src/domains/*/ui/index.tsx`）を本番実装に置き換えてください
- **ナビリンク**は `nav.ts`（`src/app/(buyer)/nav.ts`, `src/app/admin/nav.ts`）にエントリを追加してください

---

## 6. 品質基準

speckit仕様に以下の品質基準が適用されます：

### テスト
- 単体テストカバレッジ: 80%以上（各ユーザーストーリー完了時に `pnpm test:unit --coverage` で確認）
- E2Eテスト: 主要導線をカバー（本番: `tests/e2e/` 直下、サンプル: `src/samples/tests/e2e/`）。基盤スモークテスト（`smoke.spec.ts`）が初期同梱済み
  - テスト実行結果の出力を確認し、パス件数 0 件はエラーとする
  - 実装のみで実行スキップは不可
- サンプルリグレッション: CIでサンプルテスト（unit・integration）を自動実行。speckit 実装時（`/speckit.implement`）はサンプルテストを実行しない

### ストーリー完了ゲート
- ユーザーストーリーの検証フェーズ完了後、次のストーリーに着手する前に全テスト（ユニット・統合・E2E）のパスを確認する
- テスト失敗が 1 件でも残っている場合は次のストーリーに進まず修正する
- ゲート実行結果（パス件数・失敗件数・ストーリー番号）を証跡として記録する

### コード品質
- TypeScript: strictモード、エラー0件
- ESLint: エラー0件

### パフォーマンス
- 一覧ページ: 初回ロード 3秒以内
- API応答: 500ms以内

---

## 7. 憲法（constitution.md）について

`/speckit.constitution` を実行すると、プロジェクト固有の憲法が作成されます。

憲法には以下が含まれます：
- プロジェクト概要・技術スタック
- **アーキテクチャのセットアップ手順**（依存関係インストール、プロジェクト情報更新）
- アーキテクチャ原則
- 品質基準・テストコマンド
- ディレクトリ構成・命名規約
- 認証・認可パターン

憲法はspeckitの各コマンド（specify, plan, tasks, implement）で参照され、
一貫した実装を保証します。

入力例は `docs/examples/constitution-example.md` を参照してください。
