# Constitution Example - ECサイトプロジェクト向け

`/speckit.constitution` 実行時の入力例です。

```
/speckit.constitution 
# プロジェクト概要
プロジェクト名: トレーニングECサイト
説明: Next.js + TypeScriptで構築するECサイト。EC Site Architecture Templateをベースに実装。

# 技術スタック
- Next.js 14 (App Router)
- TypeScript 5 (strict mode)
- React 18
- Tailwind CSS 3
- Zod (バリデーション)
- Vitest (単体・統合テスト)
- Playwright (E2Eテスト)

# アーキテクチャ原則
1. テンプレート駆動開発
   - UI/API/テストは templates/ のテンプレートを基に実装
   - 共通基盤は foundation/ を使用

2. ドメイン分離
   - 各ドメインは src/domains/[domain]/ に独立して実装
   - ドメイン間の依存は API 経由のみ

3. テスト駆動開発
   - TDD（Red → Green → Refactor → 検証）を徹底する
   - Red フェーズで以下の 4 種別のテストを作成する
     - ユースケース単体テスト（ドメインロジック）
     - UI コンポーネント単体テスト（表示・インタラクション）
     - API 統合テスト（入力バリデーション・認可・レスポンス）
     - E2E テスト（ユーザー導線の主要フロー）
   - Refactor ステップで重複排除・命名改善・責務分離を実施する
     - 全テストが引き続きパスすることを検証する
     - 不要と判断した場合はその理由を明記する
   - 検証ステップで E2E テスト実行（証跡付き）+ カバレッジ確認を実施する

4. 共通UIコンポーネントの利用
   - ドメイン実装時は `@/templates/ui/components/` の共通コンポーネントを使用し、同等機能の独自実装を禁止する

5. 実装ワークフロー
   - スタブ置換で本番実装に切り替える
     - API: NotImplementedError → 本番API（501応答が解消）
     - UI: 「ドメイン未実装」プレースホルダー → 本番コンポーネント
   - 既存の本番ページ・API Routes は配置済み
     - 本番ページ: src/app/(buyer)/, src/app/admin/
     - API Routes: src/app/api/
     - @/domains/ のスタブを置換すれば自動的に動作する
   - src/contracts/ を基盤とし、src/samples/ を参考に実装する
     - spec.md が要求するフィールドが contracts にない場合は拡張する
     - 「モデルにないから」は要件スキップの理由にならない
   - spec.md は実装すべき機能の唯一の情報源である
     - 定義されていない機能は実装しない（スコープ外は除外）
     - 定義された機能は data-model.md や contracts の不備を理由にスキップしない
   - ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする
   - ドメイン実装時に navLinks のコメントを解除する
     - 購入者向け: src/app/(buyer)/layout.tsx
     - 管理者向け: src/app/admin/layout.tsx
     - 実装したドメインのリンクのみ有効化する

# 品質基準
- TypeScript: strictモード、エラー0件
- ESLint: エラー0件
- テストカバレッジ: 80%以上
  - 各ユーザーストーリー完了時に `pnpm test:unit --coverage` を実施し 80% 以上を確認（詳細はテンプレート参照）
- E2Eテスト: 主要導線をカバー
  - 各ユーザーストーリー完了時に `pnpm test:e2e` を実行し全パスを必須とする
  - テスト実行結果の出力を確認し、パス件数 0 件はエラーとする
  - 実装のみで実行スキップは不可（詳細はテンプレート参照）
- 外部リソース検証: シードデータに外部URL（画像等）を含める場合
  - 実装時に各URLにHTTPリクエストを送信し存在を確認する。失敗したURLは代替URLに置換する
  - plan時点では検証予定とし、検証済みとしない
  - LLMが生成したURLは実在しない可能性がある（詳細はテンプレート参照）
- サンプルコード保護: 本番実装によるサンプルコード破損を防止する
  - contractsの新規フィールドは `.default()` または `.optional()` を付与する
  - シードデータはベース（不変）と拡張（本番追加分）に分離する
  - リポジトリインターフェースの検索パラメータ追加はオプショナルとする（詳細はテンプレート参照）
- パフォーマンス: 一覧ページ初回ロード3秒以内

# 認証・認可
- ロール: buyer（購入者）, admin（管理者）
- セッション管理: Cookie-based
- 認可: RBAC (Role-Based Access Control)

# 命名規約
- ファイル名: kebab-case (例: product-list.tsx)
- コンポーネント: PascalCase (例: ProductList)
- 関数: camelCase (例: getProducts)
- 定数: UPPER_SNAKE_CASE (例: MAX_ITEMS)
- 型: PascalCase (例: ProductType)

# 単体・統合テスト作成時の注意事項
- 本番ドメインの単体テストは `tests/unit/domains/[domain]/` に配置する（例: `tests/unit/domains/catalog/usecase.test.ts`）
- 本番ドメインの統合テストは `tests/integration/domains/[domain]/` に配置する（例: `tests/integration/domains/catalog/api.test.ts`）
- `src/samples/tests/` 配下はサンプル実装専用のテストであり、本番ドメインのテストを追加してはならない
- テスト作成時は `src/samples/tests/unit/domains/` および `src/samples/tests/integration/domains/` 配下のサンプルテストを参照すること

# E2Eテスト作成時の注意事項
- 本番E2Eテストは `tests/e2e/` 直下に配置する（サンプルテストの `src/samples/tests/e2e/` とは分離）
- テスト作成時は `src/samples/tests/e2e/domains/` 配下のサンプルE2Eテストを参照すること

# E2Eテスト実行時の注意事項
- E2Eテスト実行前にポート3000を占有している既存プロセスを必ず停止する
- Windows環境ではBashの `$_` がextglobで壊れるため、PowerShellスクリプトは `powershell.exe -File -` + heredocで実行する
- データ変更後は `.next` キャッシュを削除してからサーバーを再起動する（`globalThis` のインメモリストアがHMRで残るため）

# 前提
すべてのプロジェクト憲章・仕様書・計画・タスク・実装に関するドキュメントは見出し・本文ともに日本語で記述すること。
```