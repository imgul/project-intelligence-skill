import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { expandPath, getAppDataPath } from "../../src/install/paths.js";

describe("install paths", () => {
  it("expands tilde paths", () => {
    const expanded = expandPath("~/.cursor/mcp.json");
    expect(expanded).toBe(path.join(os.homedir(), ".cursor", "mcp.json"));
  });

  it("expands APPDATA on Windows-style paths", () => {
    const appData =
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const expanded = expandPath("%APPDATA%/Claude/claude_desktop_config.json");
    expect(expanded).toContain("Claude");
    expect(expanded).toContain(appData.split(path.sep).pop() || "Claude");
  });

  it("returns app data path", () => {
    const appData = getAppDataPath();
    expect(appData.length).toBeGreaterThan(0);
  });
});
