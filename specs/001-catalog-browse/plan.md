# 実装計画: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-11 | **仕様書**: [spec.md](./spec.md)
**入力**: `/specs/001-catalog-browse/spec.md` の機能仕様

## 概要

購入者が認証なしで商品カタログを閲覧できる機能を実装する。
商品一覧（12件/ページ、ページネーション）、商品詳細（在庫数・カート追加）、
キーワード検索の3つのユーザーストーリーで構成される。

既存のアーキテクチャテンプレート（スタブ置換パターン）に従い、
`src/domains/catalog/` のスタブを本番実装に置き換える。
コントラクトに `stock`（在庫数）と `keyword`（検索）フィールドを追加し、
Unsplash 画像URL付きの25件以上のシードデータを投入する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict mode)
**主要依存**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**ストレージ**: インメモリストア（`globalThis` + `Map<string, T>`）
**テスト**: Vitest 1.6（単体・統合）, Playwright 1.45（E2E）, React Testing Library 16
**対象プラットフォーム**: Web（ブラウザ）
**プロジェクト種別**: Web アプリケーション（Next.js 統合型）
**パフォーマンス目標**: 一覧ページ初回ロード 3 秒以内
**制約**: 認証不要でカタログ閲覧可能、インメモリストアのみ
**規模/スコープ**: 3画面（一覧・詳細・検索）、25件以上の商品データ

## 憲章チェック

*GATE: Phase 0 リサーチ前に確認必須。Phase 1 設計後に再確認。*

| 原則 | 準拠状況 | 備考 |
|------|---------|------|
| I. テンプレート駆動開発 | ✅ | `templates/ui/components/` の共通コンポーネントを使用 |
| II. ドメイン分離 | ✅ | `src/domains/catalog/` に実装。ドメイン間依存なし |
| III. テスト駆動開発 | ✅ | TDD（Red → Green → Refactor → 検証）を各ストーリーで実施 |
| IV. 共通UIコンポーネント | ✅ | Loading, Error, Empty を `@/templates/` から使用 |
| V. 実装ワークフロー | ✅ | スタブ置換パターンで実装。navLinks 解除予定 |
| 品質基準: カバレッジ 80% | ✅ | 各ストーリー完了時に確認 |
| 品質基準: E2E 全パス | ✅ | 各ストーリー完了時に実行 |
| 品質基準: サンプルコード保護 | ✅ | `.default()` / `.optional()` で互換性維持 |
| 品質基準: 外部リソース検証 | ⏳ | 実装時に Unsplash URL を HTTP 検証予定 |
| 命名規約 | ✅ | kebab-case ファイル名、PascalCase コンポーネント |
| テスト配置規約 | ✅ | `tests/unit/domains/catalog/`, `tests/e2e/` に配置 |

## プロジェクト構造

### ドキュメント（本機能）

```text
specs/001-catalog-browse/
├── plan.md              # 本ファイル
├── research.md          # Phase 0 リサーチ結果
├── data-model.md        # Phase 1 データモデル
├── quickstart.md        # Phase 1 クイックスタート
├── contracts/           # Phase 1 コントラクト変更仕様
│   └── catalog-changes.md
└── tasks.md             # Phase 2 タスク（/speckit.tasks で生成）
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/
│   └── catalog.ts                    # stock, keyword フィールド追加
├── domains/
│   └── catalog/
│       ├── api/
│       │   ├── index.ts              # スタブ → 本番エクスポート
│       │   └── usecases.ts           # 本番ユースケース（新規）
│       └── ui/
│           ├── index.tsx             # スタブ → 本番エクスポート
│           ├── ProductList.tsx       # 一覧コンポーネント（新規）
│           ├── ProductCard.tsx       # カードコンポーネント（新規）
│           ├── ProductDetail.tsx     # 詳細コンポーネント（新規）
│           └── SearchBar.tsx         # 検索バーコンポーネント（新規）
├── infrastructure/
│   └── repositories/
│       └── product.ts                # EXTENSION_PRODUCTS 追加、keyword 検索対応
├── app/
│   ├── (buyer)/
│   │   ├── layout.tsx                # navLinks コメント解除（商品一覧）
│   │   └── catalog/
│   │       ├── page.tsx              # 既存（変更なし：domains/catalog/ui を使用）
│   │       └── [id]/
│   │           └── page.tsx          # 既存（変更なし：domains/catalog/ui を使用）
│   └── api/
│       └── catalog/
│           └── products/
│               └── route.ts          # keyword パラメータ追加

tests/
├── unit/
│   └── domains/
│       └── catalog/
│           └── usecase.test.ts       # ユースケース単体テスト（新規）
├── integration/
│   └── domains/
│       └── catalog/
│           └── api.test.ts           # API 統合テスト（新規）
└── e2e/
    └── catalog-browse.spec.ts        # E2E テスト（新規）
```

**構造決定**: 既存のアーキテクチャテンプレートに準拠。`src/domains/catalog/` 配下に
API ユースケースと UI コンポーネントを配置し、スタブを本番実装に置換する。
ページ（`src/app/(buyer)/catalog/`）と API Routes（`src/app/api/catalog/`）は
既に配置済みのため、ドメイン層の置換のみで動作する。

## 複雑性追跡

> 憲章チェックに違反がないため、このセクションは不要。
