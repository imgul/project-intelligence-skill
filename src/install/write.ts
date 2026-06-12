import * as fs from "fs";
import * as path from "path";
import { expandPath } from "./paths.js";
import { JsonRecord, serializeConfig } from "./merge.js";

export interface WriteOptions {
  dryRun?: boolean;
  force?: boolean;
}

export interface WriteResult {
  written: boolean;
  backedUp?: string;
  reason?: string;
}

export function readConfigFile(configPath: string): {
  content: string;
  exists: boolean;
} {
  const resolved = expandPath(configPath);
  if (!fs.existsSync(resolved)) {
    return { content: "", exists: false };
  }
  return { content: fs.readFileSync(resolved, "utf-8"), exists: true };
}

export function writeConfigFile(
  configPath: string,
  config: JsonRecord,
  options: WriteOptions = {}
): WriteResult {
  const resolved = expandPath(configPath);
  const json = serializeConfig(config);

  if (options.dryRun) {
    return { written: false, reason: "dry-run" };
  }

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const originalMode = fs.existsSync(resolved)
    ? fs.statSync(resolved).mode & 0o777
    : 0o600;

  let backedUp: string | undefined;
  if (fs.existsSync(resolved)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    backedUp = `${resolved}.bak.${timestamp}`;
    fs.copyFileSync(resolved, backedUp);
  }

  const tmpPath = `${resolved}.tmp`;
  fs.writeFileSync(tmpPath, json, { mode: originalMode });

  try {
    const fd = fs.openSync(tmpPath, "r");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // fsync may fail on some platforms (e.g. Windows temp dirs); rename is still atomic
  }

  fs.renameSync(tmpPath, resolved);
  fs.chmodSync(resolved, originalMode);

  return { written: true, backedUp };
}
