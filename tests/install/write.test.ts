import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { readConfigFile, writeConfigFile } from "../../src/install/write.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-install-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("install write", () => {
  it("creates config with safe default mode for new files", () => {
    const dir = makeTempDir();
    const configPath = path.join(dir, "mcp.json");

    const result = writeConfigFile(configPath, { mcpServers: {} });
    expect(result.written).toBe(true);
    expect(fs.existsSync(configPath)).toBe(true);

    if (process.platform !== "win32") {
      const mode = fs.statSync(configPath).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it("preserves existing file mode", () => {
    const dir = makeTempDir();
    const configPath = path.join(dir, "mcp.json");
    fs.writeFileSync(configPath, "{}", { mode: 0o600 });

    writeConfigFile(configPath, {
      mcpServers: { test: { command: "node", args: [] } },
    });
    if (process.platform !== "win32") {
      const mode = fs.statSync(configPath).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it("creates timestamped backup", () => {
    const dir = makeTempDir();
    const configPath = path.join(dir, "mcp.json");
    fs.writeFileSync(configPath, '{"theme":"dark"}', { mode: 0o600 });

    const result = writeConfigFile(configPath, { mcpServers: {} });
    expect(result.backedUp).toBeDefined();
    expect(fs.existsSync(result.backedUp!)).toBe(true);
  });

  it("reads missing file as empty", () => {
    const dir = makeTempDir();
    const { content, exists } = readConfigFile(path.join(dir, "missing.json"));
    expect(exists).toBe(false);
    expect(content).toBe("");
  });
});
