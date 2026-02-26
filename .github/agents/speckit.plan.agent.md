---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**Output Language Rule**: 出力はすべて日本語。テンプレート見出しも翻訳する。
例: "## Technical Context" → "## 技術コンテキスト"

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Reconciliation: Validate plan.md against research.md decisions
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns**: NEEDS CLARIFICATION → research task, dependencies → best practices, integrations → patterns.
2. **Research agents**: For each unknown/tech choice, dispatch research tasks.
3. **Consolidate** in `research.md`: Decision, Rationale, Alternatives considered.
4. **「実装不要」検証**: 「既存で対応済み」Decision は該当コードを Read し AC 充足を確認。確認不可ならタスクとして残す

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - Read existing route files (`src/app/api/`) to discover pre-wired endpoints and HTTP methods
   - Map each user action to an existing endpoint. New endpoints are added only when no existing route covers the action
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

### Reconciliation: plan.md と research.md の整合性チェック

**Prerequisites:** Phase 1 完了後、Constitution 再チェック前に必ず実行

research.md の全 Decision を plan.md のプロジェクト構造と照合する。各 Decision が反映されているか、却下案が残っていないか、追加決定が含まれているかを確認し、矛盾があれば plan.md を更新する（構造は「実装完了後の目標状態」を記述）。

**Output**: plan.md（整合性確認済み）

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
