import * as path from "path";
import { getAppDataPath, getCodeUserPath } from "./paths.js";
import { ClientId, ClientTarget, InstallScope, McpServerEntry } from "./types.js";

export function buildServerEntry(
  version: string,
  useGlobalBin: boolean
): McpServerEntry {
  const description =
    "AI-powered project intelligence: next actions, strategic questions, and planning";

  if (useGlobalBin) {
    return {
      command: "project-intelligence",
      args: [],
      description,
    };
  }

  return {
    command: "npx",
    args: ["-y", `project-intelligence-skill@${version}`],
    description,
  };
}

export function buildVsCodeServerEntry(
  version: string,
  useGlobalBin: boolean
): McpServerEntry {
  const base = buildServerEntry(version, useGlobalBin);
  return {
    ...base,
    type: "stdio",
  };
}

function globalTargets(): ClientTarget[] {
  const appData = getAppDataPath();
  const codeUser = getCodeUserPath();
  const home = process.env.HOME || process.env.USERPROFILE || "";

  return [
    {
      id: "cursor",
      label: "Cursor",
      configPath: getCursorGlobalPath(),
      schema: "mcpServers",
      scope: "global",
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      configPath:
        process.platform === "darwin"
          ? path.join(appData, "Claude", "claude_desktop_config.json")
          : process.platform === "win32"
            ? path.join(appData, "Claude", "claude_desktop_config.json")
            : path.join(appData, "Claude", "claude_desktop_config.json"),
      schema: "mcpServers",
      scope: "global",
      alwaysGlobal: true,
    },
    {
      id: "windsurf",
      label: "Windsurf (Codeium)",
      configPath: path.join(appData, "Codeium", "Windsurf", "mcp_config.json"),
      schema: "mcpServers",
      scope: "global",
    },
    {
      id: "vscode-global",
      label: "VS Code (global)",
      configPath: path.join(codeUser, "settings.json"),
      schema: "vscode-nested",
      scope: "global",
    },
    {
      id: "cline",
      label: "Cline",
      configPath: path.join(
        codeUser,
        "globalStorage",
        "saoudrizwan.claude-dev",
        "settings",
        "cline_mcp_settings.json"
      ),
      schema: "mcpServers",
      scope: "global",
      alwaysGlobal: true,
    },
    {
      id: "claude-code-global",
      label: "Claude Code (global)",
      configPath: path.join(home, ".claude", "settings.json"),
      schema: "mcpServers",
      scope: "global",
    },
  ];
}

function projectTargets(projectRoot: string): ClientTarget[] {
  return [
    {
      id: "cursor",
      label: "Cursor (project)",
      configPath: path.join(projectRoot, ".cursor", "mcp.json"),
      schema: "mcpServers",
      scope: "project",
    },
    {
      id: "windsurf",
      label: "Windsurf (project)",
      configPath: path.join(projectRoot, ".windsurf", "mcp.json"),
      schema: "mcpServers",
      scope: "project",
    },
    {
      id: "vscode-workspace",
      label: "VS Code (workspace)",
      configPath: path.join(projectRoot, ".vscode", "mcp.json"),
      schema: "servers",
      scope: "project",
    },
    {
      id: "claude-code-project",
      label: "Claude Code (project)",
      configPath: path.join(projectRoot, ".claude", "settings.json"),
      schema: "mcpServers",
      scope: "project",
    },
  ];
}

/** Cursor global path — ~/.cursor/mcp.json on all platforms */
export function getCursorGlobalPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".cursor", "mcp.json");
}

/** Windsurf alternate global path */
export function getWindsurfAlternateGlobalPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(home, ".windsurf", "mcp.json");
}

export function getClientTargets(
  scope: InstallScope,
  projectRoot: string
): ClientTarget[] {
  if (scope === "global") {
    const targets = globalTargets();
    targets.push({
      id: "windsurf",
      label: "Windsurf (alternate)",
      configPath: getWindsurfAlternateGlobalPath(),
      schema: "mcpServers",
      scope: "global",
    });
    return targets;
  }

  const project = projectTargets(projectRoot);
  const globalOnly = globalTargets().filter((t) => t.alwaysGlobal);
  return [...project, ...globalOnly];
}

export function filterByClient(
  targets: ClientTarget[],
  clientId?: ClientId
): ClientTarget[] {
  if (!clientId) return targets;

  if (clientId === "cursor") {
    return targets.filter((t) => t.id === "cursor");
  }
  if (clientId === "windsurf") {
    return targets.filter((t) => t.id === "windsurf");
  }
  if (clientId === "vscode-workspace" || clientId === "vscode-global") {
    return targets.filter((t) => t.id === clientId);
  }
  if (clientId === "claude-code-global" || clientId === "claude-code-project") {
    return targets.filter((t) => t.id === clientId);
  }

  return targets.filter((t) => t.id === clientId);
}
