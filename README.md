# EC Site Architecture Template

ECサイト開発のためのアーキテクチャ基盤テンプレートです。
speckitと組み合わせてAI駆動開発を行うことを想定しています。

## 特徴

- **認証・認可基盤**: セッション管理、RBAC（buyer/admin）、CSRF対策
- **共有UIコンポーネント**: レイアウト、フォーム、フィードバック、ナビゲーション、データ表示（DataView）、カスタムフック（useFetch, useFormSubmit）、ユーティリティ
- **APIテンプレート**: ルートハンドラー（createRouteHandler）、認証ハンドラー、DTO
- **テストパターン**: 単体・統合・E2Eのサンプル実装
- **品質ゲート**: TypeScript strict、ESLint、カバレッジ80%
- **speckit連携**: AI駆動開発のためのテンプレートと設定

## 技術スタック

- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Zod (バリデーション)
- Vitest (単体・統合テスト)
- Playwright (E2Eテスト)

## 前提条件

- Node.js 18以上
- pnpm
- Claude Code（speckitコマンド実行用）

---

## クイックスタート

```bash
# 1. GitHubリポジトリをクローン
git clone <your-repo-url>
cd <your-repo>

# 2. speckit初期化（既存リポジトリ内で実行）
specify init --here --ai claude

# 3. アーキテクチャコードの展開（リリースZIPをリポジトリルートに解凍）
unzip ec-site-arch.zip -d .

# 4. プロジェクト憲法の作成（Claude Codeで実行）
/speckit.constitution
```

`/speckit.constitution` でプロジェクト固有の情報を入力すると、
セットアップ手順やアーキテクチャの使い方を含む憲法が作成されます。

詳細は `docs/examples/constitution-example.md` を参照してください。

---

## ディレクトリ構成

```
src/
├── middleware.ts         # Next.js ミドルウェア（認証・認可の二重防御）
├── app/                 # Next.js App Router
│   ├── (buyer)/         # 購入者画面（@/domains/ に依存、スタブ状態）
│   │   ├── loading.tsx  # 購入者ページ共通ローディング（Next.js Suspense boundary）
│   │   ├── logout/      # 購入者ログアウトページ（callbackUrl で元ページにリダイレクト）
│   │   └── nav.ts      # 購入者ナビリンク設定（ドメイン実装時にエントリ追加）
│   ├── admin/           # 管理者画面（@/domains/ に依存、スタブ状態）
│   │   ├── loading.tsx  # 管理者ページ共通ローディング（Next.js Suspense boundary）
│   │   ├── login/       # 管理者ログインページ
│   │   ├── logout/      # 管理者ログアウトページ
│   │   └── nav.ts      # 管理者ナビリンク設定（ドメイン実装時にエントリ追加）
│   ├── api/             # 本番 API Routes（@/domains/ に依存、501 応答）
│   └── (samples)/sample/  # サンプル画面・API（@/samples/ に依存）
├── components/          # 共有 UI コンポーネント・フック・ユーティリティ
│   ├── auth/            # Forbidden（認可エラー表示）
│   ├── layout/          # Layout, Header, Footer + NavLink 型
│   ├── layouts/         # AdminLayout, BuyerLayout（ロール別レイアウト、callbackUrl 付きログアウト）
│   ├── pages/           # LoginPage, LogoutPage（画面テンプレート、callbackUrl リダイレクト対応）
│   ├── feedback/        # AlertBanner, Toast, ConfirmDialog, Loading/Error/Empty
│   ├── form/            # Button, FormField, TextInput, TextArea, Select, SearchBar
│   ├── product/         # ProductCard, ImagePlaceholder, QuantitySelector
│   ├── navigation/      # BackButton, Pagination（PaginationData 型）
│   ├── data-display/    # StatusBadge, orderStatusLabels/Colors, DataView
│   ├── hooks/           # useFetch, useFormSubmit
│   ├── utils/           # formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated
│   └── index.ts         # バレルエクスポート（利用可能モジュールのカタログ）
├── contracts/           # 共有インターフェース（DTO・リポジトリ契約）
├── domains/             # ドメイン実装（NotImplementedError スタブ → 本番実装に置換）
├── foundation/          # 共通基盤（認証・エラー・ログ・バリデーション）
├── infrastructure/      # インフラ層実装（@/contracts/ に依存）
│   ├── id.ts            # generateId() — UUID 生成共通ユーティリティ
│   ├── store.ts         # createStore<T>() — HMR 対応インメモリストア
│   ├── auth/            # セッション管理
│   └── repositories/    # リポジトリ実装（cart, order, product）
├── samples/             # サンプル実装（独立した参照コード、凍結）
│   ├── contracts/       # サンプルインターフェース（凍結・読取専用）
│   ├── domains/         # ドメインサンプル（catalog, cart, orders）
│   ├── infrastructure/  # サンプルリポジトリ実装（凍結・読取専用）
│   └── tests/           # サンプルテスト（本番テストから分離）
│       ├── unit/        # サンプル単体テスト
│       ├── integration/ # サンプル統合テスト
│       └── e2e/         # サンプルE2Eテスト
└── templates/           # テンプレート（ファクトリ関数・スキーマ）
    ├── api/             # createRouteHandler(), createLoginHandler/LogoutHandler/SessionHandler
    └── infrastructure/  # createHmrSafeStore, createHmrSafeUserStore, createSessionManager, createResetHandler

tests/
├── e2e/                 # 本番 E2Eテスト（Playwright）
├── integration/         # 統合テスト
│   ├── domains/         # ドメイン実装の統合テスト
│   ├── foundation/      # 共通基盤の統合テスト
│   └── templates/       # テンプレートの統合テスト
└── unit/                # 単体テスト
    ├── components/      # 共有コンポーネントの単体テスト（hooks, feedback, navigation, utils）
    ├── domains/         # ドメイン実装の単体テスト
    ├── foundation/      # 共通基盤の単体テスト
    └── templates/       # テンプレートの単体テスト（api, infrastructure）
```

### 依存関係

```
本番:     src/app/(buyer)/, admin/, api/  ──→ @/domains/ （スタブ → 本番実装に置換）
サンプル: src/app/(samples)/sample/       ──→ @/samples/domains/ （独立した参照実装）
インフラ: src/infrastructure/             ──→ @/contracts/ （共有インターフェースのみ）
サンプル: src/samples/                    ──→ @/contracts/ （独立した参照コード）
```

- `src/app/(buyer)/` と `src/app/admin/` のページは `@/domains/` 経由でドメインロジックをインポートします
- `src/app/api/` の API Routes も `@/domains/` をインポートし、スタブ状態では 501 を返します
- `src/app/(samples)/sample/` のサンプル画面は `@/samples/domains/` を直接インポートします
- `src/infrastructure/` は `@/contracts/` の共有インターフェースのみに依存します
- `src/domains/` は NotImplementedError スタブです（`@/samples/` への依存はありません）。本番実装で置き換えてください

> **アーキテクチャ保護ルール**: `src/foundation/`, `src/templates/`, `src/components/` は共有基盤として改変禁止・新規追加禁止（import のみ許可）。`src/contracts/` は本番専用（自由に変更可）。`src/infrastructure/` は本番専用（自由に変更可）。`src/samples/contracts/`, `src/samples/infrastructure/` はサンプル専用（凍結・読取専用）。プロジェクトルート設定ファイル（`tsconfig.json`, `next.config.*` 等）は改変禁止。`src/samples/`, `src/app/(samples)/` は改変禁止。変更が許可される範囲: `src/domains/`（スタブ→本番実装への置換）、`src/contracts/`、`src/infrastructure/`、`src/app/` 配下（samples 除く）、`tests/`。

### サンプル実装

`src/samples/domains/` に以下のサンプル実装があります：

| ドメイン | 機能 |
|---------|------|
| Catalog | 商品一覧・詳細、検索・フィルタ |
| Cart | 商品追加・削除、数量変更 |
| Orders | 注文作成、注文履歴 |

サンプルは独立した参照コードです。`src/samples/contracts/` と `src/samples/infrastructure/` に依存しており、本番の `src/contracts/` や `src/infrastructure/` には依存しません。サンプル画面は `/sample/` URL配下（`src/app/(samples)/sample/`）でアクセスできます。

---

## 本番実装への移行

本番ページ・API Routes は既に配置済みです。`src/domains/` のスタブを置き換えるだけで動作します。

### 1. ドメインスタブの置き換え

```typescript
// 置き換え前（スタブ）: src/domains/catalog/api/index.ts
export function getProducts(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProducts');
}

// 置き換え後（本番実装）: src/domains/catalog/api/index.ts
// NotImplementedError → 本番ロジックに直接置換（index.ts 単体方式）
export async function getProducts(
  rawInput: unknown,
  context: CatalogContext,
): Promise<GetProductsOutput> {
  const input = validate(GetProductsInputSchema, rawInput);
  // ... 本番ロジック
}
```

- API スタブ（`src/domains/*/api/index.ts`）: NotImplementedError → 本番ロジックに直接置換（`index.ts` 単体方式）
- UI スタブ（`src/domains/*/ui/index.tsx`）: プレースホルダー → コンポーネントに置換

### 2. ナビゲーションの有効化

`nav.ts` にナビリンクを追加します。

```typescript
// src/app/(buyer)/nav.ts
import type { NavLink } from '@/components/layout/Header';

export const buyerNavLinks: NavLink[] = [
  { href: '/catalog', label: '商品一覧' },  // エントリ追加
  { href: '/cart', label: 'カート' },
  { href: '/orders', label: '注文履歴' },
];
```

管理者側も同様に `src/app/admin/nav.ts` にエントリを追加します。

### 3. テストの配置

```
tests/e2e/           ← 本番 E2Eテスト
tests/unit/domains/  ← 本番 単体テスト
tests/integration/domains/ ← 本番 統合テスト
```

### 4. サンプルの削除（任意）

```bash
rm -rf src/samples/ src/app/\(samples\)/
```

詳細は上記「ディレクトリ構成」セクションを参照してください。

---

## 開発ワークフロー（speckit連携）

```bash
# 機能仕様を作成
/speckit.specify "ユーザー管理機能を追加"

# 仕様の曖昧さを解消（任意）
/speckit.clarify

# 実装計画を作成
/speckit.plan

# タスクを生成
/speckit.tasks

# 実装を開始
/speckit.implement
```

---

## テスト

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト（基盤スモークテスト + ドメイン実装テスト）
pnpm test:e2e
```

> **E2E テスト前提条件**: ローカル環境では `pnpm test:e2e` 実行時に `pretest:e2e` スクリプトが Chromium を自動インストールします。手動でのブラウザインストールは不要です。CI 環境では `.github/workflows/ci.yml` で `playwright install --with-deps`（OS 依存ライブラリ込み）を別途実行しています。Playwright 設定で `--disable-dev-shm-usage` を有効化しており、`/dev/shm` が小さい環境でもクラッシュを防止します。

---

## ドキュメント

- [SPECKIT_INTEGRATION.md](docs/SPECKIT_INTEGRATION.md) - speckit連携ガイド
- [SPECKIT_CUSTOM_CHANGES.md](docs/SPECKIT_CUSTOM_CHANGES.md) - speckitカスタマイズ変更一覧
- [constitution-example.md](docs/examples/constitution-example.md) - 憲法の入力例
- [spec-catalog-example.md](docs/examples/spec-catalog-example.md) - 商品カタログ仕様の例
- [spec-cart-example.md](docs/examples/spec-cart-example.md) - カート仕様の例
- [spec-order-example.md](docs/examples/spec-order-example.md) - 注文仕様の例
- [spec-product-example.md](docs/examples/spec-product-example.md) - 商品管理仕様の例

---

## ライセンス

MIT
