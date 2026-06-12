import { ConfigSchema, McpServerEntry, SERVER_NAME } from "./types.js";

export type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseConfigJson(content: string): JsonRecord {
  const trimmed = content.trim();
  if (!trimmed) return {};

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : {};
  } catch {
    // Tolerate trailing commas (common in hand-edited configs)
    const withoutTrailingCommas = trimmed.replace(/,\s*([}\]])/g, "$1");
    const parsed: unknown = JSON.parse(withoutTrailingCommas);
    return isRecord(parsed) ? parsed : {};
  }
}

export function getExistingServerEntry(
  config: JsonRecord,
  schema: ConfigSchema
): McpServerEntry | undefined {
  if (schema === "mcpServers") {
    const servers = config.mcpServers;
    if (!isRecord(servers)) return undefined;
    const entry = servers[SERVER_NAME];
    return isRecord(entry) ? (entry as unknown as McpServerEntry) : undefined;
  }

  if (schema === "servers") {
    const servers = config.servers;
    if (!isRecord(servers)) return undefined;
    const entry = servers[SERVER_NAME];
    return isRecord(entry) ? (entry as unknown as McpServerEntry) : undefined;
  }

  const mcp = config.mcp;
  if (!isRecord(mcp)) return undefined;
  const servers = mcp.servers;
  if (!isRecord(servers)) return undefined;
  const entry = servers[SERVER_NAME];
  return isRecord(entry) ? (entry as unknown as McpServerEntry) : undefined;
}

export function mergeServerEntry(
  config: JsonRecord,
  schema: ConfigSchema,
  entry: McpServerEntry
): JsonRecord {
  const result = deepClone(config);

  if (schema === "mcpServers") {
    const servers = isRecord(result.mcpServers) ? result.mcpServers : {};
    result.mcpServers = { ...servers, [SERVER_NAME]: entry };
    return result;
  }

  if (schema === "servers") {
    const servers = isRecord(result.servers) ? result.servers : {};
    result.servers = { ...servers, [SERVER_NAME]: entry };
    return result;
  }

  const mcp = isRecord(result.mcp) ? result.mcp : {};
  const servers = isRecord(mcp.servers) ? mcp.servers : {};
  result.mcp = {
    ...mcp,
    servers: { ...servers, [SERVER_NAME]: entry },
  };

  // Enable MCP in VS Code global settings when missing
  if (result["chat.mcp.enabled"] === undefined) {
    result["chat.mcp.enabled"] = true;
  }

  return result;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function serializeConfig(config: JsonRecord): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function entriesEqual(a: McpServerEntry, b: McpServerEntry): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
