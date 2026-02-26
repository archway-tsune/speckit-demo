---
description: Create or update the feature specification from a natural language feature description.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**Output Language Rule**: 出力はすべて日本語。テンプレート見出しも翻訳する。
例: "## User Scenarios & Testing" → "## ユーザーシナリオとテスト"

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Extract meaningful keywords, use action-noun format (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms/acronyms. Examples: "user authentication" → "user-auth", "analytics dashboard" → "analytics-dashboard"

2. **Check for existing branches before creating new one**:

   a. First, fetch all remote branches to ensure we have the latest information:

      ```bash
      git fetch --all --prune
      ```

   b. Find the highest feature number across all sources for the short-name:
      - Remote branches: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - Local branches: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - Specs directories: Check for directories matching `specs/[0-9]+-<short-name>`

   c. Determine the next available number:
      - Extract all numbers from all three sources
      - Find the highest number N
      - Use N+1 for the new branch number

   d. Run the script `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS"` with the calculated number and short-name:
      - Pass `--number N+1` and `--short-name "your-short-name"` along with the feature description
      - Bash example: `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" --json --number 5 --short-name "user-auth" "Add user authentication"`
      - PowerShell example: `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" -Json -Number 5 -ShortName "user-auth" "Add user authentication"`

   **IMPORTANT**:
   - Check all three sources (remote branches, local branches, specs directories) to find the highest number
   - Only match branches/directories with the exact short-name pattern
   - If no existing branches/directories found with this short-name, start with number 1
   - You must only ever run this script once per feature
   - The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for
   - The JSON output will contain BRANCH_NAME and SPEC_FILE paths

3. Load `.specify/templates/spec-template.md` to understand required sections.

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

5. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

6. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist** at `FEATURE_DIR/checklists/requirements.md` with sections:
      - **Content Quality**: No implementation details, focused on user value, written for non-technical stakeholders, all mandatory sections completed
      - **Requirement Completeness**: No [NEEDS CLARIFICATION] markers, testable/unambiguous, measurable/tech-agnostic success criteria, all scenarios defined, edge cases identified, scope bounded, dependencies identified
      - **Feature Readiness**: All FRs have acceptance criteria, user scenarios cover primary flows, no implementation details leak

   b. **Run Validation Check**: Review spec against each item. Document failures with quoted spec sections.

   c. **Handle Validation Results**:
      - **All pass** → proceed
      - **Items fail** → fix spec, re-validate (max 3 iterations)
      - **[NEEDS CLARIFICATION] remain** (max 3): Present each as `## Question [N]: [Topic]` with context, options table (`| Option | Answer | Implications |`), and `**Your choice**` prompt. Wait for user responses, update spec, re-validate.

   d. **Update Checklist** after each validation iteration

7. Report completion with branch name, spec file path, checklist results, and readiness for the next phase (`/speckit.clarify` or `/speckit.plan`).

**NOTE:** The script creates and checks out the new branch and initializes the spec file before writing.

## Guidelines

- Focus on **WHAT** and **WHY**, not HOW. Written for business stakeholders. No embedded checklists (use `/speckit.checklist`).
- **Mandatory sections**: Must be completed. **Optional**: Include only when relevant (remove entirely if N/A).
- **AI Generation**: Make informed guesses (document in Assumptions). Max 3 [NEEDS CLARIFICATION] markers (scope > security > UX > technical). Think like a tester: every requirement must be testable.
- **Reasonable defaults** (don't ask): data retention, performance targets, error handling, auth method, integration patterns — use industry standards.

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good**: "Users can complete checkout in under 3 minutes", "95% of searches return results in under 1 second"
**Bad**: "API response time is under 200ms" (too technical), "React components render efficiently" (framework-specific)
