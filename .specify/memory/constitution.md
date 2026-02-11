<!--
  Sync Impact Report
  ==================
  バージョン変更: (新規) → 1.0.0
  変更された原則:
    - (新規) 原則 I: テンプレート駆動開発
    - (新規) 原則 II: ドメイン分離
    - (新規) 原則 III: テスト駆動開発（必須）
    - (新規) 原則 IV: 共通UIコンポーネントの利用
    - (新規) 原則 V: 実装ワークフロー
  追加セクション:
    - 品質基準・命名規約
    - 認証・認可・テスト注意事項
  削除セクション: なし
  テンプレート同期状況:
    - .specify/templates/plan-template.md ✅ 整合性確認済み（Constitution Check セクション有り）
    - .specify/templates/spec-template.md ✅ 整合性確認済み（ユーザーストーリー・優先度構造一致）
    - .specify/templates/tasks-template.md ✅ 整合性確認済み（Red-Green-Refactor-検証 構造一致）
    - .specify/templates/checklist-template.md ✅ 整合性確認済み
    - .specify/templates/agent-file-template.md ✅ 整合性確認済み
  保留TODO: なし
-->

# トレーニングECサイト 憲章

## プロジェクト概要

**プロジェクト名**: トレーニングECサイト
**説明**: Next.js + TypeScript で構築する EC サイト。
EC Site Architecture Template をベースに実装する。

**技術スタック**:
- Next.js 14 (App Router)
- TypeScript 5 (strict mode)
- React 18
- Tailwind CSS 3
- Zod（バリデーション）
- Vitest（単体・統合テスト）
- Playwright（E2E テスト）

## 基本原則

### 原則 I: テンプレート駆動開発

- UI・API・テストは `templates/` のテンプレートを基に実装しなければならない（MUST）
- 共通基盤は `foundation/` を使用しなければならない（MUST）
- テンプレートに定義されたパターンから逸脱する場合は、その理由を明記しなければならない（MUST）

**根拠**: テンプレートを起点とすることで実装の一貫性を担保し、
新規ドメイン追加時の立ち上がりコストを最小化する。

### 原則 II: ドメイン分離

- 各ドメインは `src/domains/[domain]/` に独立して実装しなければならない（MUST）
- ドメイン間の依存は API 経由のみとし、直接のモジュール参照を禁止する（MUST NOT）
- ドメイン内の実装はコントラクト（`src/contracts/`）に準拠しなければならない（MUST）

**根拠**: ドメイン境界を明確にすることで、各ドメインの独立した開発・テスト・
デプロイを可能にし、変更の影響範囲を局所化する。

### 原則 III: テスト駆動開発（必須）

- TDD（Red → Green → Refactor → 検証）を徹底しなければならない（MUST）
- Red フェーズで以下の 4 種別のテストを作成しなければならない（MUST）:
  - ユースケース単体テスト（ドメインロジック）
  - UI コンポーネント単体テスト（表示・インタラクション）
  - API 統合テスト（入力バリデーション・認可・レスポンス）
  - E2E テスト（ユーザー導線の主要フロー）
- Refactor ステップで重複排除・命名改善・責務分離を実施しなければならない（MUST）
  - 全テストが引き続きパスすることを検証する
  - リファクタリング不要と判断した場合はその理由を明記する
- 検証ステップで E2E テスト実行（証跡付き）+ カバレッジ確認を
  実施しなければならない（MUST）

**根拠**: テストを先に書くことで仕様の曖昧さを早期に検出し、
リグレッションを防止する。4 種別のテストにより多層的な品質保証を実現する。

### 原則 IV: 共通UIコンポーネントの利用

- ドメイン実装時は `@/templates/ui/components/` の共通コンポーネントを
  使用しなければならない（MUST）
- 共通コンポーネントと同等機能の独自実装を禁止する（MUST NOT）
- 共通コンポーネントに不足がある場合は、共通コンポーネント側を拡張する

**根拠**: UI の一貫性を保ち、重複実装によるメンテナンスコスト増大を防止する。

### 原則 V: 実装ワークフロー

- スタブ置換で本番実装に切り替えなければならない（MUST）:
  - API: `NotImplementedError` → 本番 API（501 応答が解消）
  - UI: 「ドメイン未実装」プレースホルダー → 本番コンポーネント
- 既存の本番ページ・API Routes は配置済みである:
  - 本番ページ: `src/app/(buyer)/`, `src/app/admin/`
  - API Routes: `src/app/api/`
  - `@/domains/` のスタブを置換すれば自動的に動作する
- `src/contracts/` を基盤とし、`src/samples/` を参考に実装しなければならない（MUST）
  - `spec.md` が要求するフィールドが contracts にない場合は拡張する
  - 「モデルにないから」は要件スキップの理由にならない
- `spec.md` は実装すべき機能の唯一の情報源である（MUST）:
  - 定義されていない機能は実装しない（スコープ外は除外）
  - 定義された機能は `data-model.md` や contracts の不備を理由にスキップしない
- ユーザーストーリー単位でフェーズを分割し、
  各ストーリーを独立して実装・テスト可能にしなければならない（MUST）
- ドメイン実装時に `navLinks` のコメントを解除しなければならない（MUST）:
  - 購入者向け: `src/app/(buyer)/layout.tsx`
  - 管理者向け: `src/app/admin/layout.tsx`
  - 実装したドメインのリンクのみ有効化する

**根拠**: スタブ置換パターンにより、アーキテクチャの骨格を維持しつつ
段階的に本番実装を投入できる。spec.md を唯一の情報源とすることで
要件の抜け漏れを防止する。

## 品質基準・命名規約

### 品質基準

- **TypeScript**: strict モード、エラー 0 件（MUST）
- **ESLint**: エラー 0 件（MUST）
- **テストカバレッジ**: 80% 以上（MUST）
  - 各ユーザーストーリー完了時に `pnpm test:unit --coverage` を実施し確認する
- **E2E テスト**: 主要導線をカバー（MUST）
  - 各ユーザーストーリー完了時に `pnpm test:e2e` を実行し全パスを必須とする
  - テスト実行結果の出力を確認し、パス件数 0 件はエラーとする
  - 実装のみで実行スキップは不可
- **外部リソース検証**: シードデータに外部 URL（画像等）を含める場合:
  - 実装時に各 URL に HTTP リクエストを送信し存在を確認する。
    失敗した URL は代替 URL に置換する
  - plan 時点では検証予定とし、検証済みとしない
  - LLM が生成した URL は実在しない可能性がある
- **サンプルコード保護**: 本番実装によるサンプルコード破損を防止する（MUST）
  - contracts の新規フィールドは `.default()` または `.optional()` を付与する
  - シードデータはベース（不変）と拡張（本番追加分）に分離する
  - リポジトリインターフェースの検索パラメータ追加はオプショナルとする
- **パフォーマンス**: 一覧ページ初回ロード 3 秒以内（MUST）

### 命名規約

| 対象 | 規約 | 例 |
|------|------|----|
| ファイル名 | kebab-case | `product-list.tsx` |
| コンポーネント | PascalCase | `ProductList` |
| 関数 | camelCase | `getProducts` |
| 定数 | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| 型 | PascalCase | `ProductType` |

## 認証・認可・テスト注意事項

### 認証・認可

- **ロール**: `buyer`（購入者）、`admin`（管理者）
- **セッション管理**: Cookie-based
- **認可**: RBAC（Role-Based Access Control）

### 単体・統合テスト配置規約

- 本番ドメインの単体テストは `tests/unit/domains/[domain]/` に配置する（MUST）
  - 例: `tests/unit/domains/catalog/usecase.test.ts`
- 本番ドメインの統合テストは `tests/integration/domains/[domain]/` に配置する（MUST）
  - 例: `tests/integration/domains/catalog/api.test.ts`
- `src/samples/tests/` 配下はサンプル実装専用のテストであり、
  本番ドメインのテストを追加してはならない（MUST NOT）
- テスト作成時は `src/samples/tests/unit/domains/` および
  `src/samples/tests/integration/domains/` 配下のサンプルテストを参照する

### E2E テスト配置規約

- 本番 E2E テストは `tests/e2e/` 直下に配置する（MUST）
  - サンプルテストの `src/samples/tests/e2e/` とは分離する
- テスト作成時は `src/samples/tests/e2e/domains/` 配下の
  サンプル E2E テストを参照する

### E2E テスト実行時の注意事項

- E2E テスト実行前にポート 3000 を占有している既存プロセスを
  停止しなければならない（MUST）
- Windows 環境では Bash の `$_` が extglob で壊れるため、
  PowerShell スクリプトは `powershell.exe -File -` + heredoc で実行する
- データ変更後は `.next` キャッシュを削除してからサーバーを再起動する
  （`globalThis` のインメモリストアが HMR で残るため）

## ガバナンス

- 本憲章はプロジェクトの全開発プラクティスに優先する（MUST）
- 憲章の修正には以下を必要とする:
  1. 変更内容の文書化
  2. 影響を受けるテンプレート・成果物の同期更新
  3. セマンティックバージョニングに基づくバージョン更新
    - MAJOR: 原則の削除・再定義（後方互換性なし）
    - MINOR: 原則・セクションの追加または実質的な拡張
    - PATCH: 文言修正・誤字修正・非意味的な改善
- すべての仕様書・計画・タスク・実装は本憲章の原則に準拠しなければならない（MUST）
- すべてのドキュメントは見出し・本文ともに日本語で記述する（MUST）
- 準拠の確認は各フィーチャーの plan.md 内の「Constitution Check」セクションで実施する

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11
