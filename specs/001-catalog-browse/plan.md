# 実装計画: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-27 | **仕様**: specs/001-catalog-browse/spec.md
**入力**: Feature specification from `/specs/001-catalog-browse/spec.md`

## サマリー

購入者が認証なしで商品カタログを閲覧できる機能を実装する。商品一覧（12件/ページ・ページネーション）、商品詳細（在庫確認・カート追加ボタン）、キーワード検索の3ユーザーストーリーを対象とする。既存のAPIルートとインフラを活用し、スタブ実装（NotImplementedError）をドメイン本実装に置き換える。Product エンティティに `stock` フィールドと `q` 検索パラメータを追加する。テストデータは Lorem Picsum 画像を使用した15件に拡充する。

## 技術コンテキスト

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**Storage**: インメモリストア（サーバーサイド、Next.js HMR 対応 globalThis 保持）
**Testing**: Vitest（unit/integration）, Playwright（E2E）— `pnpm test:unit` / `pnpm test:e2e`
**Target Platform**: Webブラウザ（ローカル開発: localhost:3000 / E2E: localhost:3099）
**Project Type**: web-service
**Performance Goals**: 一覧ページ初回ロード 3秒以内、ページネーション切り替え 2秒以内
**Constraints**: インメモリストア（サーバー再起動でリセット）、認証不要での閲覧、外部画像は Lorem Picsum のみ
**Scale/Scope**: カタログ閲覧 3画面（一覧・詳細・検索）、テストデータ 15件

## 憲章チェック

*ゲート: フェーズ0リサーチ前に必須。フェーズ1設計後に再確認。*

| 原則 | 確認項目 | 状態 |
|---|---|---|
| I. 共有基盤の利用 | UI は `components/`（ProductCard, Pagination, SearchBar, ImagePlaceholder, BackButton, useFetch）を使用 | ✅ |
| I. 共有基盤の利用 | API は `templates/api/` の route-handler を使用（既存ルートそのまま） | ✅ |
| II. ドメイン分離 | 実装先は `src/domains/catalog/`。ドメイン間直接インポートなし | ✅ |
| III. TDD必須 | 各USで Red → Green → Refactor を実施。4種テスト（単体・UI単体・統合・E2E） | ✅（計画）|
| IV. 実装ガードレール | 保護対象（components/, foundation/, templates/, samples/）は改変しない | ✅ |
| IV. 実装ガードレール | 変更対象: contracts/, infrastructure/, domains/, app/api/, app/(buyer)/, tests/ | ✅ |

**違反なし — 全ゲート通過**

## プロジェクト構造

### ドキュメント（このフィーチャー）

```text
specs/001-catalog-browse/
├── plan.md              # この文書
├── research.md          # フェーズ0調査結果
├── data-model.md        # エンティティ定義
├── quickstart.md        # 動作確認手順
├── contracts/
│   └── catalog-api.md   # APIコントラクト仕様
└── tasks.md             # フェーズ2タスク（/speckit.tasks で生成）
```

### ソースコード（変更対象ファイル）

```text
src/
├── contracts/
│   └── catalog.ts                  # 変更: stock フィールド追加、q 検索パラメータ追加
├── infrastructure/
│   └── repositories/
│       └── product.ts              # 変更: テストデータ15件に拡充（Lorem Picsum）、keyword search 追加
├── domains/
│   └── catalog/
│       ├── api/
│       │   └── index.ts            # 実装: getProducts, getProductById（スタブ→本実装）
│       └── ui/
│           └── index.tsx           # 実装: ProductList（US1,US3）, ProductDetail（US2）
└── app/
    ├── (buyer)/
    │   └── nav.ts                  # 変更: カタログリンク追加（US1完了後）
    └── api/
        └── catalog/
            └── products/
                └── route.ts        # 変更: q パラメータを searchParams から読み込み（US3）

tests/
├── unit/domains/catalog/
│   ├── us1/
│   │   ├── usecase.test.ts         # getProducts 単体テスト
│   │   └── ui.test.tsx             # ProductList UI単体テスト
│   ├── us2/
│   │   ├── usecase.test.ts         # getProductById 単体テスト
│   │   └── ui.test.tsx             # ProductDetail UI単体テスト
│   └── us3/
│       ├── usecase.test.ts         # getProducts with q 単体テスト
│       └── ui.test.tsx             # SearchBar 連携 UI単体テスト
├── integration/domains/catalog/
│   ├── us1/
│   │   └── api.test.ts             # 商品一覧 API 統合テスト
│   ├── us2/
│   │   └── api.test.ts             # 商品詳細 API 統合テスト
│   └── us3/
│       └── api.test.ts             # 検索 API 統合テスト
└── e2e/
    ├── catalog-us1.spec.ts         # 一覧・ページネーション・在庫切れ E2E
    ├── catalog-us2.spec.ts         # 詳細表示・戻るナビゲーション E2E
    └── catalog-us3.spec.ts         # キーワード検索・クリア E2E
```

**構造決定**: Next.js App Router の慣例に従い、UI ロジックは `src/domains/catalog/` に集約。APIルートは既存 `src/app/api/catalog/` を流用（新規ルート作成なし）。

## 複雑度トラッキング

> 憲章チェック違反なし — このセクションは不要
