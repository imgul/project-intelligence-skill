# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-12

### Changed

- README overhaul: quick start, tool/prompt tables, privacy section, troubleshooting, and client compatibility matrix

## [1.1.0] - 2026-06-12

### Added

- Cross-client MCP auto-setup on `npm install` (`postinstall` + `npx project-intelligence-skill setup`)
- IDE detection for Cursor, Claude Desktop, Windsurf, VS Code, Cline, and Claude Code
- MCP prompts: `plan-feature`, `discover-requirements`, `project-health-check`
- Python dependency analysis via `requirements.txt`
- Vulnerable dependency detection and security actions

### Changed

- `currentTask` now influences action scoring before generation
- `topic` and `userInput` filter/rank strategic questions
- Planning advisor uses project context, timeframe, and goal for phases and risks
- Tool output uses plain markdown instead of HTML `<details>` blocks

## [1.0.0] - 2026-06-12

### Added

- MCP server with three tools: `suggest_next_actions`, `generate_strategic_questions`, `generate_plan`
- Project analyzer with security, testing, CI, and deployment detection
- Vitest test suite for analyzers, generators, and Zod schemas
- GitHub Actions CI (build, lint, format check, test)
- ESLint, Prettier, Husky, and lint-staged
- npm `bin` entry (`project-intelligence`) for global/npx usage
- Expanded README with MCP configuration examples

### Changed

- Upgraded `@modelcontextprotocol/sdk` to v1.x
- Improved MCP server detection (`projectType: cli`)
- Reduced auth false positives from generator prompt templates

### Removed

- Unused `tree-sitter` dependency

[1.2.0]: https://github.com/imgul/project-intelligence-skill/releases/tag/v1.2.0
[1.1.0]: https://github.com/imgul/project-intelligence-skill/releases/tag/v1.1.0
[1.0.0]: https://github.com/imgul/project-intelligence-skill/releases/tag/v1.0.0
