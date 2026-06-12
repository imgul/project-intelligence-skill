import * as path from "path";
import { describe, it, expect } from "vitest";
import { ProjectAnalyzer } from "../src/analyzers/project-analyzer.js";

const fixtures = path.join(__dirname, "fixtures");
const repoRoot = path.join(__dirname, "..");

describe("ProjectAnalyzer", () => {
  const analyzer = new ProjectAnalyzer();

  it("detects tests in fixture project", async () => {
    const context = await analyzer.analyze(path.join(fixtures, "with-tests"));
    expect(context.hasTests).toBe(true);
    expect(context.framework).toBe("express");
  });

  it("detects CI in fixture project", async () => {
    const context = await analyzer.analyze(path.join(fixtures, "with-ci"));
    expect(context.hasCI).toBe(true);
    expect(context.hasTests).toBe(false);
  });

  it("detects express API project", async () => {
    const context = await analyzer.analyze(path.join(fixtures, "express-app"));
    expect(context.framework).toBe("express");
    expect(context.hasAPI).toBe(true);
    expect(context.apiType).toBe("REST");
  });

  it("detects this repo as MCP cli server", async () => {
    const context = await analyzer.analyze(repoRoot);
    expect(context.projectType).toBe("cli");
    expect(context.framework).toBe("unknown");
    expect(context.hasAPI).toBe(false);
    expect(context.hasCI).toBe(true);
    expect(context.hasTests).toBe(true);
    expect(
      context.dependencies.some((d) => d.name === "@modelcontextprotocol/sdk")
    ).toBe(true);
  });

  it("does not false-positive auth from generator prompt strings", async () => {
    const context = await analyzer.analyze(repoRoot);
    expect(context.hasAuthentication).toBe(false);
  });

  it("detects TypeScript and type checking in this repo", async () => {
    const context = await analyzer.analyze(repoRoot);
    expect(context.language).toContain("typescript");
    expect(context.hasTypeChecking).toBe(true);
  });
});
