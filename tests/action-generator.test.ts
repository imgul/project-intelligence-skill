import { describe, it, expect } from "vitest";
import { ActionGenerator } from "../src/generators/action-generator.js";
import { ProjectContext } from "../src/context/project-context.js";

function baseContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectName: "test-project",
    projectPath: "/tmp/test-project",
    projectType: "api",
    framework: "express",
    language: ["typescript"],
    files: [],
    directories: [],
    totalFiles: 10,
    totalLines: 500,
    dependencies: [],
    hasPackageJson: true,
    hasRequirementsTxt: false,
    hasPomXml: false,
    hasTests: false,
    hasCI: false,
    hasDocker: false,
    hasKubernetes: false,
    hasDatabase: false,
    hasAuthentication: false,
    hasAPI: true,
    apiType: "REST",
    hasFrontend: false,
    hasStateManagement: false,
    hasLinting: false,
    hasFormatting: false,
    hasTypeChecking: true,
    hasHusky: false,
    hasEnvFile: false,
    hasEnvExample: false,
    exposedSecrets: [],
    missingSecurityHeaders: [],
    isGitRepo: false,
    recentlyModifiedFiles: [],
    currentWorkContext: {
      phase: "feature-development",
      recentChanges: [],
      openTasks: [],
    },
    hasVercelConfig: false,
    hasNetlifyConfig: false,
    hasHerokuConfig: false,
    hasAwsConfig: false,
    hasNginxConfig: false,
    hasReadme: true,
    hasChangelog: false,
    hasApiDocs: false,
    hasJSDoc: false,
    ...overrides,
  };
}

describe("ActionGenerator", () => {
  const generator = new ActionGenerator();

  it("returns requested number of diverse actions", () => {
    const actions = generator.generateActions(baseContext(), 5);
    expect(actions).toHaveLength(5);
    const categories = new Set(actions.map((a) => a.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  it("prioritizes testing when no tests exist", () => {
    const actions = generator.generateActions(baseContext({ hasTests: false }), 5);
    expect(actions.some((a) => a.category === "testing")).toBe(true);
  });

  it("does not suggest authentication for MCP cli servers", () => {
    const actions = generator.generateActions(
      baseContext({
        projectType: "cli",
        framework: "unknown",
        hasAPI: false,
        hasFrontend: false,
      }),
      10
    );
    expect(actions.some((a) => a.category === "authentication")).toBe(false);
  });

  it("suggests deployment when no CI exists", () => {
    const actions = generator.generateActions(baseContext({ hasCI: false }), 5);
    expect(
      actions.some((a) => a.category === "deployment" || a.category === "devops")
    ).toBe(true);
  });
});
