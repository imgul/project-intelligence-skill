import { describe, expect, it } from "vitest";
import {
  getExistingServerEntry,
  mergeServerEntry,
  parseConfigJson,
  serializeConfig,
} from "../../src/install/merge.js";
import { SERVER_NAME } from "../../src/install/types.js";

describe("install merge", () => {
  const entry = {
    command: "npx",
    args: ["-y", "project-intelligence-skill@1.2.0"],
    description: "test",
  };

  it("parses config with trailing commas", () => {
    const config = parseConfigJson(`{
      "theme": "dark",
      "mcpServers": {},
    }`);
    expect(config.theme).toBe("dark");
  });

  it("merges mcpServers without clobbering siblings", () => {
    const before = {
      theme: "dark",
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
      },
    };

    const merged = mergeServerEntry(before, "mcpServers", entry);
    expect(merged.theme).toBe("dark");
    expect((merged.mcpServers as Record<string, unknown>).filesystem).toBeDefined();
    expect((merged.mcpServers as Record<string, unknown>)[SERVER_NAME]).toEqual(entry);
  });

  it("merges VS Code servers schema with stdio type", () => {
    const merged = mergeServerEntry({}, "servers", { ...entry, type: "stdio" });
    const servers = merged.servers as Record<string, unknown>;
    expect(servers[SERVER_NAME]).toEqual({ ...entry, type: "stdio" });
  });

  it("merges nested VS Code global mcp.servers", () => {
    const before = { "editor.fontSize": 14 };
    const merged = mergeServerEntry(before, "vscode-nested", {
      ...entry,
      type: "stdio",
    });
    const mcp = merged.mcp as Record<string, unknown>;
    const servers = mcp.servers as Record<string, unknown>;
    expect(servers[SERVER_NAME]).toBeDefined();
    expect(merged["chat.mcp.enabled"]).toBe(true);
  });

  it("detects existing server entry", () => {
    const config = { mcpServers: { [SERVER_NAME]: entry } };
    expect(getExistingServerEntry(config, "mcpServers")).toEqual(entry);
  });

  it("serializes with trailing newline", () => {
    const json = serializeConfig({ mcpServers: {} });
    expect(json.endsWith("\n")).toBe(true);
  });
});
