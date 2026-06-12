import { describe, expect, it } from "vitest";
import {
  resolveInstallScope,
  shouldSkipPostinstall,
} from "../../src/install/detect.js";

describe("install detect", () => {
  it("resolves global scope from npm_config_global", () => {
    const original = process.env.npm_config_global;
    process.env.npm_config_global = "true";
    expect(resolveInstallScope()).toBe("global");
    if (original === undefined) delete process.env.npm_config_global;
    else process.env.npm_config_global = original;
  });

  it("defaults to project scope", () => {
    const original = process.env.npm_config_global;
    delete process.env.npm_config_global;
    expect(resolveInstallScope()).toBe("project");
    if (original !== undefined) process.env.npm_config_global = original;
  });

  it("skips postinstall in CI", () => {
    const original = process.env.CI;
    process.env.CI = "true";
    expect(shouldSkipPostinstall().skip).toBe(true);
    if (original === undefined) delete process.env.CI;
    else process.env.CI = original;
  });
});
