---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**Output Language Rule**: 出力はすべて日本語。テンプレート見出しも翻訳する。
例: "## Core Principles" → "## 核心原則"

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

**Note**: If `.specify/memory/constitution.md` does not exist yet, it should have been initialized from `.specify/templates/constitution-template.md` during project setup. If it's missing, copy the template first.

Follow this execution flow:

1. Load the existing constitution at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that - follow the general template. You will update the doc accordingly.

2. Collect/derive placeholder values: user input → repo context inference → ask/TODO. Dates: `RATIFICATION_DATE` = adoption date, `LAST_AMENDED_DATE` = today if changed. `CONSTITUTION_VERSION` semver: MAJOR (removals/redefinitions), MINOR (new principles), PATCH (clarifications).

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - **Technology Stack section is REQUIRED**: The `[TECHNOLOGY_STACK]` placeholder MUST be filled with the project's core technologies, frameworks, and tools. This section is critical for downstream commands (`/speckit.plan`, `/speckit.tasks`) to determine build/test commands. Do NOT omit this section even if the user input provides it under a different heading.
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Consistency propagation: Read and validate alignment with updated principles in:
   - `.specify/templates/plan-template.md` (Constitution Check), `spec-template.md` (mandatory sections), `tasks-template.md` (task types)
   - `.specify/templates/commands/*.md` (outdated references), runtime docs (`README.md`, `docs/quickstart.md`)

5. Produce a Sync Impact Report (HTML comment at top): version change, modified/added/removed principles, templates requiring updates (✅/⚠), deferred TODOs.

6. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).

7. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

**Formatting**: Preserve template heading hierarchy. Single blank line between sections. No trailing whitespace.

Partial updates still require validation and version decision. Missing critical info → `TODO(<FIELD>): explanation`. Always operate on existing `.specify/memory/constitution.md` (never create new template).
