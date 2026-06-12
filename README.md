# Project Intelligence Skill

[![npm version](https://img.shields.io/npm/v/project-intelligence-skill)](https://www.npmjs.com/package/project-intelligence-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-6366f1)](https://modelcontextprotocol.io)

**Local-first MCP server** that inspects your repository and returns prioritized next actions, strategic questions, and phased implementation plans — with copy-paste prompts your AI assistant can run immediately.

Works with [Cursor](https://cursor.com), [Claude Desktop](https://claude.ai/download), [Windsurf](https://windsurf.com), [VS Code](https://code.visualstudio.com), [Cline](https://cline.bot), and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## Table of contents

- [Quick start](#quick-start)
- [What it does](#what-it-does)
- [Tools](#tools)
- [Prompts](#prompts)
- [Installation](#installation)
- [Manual configuration](#manual-configuration)
- [Supported clients](#supported-clients)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Privacy](#privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Quick start

```bash
# Install and auto-configure detected IDEs (recommended)
npm install -g project-intelligence-skill

# Or try without installing globally
npx -y project-intelligence-skill setup
```

Restart your editor, then ask your AI assistant to use **Project Intelligence** — for example:

> "Run a project health check on this repo and suggest the top 5 next actions."

No API keys required. Analysis runs locally against files on disk.

---

## What it does

```text
Your repo  →  Project Analyzer  →  Generators  →  MCP tools / prompts
                  │                    │
                  ├─ structure         ├─ prioritized actions
                  ├─ security          ├─ strategic questions
                  ├─ tests / CI        └─ phased plans + risks
                  └─ dependencies
```

The server reads project files (respecting `.gitignore`), detects framework and maturity signals, and produces **actionable output** — not generic advice.

---

## Tools

| Tool | Description |
|------|-------------|
| `suggest_next_actions` | 4–5 prioritized improvements with full implementation prompts (security, testing, CI, UX, performance, …) |
| `generate_strategic_questions` | Clarifying questions in `planning`, `agent`, or `asking` mode |
| `generate_plan` | Phased plan for a goal with pre-planning questions, risks, and mitigations |

### `suggest_next_actions`

```json
{
  "projectPath": "/path/to/your/project",
  "count": 5,
  "focusArea": "all",
  "currentTask": "adding authentication"
}
```

`focusArea`: `security` · `performance` · `testing` · `deployment` · `ui-ux` · `feature` · `all`

### `generate_strategic_questions`

```json
{
  "projectPath": "/path/to/your/project",
  "mode": "planning",
  "count": 5,
  "topic": "deployment strategy",
  "userInput": "We need to ship to production next week"
}
```

`mode`: `planning` (strategy) · `agent` (implementation) · `asking` (requirements)

### `generate_plan`

```json
{
  "projectPath": "/path/to/your/project",
  "goal": "Add comprehensive test coverage",
  "timeframe": "this-sprint",
  "constraints": "Solo developer, no staging environment"
}
```

`timeframe`: `today` · `this-week` · `this-sprint` · `this-month` · `this-quarter`

---

## Prompts

Built-in [MCP prompts](https://modelcontextprotocol.io/docs/concepts/prompts) wrap the tools for faster discovery in compatible clients:

| Prompt | Use when |
|--------|----------|
| `plan-feature` | You have a goal and need a phased implementation plan |
| `discover-requirements` | You need requirements-clarification questions before building |
| `project-health-check` | You want a full audit and prioritized next actions |

---

## Installation

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- An MCP-compatible editor (see [supported clients](#supported-clients))

### npm (recommended)

**Global** — available in every project:

```bash
npm install -g project-intelligence-skill
```

**Per-project** — writes config into the current repo:

```bash
npm install project-intelligence-skill
```

### Auto-setup

`postinstall` detects your OS and installed editors, then merges a server entry into the right MCP config files — without removing your existing servers.

| Install type | Where config is written |
|--------------|-------------------------|
| Global (`-g`) | User-level paths (`~/.cursor/mcp.json`, Claude Desktop, …) |
| Local | Project paths (`.cursor/mcp.json`, `.vscode/mcp.json`, …) plus global desktop apps |

**Opt out** (CI, corporate machines, manual control):

```bash
PROJECT_INTELLIGENCE_SKIP_SETUP=1 npm install project-intelligence-skill
```

**Manual setup** (preview, single client, or force overwrite):

```bash
npx project-intelligence-skill setup
npx project-intelligence-skill setup --dry-run      # preview changes
npx project-intelligence-skill setup --force        # overwrite existing entry
npx project-intelligence-skill setup --client cursor
```

> **Important:** Restart your IDE after install or setup so it reloads MCP configuration.

### From source

```bash
git clone https://github.com/imgul/project-intelligence-skill.git
cd project-intelligence-skill
npm install
npm run build
npm run setup
```

---

## Manual configuration

Use this if auto-setup was skipped or you prefer to edit configs yourself.

**Cursor / Claude Desktop / Windsurf / Claude Code** (`mcpServers`):

```json
{
  "mcpServers": {
    "project-intelligence": {
      "command": "npx",
      "args": ["-y", "project-intelligence-skill@1.2.0"],
      "description": "AI-powered project intelligence: next actions, strategic questions, and planning"
    }
  }
}
```

**VS Code workspace** (`.vscode/mcp.json` — note `servers`, not `mcpServers`):

```json
{
  "servers": {
    "project-intelligence": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "project-intelligence-skill@1.2.0"]
    }
  }
}
```

Ready-made samples: [docs/cursor-config.json](docs/cursor-config.json) · [docs/claude-desktop-config.json](docs/claude-desktop-config.json) · [docs/.vscode/mcp.json](docs/.vscode/mcp.json)

---

## Supported clients

| Client | Global config | Project config | Schema key |
|--------|---------------|----------------|------------|
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | `mcpServers` |
| Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` (Windows) · `~/Library/Application Support/Claude/…` (macOS) | — | `mcpServers` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `.windsurf/mcp.json` | `mcpServers` |
| VS Code | `settings.json` → `mcp.servers` | `.vscode/mcp.json` | `servers` |
| Cline | VS Code `globalStorage/…/cline_mcp_settings.json` | — | `mcpServers` |
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` | `mcpServers` |

Auto-setup uses **deep merge**: sibling servers and unrelated config keys are preserved. Existing `project-intelligence` entries are left untouched unless you pass `--force`.

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Server missing after install | Restart IDE; run `npx project-intelligence-skill setup --dry-run` |
| `Entry already exists` | `npx project-intelligence-skill setup --force` |
| `spawn npx ENOENT` | Install Node.js globally or set the full path to `node` in your MCP config |
| Auto-setup skipped in CI | Expected — run `setup` locally on your machine |
| Tools not listed in chat | Enable MCP tools in your client (e.g. Cursor **Settings → Tools & MCP**) |
| Red / error status in MCP panel | Check client MCP logs; verify `node` and `npx` are on the PATH your IDE sees |

---

## Development

```bash
npm run dev          # MCP server via ts-node
npm run build        # Compile to dist/
npm test             # Vitest
npm run lint         # ESLint
npm run format:check # Prettier
npm run typecheck    # tsc --noEmit
npm run setup        # Configure detected IDEs
```

### Project layout

```text
src/
  analyzers/     # Project, security, UI analysis
  generators/    # Actions and questions
  install/       # Cross-client MCP auto-setup
  tools/         # MCP tool handlers
  utils/         # File scan, git, dependencies
  context/       # Shared types
tests/           # Vitest + fixtures
docs/            # Sample MCP configs
```

---

## Privacy

- **Local analysis only** — reads files from the `projectPath` you provide; no telemetry or external API calls.
- **Stdio transport** — standard MCP over stdin/stdout; no network listener.
- **Config writes** — auto-setup only touches MCP JSON files; timestamped backups are created before overwrite.

---

## Contributing

Contributions are welcome. Please:

1. Fork the repo and create a feature branch
2. Run `npm test`, `npm run lint`, and `npm run format:check`
3. Open a pull request with a clear description

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## License

[MIT](LICENSE) © contributors
