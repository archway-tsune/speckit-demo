# Workflows

## CI (`ci.yml`)

プルリクエスト・push 時に自動テスト（lint, typecheck, unit, integration, e2e）を実行する。

## Release (`release.yml`)

`v*` タグ push 時に `git archive` でリリース ZIP を作成し、GitHub Release にアップロードする。

### デプロイフロー

トレーニング用テンプレートリポジトリ（`speckit-training-template`）から作成されたリポジトリで Codespace を起動すると、以下の順序でセットアップされる:

1. **speckit 初期化**: `specify init --here --ai copilot` でデフォルトのコマンド定義ファイルが生成される
2. **リリース ZIP 展開**: 本リポジトリのリリース ZIP が上書き展開され、カスタマイズ済みファイルが適用される

ZIP にはプロジェクト固有のカスタマイズ（TDD ルール、テスト品質ルール等）が含まれるため、展開後は追加設定不要で speckit コマンドが使用可能になる。カスタマイズの詳細は `docs/SPECKIT_CUSTOM_CHANGES.md` を参照。

### ZIP 構成

`git archive` + `.gitattributes` の `export-ignore` で制御。

#### ZIP に含まれるパス（カスタマイズ済み or init 非生成）

| パス | 内容 |
|------|------|
| `.claude/commands/speckit.{implement,tasks,plan,constitution,specify}.md` | Claude Code コマンド定義（5 ファイル）※カスタマイズ済み |
| `.github/agents/speckit.{implement,tasks,plan,constitution,specify}.agent.md` | Copilot エージェント定義（5 ファイル）※カスタマイズ済み |
| `.github/workflows/ci.yml` | CI ワークフロー |
| `.specify/templates/tasks-template.md` | タスクテンプレート ※カスタマイズ済み |
| `CLAUDE.md` | プロジェクト指示 |
| `docs/` | ドキュメント |
| `src/`, `tests/`, その他ソースコード | アプリケーション本体 |

#### ZIP から除外されるパス（`export-ignore`）

speckit init が生成するカスタマイズなしのファイルと、開発用ファイルを除外。

| パス | 理由 |
|------|------|
| `.github/prompts/` | init が生成（カスタマイズなし） |
| `.claude/commands/speckit.{analyze,checklist,clarify,taskstoissues}.md` | init が生成（カスタマイズなし） |
| `.github/agents/speckit.{analyze,checklist,clarify,taskstoissues}.agent.md` | init が生成（カスタマイズなし） |
| `.specify/memory/` | init が生成（カスタマイズなし） |
| `.specify/scripts/` | init が生成（カスタマイズなし） |
| `.specify/templates/spec-template.md` | init が生成（カスタマイズなし） |
| `.specify/templates/plan-template.md` | init が生成（カスタマイズなし） |
| `.specify/templates/checklist-template.md` | init が生成（カスタマイズなし） |
| `.specify/templates/constitution-template.md` | init が生成（カスタマイズなし） |
| `.specify/templates/agent-file-template.md` | init が生成（カスタマイズなし） |
| `scripts/` | リリーススクリプト（開発用） |
| `specs/` | フィーチャー仕様（開発用） |
| `pnpm-lock.yaml` | ロックファイル |
| `playwright.samples.config.ts` | サンプル E2E 設定 |
| `.github/workflows/release.yml` | リリースワークフロー自身 |
