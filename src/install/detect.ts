import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { getAppDataPath, getCodeUserPath } from "./paths.js";
import {
  getCursorGlobalPath,
  getWindsurfAlternateGlobalPath,
} from "./client-matrix.js";
import { ClientId } from "./types.js";

function pathExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function parentExists(filePath: string): boolean {
  return pathExists(path.dirname(filePath));
}

function commandExists(command: string): boolean {
  try {
    const which = process.platform === "win32" ? "where" : "which";
    execSync(`${which} ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const DETECTORS: Record<ClientId, () => boolean> = {
  cursor: () =>
    parentExists(getCursorGlobalPath()) ||
    pathExists("/Applications/Cursor.app") ||
    pathExists(
      path.join(process.env.LOCALAPPDATA || "", "Programs", "cursor", "Cursor.exe")
    ),
  "claude-desktop": () => {
    const appData = getAppDataPath();
    return (
      parentExists(path.join(appData, "Claude", "claude_desktop_config.json")) ||
      pathExists("/Applications/Claude.app") ||
      pathExists(
        path.join(process.env.LOCALAPPDATA || "", "Programs", "Claude", "Claude.exe")
      )
    );
  },
  windsurf: () => {
    const appData = getAppDataPath();
    return (
      parentExists(path.join(appData, "Codeium", "Windsurf")) ||
      parentExists(getWindsurfAlternateGlobalPath()) ||
      pathExists("/Applications/Windsurf.app")
    );
  },
  "vscode-workspace": () => commandExists("code") || parentExists(getCodeUserPath()),
  "vscode-global": () => commandExists("code") || parentExists(getCodeUserPath()),
  cline: () =>
    pathExists(path.join(getCodeUserPath(), "globalStorage", "saoudrizwan.claude-dev")),
  "claude-code-global": () =>
    commandExists("claude") ||
    parentExists(
      path.join(process.env.HOME || process.env.USERPROFILE || "", ".claude")
    ),
  "claude-code-project": () =>
    commandExists("claude") ||
    parentExists(
      path.join(process.env.HOME || process.env.USERPROFILE || "", ".claude")
    ),
};

export function isClientDetected(clientId: ClientId): boolean {
  const detector = DETECTORS[clientId];
  return detector ? detector() : false;
}

export function detectInstalledClients(clientIds: ClientId[]): ClientId[] {
  return clientIds.filter((id) => isClientDetected(id));
}

export function resolveInstallScope(): "global" | "project" {
  if (process.env.npm_config_global === "true") {
    return "global";
  }

  const execPath = process.env.npm_execpath || "";
  const prefix = process.env.npm_config_prefix || "";
  if (prefix && execPath.includes(prefix.replace(/\\/g, "/"))) {
    return "global";
  }

  return "project";
}

export function getProjectRoot(): string {
  return process.env.INIT_CWD || process.cwd();
}

export function shouldSkipPostinstall(): { skip: boolean; reason?: string } {
  if (process.env.CI === "true") {
    return { skip: true, reason: "CI environment" };
  }
  if (process.env.PROJECT_INTELLIGENCE_SKIP_SETUP === "1") {
    return { skip: true, reason: "PROJECT_INTELLIGENCE_SKIP_SETUP=1" };
  }
  return { skip: false };
}
