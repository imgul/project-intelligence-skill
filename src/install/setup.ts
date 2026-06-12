#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import {
  buildServerEntry,
  buildVsCodeServerEntry,
  filterByClient,
  getClientTargets,
} from "./client-matrix.js";
import {
  detectInstalledClients,
  getProjectRoot,
  isClientDetected,
  resolveInstallScope,
} from "./detect.js";
import {
  entriesEqual,
  getExistingServerEntry,
  mergeServerEntry,
  parseConfigJson,
} from "./merge.js";
import { readConfigFile, writeConfigFile } from "./write.js";
import {
  ClientId,
  ClientTarget,
  McpServerEntry,
  SERVER_NAME,
  SetupOptions,
  SetupResult,
} from "./types.js";

function getPackageVersion(): string {
  try {
    const pkgPath = path.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version: string };
    return pkg.version;
  } catch {
    return "latest";
  }
}

function parseArgs(argv: string[]): SetupOptions {
  const options: SetupOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    if (arg === "--force") options.force = true;
    if (arg === "--silent") options.silent = true;
    if (arg === "--global") options.globalInstall = true;
    if (arg === "--client" && argv[i + 1]) {
      options.client = argv[++i] as ClientId;
    }
    if (arg === "--project" && argv[i + 1]) {
      options.projectRoot = argv[++i];
    }
  }

  return options;
}

function tryClaudeCodeCli(entry: McpServerEntry, scope: "global" | "project"): boolean {
  try {
    const scopeFlag = scope === "project" ? "--scope project" : "";
    const args = entry.args.length > 0 ? entry.args.join(" ") : "";
    execSync(
      `claude mcp add ${scopeFlag} ${SERVER_NAME} ${entry.command} ${args}`.trim(),
      {
        stdio: "ignore",
      }
    );
    return true;
  } catch {
    return false;
  }
}

function installForTarget(
  target: ClientTarget,
  entry: McpServerEntry,
  options: SetupOptions
): SetupResult {
  const base: SetupResult = {
    client: target.id,
    label: target.label,
    configPath: target.configPath,
    status: "skipped",
  };

  if (!isClientDetected(target.id)) {
    return {
      ...base,
      status: "not-detected",
      message: "Client not detected on this system",
    };
  }

  if (
    (target.id === "claude-code-global" || target.id === "claude-code-project") &&
    !options.dryRun
  ) {
    const scope = target.id === "claude-code-project" ? "project" : "global";
    if (tryClaudeCodeCli(entry, scope)) {
      return { ...base, status: "installed", message: "Configured via claude mcp add" };
    }
  }

  const serverEntry =
    target.schema === "servers" || target.schema === "vscode-nested"
      ? { ...entry, type: "stdio" as const }
      : entry;

  const { content, exists } = readConfigFile(target.configPath);
  const config = exists ? parseConfigJson(content) : {};
  const existing = getExistingServerEntry(config, target.schema);

  if (existing && !options.force) {
    if (entriesEqual(existing, serverEntry)) {
      return { ...base, status: "exists", message: "Already configured (same entry)" };
    }
    return {
      ...base,
      status: "exists",
      message: `Entry "${SERVER_NAME}" already exists. Re-run with --force to overwrite.`,
    };
  }

  const merged = mergeServerEntry(config, target.schema, serverEntry);

  if (options.dryRun) {
    return {
      ...base,
      status: "installed",
      message: `Would write:\n${JSON.stringify(merged, null, 2)}`,
    };
  }

  try {
    const writeResult = writeConfigFile(target.configPath, merged, {
      dryRun: options.dryRun,
      force: options.force,
    });

    if (!writeResult.written) {
      return { ...base, status: "skipped", message: writeResult.reason };
    }

    const backupNote = writeResult.backedUp ? ` (backup: ${writeResult.backedUp})` : "";
    return {
      ...base,
      status: "installed",
      message: `Configured successfully${backupNote}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ...base, status: "error", message };
  }
}

export async function runSetup(
  argv: string[] = process.argv.slice(2)
): Promise<number> {
  const options = parseArgs(argv);
  const version = options.version || getPackageVersion();
  const useGlobalBin =
    options.globalInstall === true || resolveInstallScope() === "global";
  const scope = options.globalInstall ? "global" : resolveInstallScope();
  const projectRoot = options.projectRoot || getProjectRoot();

  const entry = buildServerEntry(version, useGlobalBin);
  // Validate VS Code entry shape
  buildVsCodeServerEntry(version, useGlobalBin);

  let targets = getClientTargets(scope, projectRoot);
  targets = filterByClient(targets, options.client);

  const clientIds = [...new Set(targets.map((t) => t.id))];
  const detected = new Set(detectInstalledClients(clientIds));

  const results: SetupResult[] = [];

  for (const target of targets) {
    if (!detected.has(target.id) && !options.client) {
      results.push({
        client: target.id,
        label: target.label,
        configPath: target.configPath,
        status: "not-detected",
      });
      continue;
    }

    if (options.client && target.id !== options.client) {
      continue;
    }

    results.push(installForTarget(target, entry, options));
  }

  if (!options.silent) {
    printReport(results, scope, projectRoot);
  }

  const hasError = results.some((r) => r.status === "error");
  const hasInstalled = results.some((r) => r.status === "installed");
  if (hasError) return 1;
  if (!hasInstalled && results.every((r) => r.status === "not-detected")) {
    return 0;
  }
  return 0;
}

function printReport(results: SetupResult[], scope: string, projectRoot: string): void {
  console.log("\nProject Intelligence MCP — Setup\n");
  console.log(`Scope: ${scope}${scope === "project" ? ` (${projectRoot})` : ""}\n`);

  for (const result of results) {
    const icon =
      result.status === "installed"
        ? "✓"
        : result.status === "exists"
          ? "○"
          : result.status === "error"
            ? "✗"
            : result.status === "not-detected"
              ? "-"
              : "·";

    console.log(`${icon} ${result.label}`);
    console.log(`  Path: ${result.configPath}`);
    if (result.message) {
      console.log(`  ${result.message}`);
    }
    console.log("");
  }

  const installed = results.filter((r) => r.status === "installed");
  if (installed.length > 0) {
    console.log("Restart your IDE or MCP client to load the server.\n");
  }
}

if (require.main === module) {
  runSetup().then((code) => process.exit(code));
}
