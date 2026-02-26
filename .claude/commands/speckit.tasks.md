---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**Output Language Rule**: 出力はすべて日本語。テンプレート見出しも翻訳する。フォーマットトークン（`[P]`, `[US1]`, `T001`）、コード参照、ファイルパスは英語のまま維持する。
例: "## Phase 1: Setup (Shared Infrastructure)" → "## フェーズ 1: セットアップ（共有インフラ）"

## Outline

1. **Setup**: Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from repo root. Parse FEATURE_DIR and AVAILABLE_DOCS (absolute paths).

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md (tech stack, structure) + spec.md (user stories, priorities)
   - If exists: data-model.md (entities→stories), contracts/ (endpoints→stories), research.md (decisions→setup)
   - Generate tasks organized by user story (see Task Generation Rules), dependency graph, parallel examples
   - Validate: each story independently testable. **AC カバレッジ**: Then 句→検証ポイント分解、テスト責務先明記。「既存で対応済み」AC にも E2E 割当。**AC→テスト作成 1:1**: 各 AC を「テスト作成」タスクに割り当てる（「実行のみ」禁止）。責務レイヤーが異なる AC は別タスクにする

4. **Generate tasks.md**: Use `.specify/templates/tasks-template.md` as structure. Feature name from plan.md. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories in priority order, each with story goal/test criteria/implementation tasks) → Final Phase (Polish). All tasks follow checklist format. Include dependencies, parallel examples, implementation strategy (MVP first).

5. **Report**: Output path to tasks.md, total/per-story task count, parallel opportunities, independent test criteria, MVP scope, format validation (all tasks follow checklist format).

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**TDD is MANDATORY**: Each user story phase MUST follow the Red → Green → Refactor workflow:

1. **Red（テスト作成）**: **当該 US のテストのみ作成する。** シェル実行して FAIL を確認（失敗理由は未実装のみ許可）。単体・統合: `tests/unit/<domain>/us<N>/`・`tests/integration/<domain>/us<N>/` に作成。Red: `pnpm test:unit:only tests/unit/対象/us<N>/ 2>&1`・`pnpm test:integration:only tests/integration/対象/us<N>/ 2>&1`（`--bail` 禁止。全テストの失敗を確認すること）。E2E: `tests/e2e/<domain>-us<N>.spec.ts`（例: `catalog-browse-us1.spec.ts`）に作成。ファイル指定で実行（Red: `pnpm test:e2e --retries 0 tests/e2e/<domain>-us<N>.spec.ts 2>&1`、Green: `pnpm test:e2e -x tests/e2e/<domain>-us<N>.spec.ts 2>&1`）。**E2E 記述パターン**: `page.goto` 直後に `await page.waitForLoadState('networkidle')`、直後の DOM アサーションは `{ timeout: 0 }` で即判定。click 後 URL 遷移・action 後 DOM 変化は `{ timeout: 5000 }`。React 中間遷移状態は `waitForLoadState` 不使用・`{ timeout: 5000 }`。サンプル（`src/samples/tests/e2e/`）を参照。**バレルコンポーネント使用時はソースを Read して DOM・testid を確認してからテストを書くこと（想定禁止）。**
2. **Green（最小実装）**: テストコード変更禁止。実装コードのみで全テスト（単体・統合・E2E）を PASS させる。シェル実行して PASS を確認。E2E はファイル指定で実行
3. **Refactor（改善）**: 当該ストーリーで変更したコードのみリファクタリング → 全テストをシェル実行して PASS 確認。全件 E2E 実行は Final Phase のみ

Each user story phase MUST have sub-sections: `### Red`, `### Green`, `### Refactor` with corresponding tasks.

**Red フェーズ共通禁止パターン**（`### Red` 冒頭に1回だけ記載。個別タスクには繰り返さない）:
`⚠️ 禁止: 引数なし toThrow(), 条件付きアサーション(if→expect), it.todo/skip, テスト名「未実装」`

**Scaffolding is MANDATORY**: Phase 2 の末尾に **Phase 2b: スキャフォールディング** を必ず含める。plan.md のプロジェクト構造に基づき、全ユーザーストーリー分のスタブを一括生成する。Red テスト作成の前提条件となる。Phase 2b のタスクには以下を反映:

1. **前準備**（1タスク）: `src/components/index.ts`, `src/templates/index.ts`, `src/app/(samples)/sample/api/` 対応サンプル Route を Read。フック（`hooks/`）はソースも Read し API を把握。サンプルドメイン UI から使用例も Read
2. **API Route**（ファイルごと1タスク）: 前準備で読んだサンプルに従い `createRouteHandler()` で書き換え（手書き try-catch 禁止）
3. **ドメインスタブ**（API + UI を1タスク）: `throw new NotImplementedError()`（JSX 返却禁止）+ 先頭に `// @see barrel:` コメント付与（前準備で読んだバレルの全エクスポートをそのまま列挙。タスク記述にモジュール名を書かず実行時に Read 結果から生成すること）
4. **page.tsx**: 既存はコンテナラッパー維持、新規はコンテナ + import 形式

### Task Description Brevity (REQUIRED)

タスク記述は **AC/FR 番号参照 + ファイルパス + テスト実行コマンド** のみ。テストケースの詳細説明や実装ステップの列挙は省略する（implement フェーズが spec.md/contracts/サンプルから導出する）。

**例（Red 単体）**: `- [ ] T008 [P] [US1] tests/unit/domains/orders/us1/create-order.test.ts を作成 (AC-5, FR-004)。テスト対象: createOrder。pnpm test:unit:only tests/unit/domains/orders/us1/ 2>&1 で FAIL 確認`

**例（Red E2E）**: `- [ ] T009 [US1] tests/e2e/orders-us1.spec.ts を作成 (AC-5)。pnpm test:e2e --retries 0 tests/e2e/orders-us1.spec.ts 2>&1 で FAIL 確認`

**例（Green）**: `- [ ] T012 [US1] src/domains/orders/api/index.ts の createOrder を実装。サンプル参照。pnpm test:unit ... 2>&1 で PASS 確認`

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format**: `- [ ]` checkbox + Task ID (T001...) + `[P]` if parallelizable + `[Story]` label ([US1] etc., user story phases only, NOT for Setup/Foundational/Polish) + description with exact file path.

**例**: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`

### Task Organization

1. **User Stories (PRIMARY)**: Each story (P1, P2, P3...) gets its own phase. Map models/services/endpoints/tests to their story. Most stories should be independent.
2. **Contracts**: Map each endpoint → serving user story. Contract tests [P] before implementation.
3. **Data Model**: Map entities to stories. Multi-story entities → earliest story or Setup. Relationships → service tasks.
4. **Setup/Infrastructure**: Shared → Phase 1, Blocking → Phase 2, Story-specific → within story phase.

### Phase Structure

- **Phase 1**: Setup (project initialization). 依存関係インストール（`pnpm install` 等）タスクを必ず含めること
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 2b**: Scaffolding (see Scaffolding is MANDATORY above)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Red (tests + E2E) → Green (implementation) → Refactor (improve)
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns. 全件 E2E（`pnpm test:e2e`）を必ず含めること（Red/Green/Refactor ではストーリー単位のテストのみ実行し、Final Phase で初めて全件 E2E を実行してリグレッションを検出する）。サンプルテスト（`pnpm test:*:samples`）は実行しない
