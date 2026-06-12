export type ClientId =
  | "cursor"
  | "claude-desktop"
  | "windsurf"
  | "vscode-workspace"
  | "vscode-global"
  | "cline"
  | "claude-code-global"
  | "claude-code-project";

export type ConfigSchema = "mcpServers" | "servers" | "vscode-nested";

export type InstallScope = "global" | "project";

export interface McpServerEntry {
  command: string;
  args: string[];
  description?: string;
  type?: "stdio";
  env?: Record<string, string>;
}

export interface ClientTarget {
  id: ClientId;
  label: string;
  configPath: string;
  schema: ConfigSchema;
  scope: InstallScope;
  /** Global-only clients are configured even during local installs */
  alwaysGlobal?: boolean;
}

export interface SetupOptions {
  dryRun?: boolean;
  force?: boolean;
  client?: ClientId;
  projectRoot?: string;
  globalInstall?: boolean;
  version?: string;
  silent?: boolean;
}

export interface SetupResult {
  client: ClientId;
  label: string;
  configPath: string;
  status: "installed" | "skipped" | "exists" | "error" | "not-detected";
  message?: string;
}

export const SERVER_NAME = "project-intelligence";
