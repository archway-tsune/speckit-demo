# Constitution Example - ECサイトプロジェクト向け

`/speckit.constitution` 実行時の入力例です。

```
/speckit.constitution
# トレーニングECサイト憲章

## 技術スタック
- Next.js 14 (App Router) + TypeScript 5 (strict mode) + React 18
- Tailwind CSS 3, Zod（バリデーション）
- Vitest（単体・統合テスト）, Playwright（E2Eテスト）

## 核心原則

### 共有基盤の利用
UIはcomponents/、APIはtemplates/api/、共通処理はfoundation/を使用し、独自実装を禁止する。

### ドメイン分離
各ドメインはsrc/domains/[domain]/に独立して実装し、ドメイン間の依存はAPI経由のみとする。対象: Catalog, Cart, Orders, Products。

### TDD必須（非交渉）
- Red: 4種テスト（単体・UI単体・統合・E2E）を作成・シェル実行し失敗を確認。仕様ベース（Given-When-Then）、失敗理由は未実装のみ許可
- Green: テストコード変更禁止。実装コードのみで全テストを成功させる
- Refactor: 当該ストーリー変更コードのみリファクタリング。全テストをシェル実行して成功確認

### 実装ガードレール（非交渉）
- 保護対象（Foundation, Templates, Components, Samples）への改変禁止。変更許可はContracts, Infrastructure, Domains, Appルート, Testsのみ
- テスト失敗が残る場合は次ストーリーに進まない
- スタブ置換（NotImplementedError → 本番実装）で段階的に実装。spec.mdを唯一の情報源とし要件スキップ禁止

## 認証・認可
- ロール: buyer（購入者）, admin（管理者）
- セッション方式（Cookie-based）、CSRF対策、RBAC二重防御（画面遷移+業務実行）

## 品質基準
- TypeScript strict + ESLint エラー0件
- テストカバレッジ80%以上
- E2Eテスト: 主要導線カバー、実行証跡の提示義務あり
- パフォーマンス: 一覧ページ初回ロード3秒以内

## 命名規約
ファイル: kebab-case、コンポーネント/型: PascalCase、関数: camelCase、定数: UPPER_SNAKE_CASE

## テスト配置規約
- 本番: tests/{unit,integration}/domains/[domain]/, tests/e2e/
- サンプル: src/samples/tests/（本番テストを追加しない）

## 開発ワークフロー
ユーザーストーリー単位でフェーズ分割し独立した実装・テストを行う。src/contracts/を基盤とし、src/samples/を参考に実装。実装完了後にnav.tsへのエントリ追加で段階的に機能公開する。

## 統制
憲章は他のすべての慣行に優先する。修正にはドキュメント化・承認・移行計画が必要。
```
