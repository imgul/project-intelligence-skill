# Project Intelligence Skill

An MCP server that analyzes your codebase and returns actionable next steps, strategic questions, and phased implementation plans.

## Features

### `suggest_next_actions`

Analyzes project structure, security, testing, CI/CD, documentation, and more. Returns 4–5 prioritized actions with ready-to-use prompts.

### `generate_strategic_questions`

Generates clarifying questions in three modes:

- **planning** — architecture, scale, and strategy
- **agent** — implementation details while building
- **asking** — requirements discovery

### `generate_plan`

Creates a phased plan for a specific goal with risks, mitigations, and pre-planning questions.

## Installation

### From source

```bash
git clone https://github.com/imgul/project-intelligence-skill.git
cd project-intelligence-skill
npm install
npm run build
```

### From npm (after publish)

```bash
npm install -g project-intelligence-skill
```

## MCP Configuration

### Cursor

Add to your Cursor MCP settings (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

**Local build (absolute path):**

```json
{
  "mcpServers": {
    "project-intelligence": {
      "command": "node",
      "args": ["/absolute/path/to/project-intelligence-skill/dist/index.js"]
    }
  }
}
```

**Via npx (after npm publish):**

```json
{
  "mcpServers": {
    "project-intelligence": {
      "command": "npx",
      "args": ["-y", "project-intelligence-skill"]
    }
  }
}
```

See [docs/cursor-config.json](docs/cursor-config.json) for a ready-made example.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "project-intelligence": {
      "command": "node",
      "args": ["/absolute/path/to/project-intelligence-skill/dist/index.js"]
    }
  }
}
```

See [docs/claude-desktop-config.json](docs/claude-desktop-config.json).

### VS Code

See [docs/.vscode/mcp.json](docs/.vscode/mcp.json).

## Tool Examples

### suggest_next_actions

```json
{
  "projectPath": "/path/to/your/project",
  "count": 5,
  "focusArea": "all",
  "currentTask": "adding authentication"
}
```

`focusArea` options: `security`, `performance`, `testing`, `deployment`, `ui-ux`, `feature`, `all`

### generate_strategic_questions

```json
{
  "projectPath": "/path/to/your/project",
  "mode": "planning",
  "count": 5,
  "topic": "deployment strategy"
}
```

### generate_plan

```json
{
  "projectPath": "/path/to/your/project",
  "goal": "Add comprehensive test coverage",
  "timeframe": "this-sprint",
  "constraints": "Solo developer, no staging environment"
}
```

## Development

```bash
npm run dev          # Run server via ts-node
npm run watch        # TypeScript watch mode
npm test             # Run Vitest suite
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
npm run build        # Compile to dist/
```

## Project Structure

```
src/
  analyzers/     # Project, security, and UI analysis
  generators/    # Action and question generation
  tools/         # MCP tool handlers
  utils/         # File scanning, git, dependencies
  context/       # Shared types
tests/           # Vitest tests and fixtures
docs/            # Sample MCP configs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `npm test`, `npm run lint`, and `npm run format:check`
4. Open a pull request

## License

[MIT](LICENSE)
