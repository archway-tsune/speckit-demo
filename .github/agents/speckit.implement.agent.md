---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root. Parse FEATURE_DIR and AVAILABLE_DOCS (absolute paths).

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files and count `- [ ]` (incomplete) vs `- [X]`/`- [x]` (completed)
   - Display status table: `| Checklist | Total | Completed | Incomplete | Status |`
   - **PASS** (all complete) → proceed. **FAIL** (any incomplete) → STOP and ask user whether to proceed

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**: Detect and create/verify ignore files:
   - git repo → .gitignore; Dockerfile/Docker in plan.md → .dockerignore; .eslintrc* → .eslintignore; eslint.config.* → update `ignores`; .prettierrc* → .prettierignore; *.tf → .terraformignore; helm charts → .helmignore
   - Existing: append missing patterns only. Missing: create full pattern set.
   - Universal patterns in all: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

5. Parse tasks.md: extract phases, dependencies, task IDs/file paths/[P] markers, execution order.

6. Execute implementation following the task plan:
   - **⚠️ アーキテクチャ保護（非交渉・最優先）**: 以下は変更禁止（TS エラーは実装側で対処）:
     - `src/samples/`, `src/foundation/`, `src/templates/`, `src/components/`, `tests/unit/templates/` — 凍結。import のみ許可。templates は `@/contracts/` import 禁止
     - `src/app/(buyer)/layout.tsx` — 構造変更禁止。ナビリンクは `nav.ts` で管理
   - **⚠️ ドメイン UI 制約（非交渉）**: `src/domains/*/ui/` では `window.confirm/alert/prompt` 禁止（`@/components/feedback` の ConfirmDialog 等を使用）、`useRouter`/`next/link` 禁止（コールバック props 注入）。テスト FAIL は設計見直しのシグナル
   - **Test commands**: `.github/workflows/ci.yml` のジョブ定義を参照
   - **Phase 2b（スキャフォールディング）**: plan.md と `src/contracts/` に基づきスタブ生成:
     - ユースケース関数・ドメイン UI: `throw new NotImplementedError("名前")`（JSX 返却禁止）
     - page.tsx: 既存はコンテナラッパー維持。新規は `<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Component /></div>` 形式。`useFetch` の結果は `<DataView>` でラップし、`children` render prop 内でドメイン UI コンポーネントを呼ぶこと。`loadingMessage`/`emptyMessage`/`emptyCheck` を適切に設定すること
     - Props 型は `src/contracts/` から導出（Props なし禁止）。**ドメイン UI の props はエンティティ型（output の中身）を使う。`useFetch` は page.tsx のみ（UI コンポーネント内禁止）**
     - 静的 `import` のみ（`require()`/動的 import 禁止）。未使用 import 禁止。`NotImplementedError` パスは既存から検出
     - **共通モジュール活用（必須手順）**:
       1. `src/components/index.ts` と `src/templates/index.ts` を Read し、全エクスポートを把握する
       2. `src/app/(samples)/sample/api/` 配下の対応サンプル API Route を Read し、`createRouteHandler()` の使用パターンを把握する
       3. API Route スタブは `createRouteHandler()` で生成すること（手書き try-catch 禁止。Step 2 のサンプルに従う）
       4. ドメインスタブ（ユースケース関数・UI）の先頭に `// @see barrel: [モジュール一覧] (@/components)` コメントを付与。バレルの全エクスポートをそのまま列挙する（判断で除外しない）
       5. 共通モジュールが存在する機能のインライン再実装は禁止（必ず barrel から import）
   - **⚠ テスト品質ルール（最優先）**:
     - **禁止**: `toThrow(NotImplementedError)`, `toThrow(/未実装/)`, 引数なし `toThrow()`, テスト名に「未実装」, `it.todo()`/`it.skip()`, 条件付きアサーション, 独自テストデータの発明
     - **テストデータ**: `@/contracts/` 型に完全準拠。単体は beforeEach でモック作成、統合は `@/infrastructure/` から取得。シードデータと一致させること
     - **必須**: beforeEach 必須、`@/contracts/` or `@/domains/` import 必須、`(input, context)` パターン、UI は props 経由
   - **Red**: **当該 US のテストのみ作成する。** contracts/spec + barrel export からテスト設計導出。単体: Given-When-Then + `vi.fn()`、統合: Schema.parse() 契約検証、E2E: `src/app/` ページ・UI・シードデータ Read 後作成。仕様ベース、UI はリンク href も検証。**E2E 記述パターン（RED 高速化）**: `page.goto` 直後に `await page.waitForLoadState('networkidle')` を挟み、直後の DOM アサーションは `{ timeout: 0 }` で即判定（未実装要素がなければ即 FAIL）。click 後の URL 遷移・action 後の DOM 変化は `{ timeout: 5000 }`。React 中間遷移状態（ローディング中など）は `waitForLoadState` 不使用で `{ timeout: 5000 }`。サンプル（`src/samples/tests/e2e/`）を参照パターンとして活用。禁止パターンゼロ確認後テスト実行、exit code で FAIL 確認（grep/sed 禁止）。**バレルコンポーネント使用時はソースを Read して DOM・testid を確認してからテストを書くこと（想定禁止）。**
     - **単体・統合**: `tests/unit/<domain>/us<N>/`・`tests/integration/<domain>/us<N>/` に作成。Red: `pnpm test:unit:only tests/unit/対象/us<N>/`・`pnpm test:integration:only tests/integration/対象/us<N>/`（`--bail` 禁止。全テストの失敗を確認すること）
     - **E2E**: `tests/e2e/<domain>-us<N>.spec.ts`（例: `catalog-browse-us1.spec.ts`）に作成。US 毎に基本フロー 1〜2 件 + UI に現れる例外フローのみ（AC 全網羅禁止。詳細は unit/integration）。Red: `pnpm test:e2e --retries 0 tests/e2e/<domain>-us<N>.spec.ts` / Green・Refactor: `pnpm test:e2e -x tests/e2e/<domain>-us<N>.spec.ts`（Bash timeout 120000ms）**テスト実行は1回のみ。バックグラウンド実行した場合は TaskOutput で結果を待つこと。同じテストコマンドの再実行は禁止。**
   - **E2E 失敗時の診断**: E2E テストが予期しない失敗をした場合、`test-results/` 配下の該当ディレクトリを確認する。`error-context.md`（ページスナップショット）と `test-failed-*.png`（スクリーンショット）を Read し、失敗原因を特定してから修正に着手すること。retry1 ディレクトリには `trace.zip` も生成される
   - **Green**: `tests/` 変更禁止。`src/` のみ変更し全テスト（単体・統合・E2E）PASS
   - **Refactor**: Green の全変更ファイルを Read しレビュー → リファクタリング（当該ストーリーのみ） → 全テストをシェル実行して PASS 確認。全件 E2E は Final Phase のみ

7. **テスト実行スコープ**: Red/Green/Refactor はストーリー単位のテストのみ。Final Phase で全件 E2E を実行。サンプルテスト（`pnpm test:*:samples`）は実行しない

8. **進捗**: 各タスク完了後に報告。[P] 以外の失敗で Halt。**IMPORTANT**: 完了タスクは必ず tasks.md で `[X]` にマークすること

9. **完了確認**: 全タスク・仕様適合・テスト PASS を確認し最終サマリーを報告

> tasks.md が不完全な場合は `/speckit.tasks` を先に実行すること
