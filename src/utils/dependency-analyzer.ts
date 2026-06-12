import * as fs from "fs";
import * as path from "path";
import { DependencyInfo } from "../context/project-context.js";

export class DependencyAnalyzer {
  analyzePnpmJson(projectPath: string): DependencyInfo[] {
    const packageJsonPath = path.join(projectPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) return [];

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const dependencies: DependencyInfo[] = [];

      const addDeps = (
        deps: Record<string, string>,
        type: "production" | "development" | "peer"
      ) => {
        if (!deps) return;
        Object.entries(deps).forEach(([name, version]) => {
          dependencies.push({ name, version: version as string, type });
        });
      };

      addDeps(packageJson.dependencies, "production");
      addDeps(packageJson.devDependencies, "development");
      addDeps(packageJson.peerDependencies, "peer");

      return dependencies;
    } catch {
      return [];
    }
  }

  analyzePythonRequirements(projectPath: string): DependencyInfo[] {
    const requirementsPath = path.join(projectPath, "requirements.txt");
    if (!fs.existsSync(requirementsPath)) return [];

    try {
      const content = fs.readFileSync(requirementsPath, "utf-8");
      return content
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => {
          const [name, version] = line.split("==");
          return {
            name: name.trim(),
            version: version?.trim() || "latest",
            type: "production" as const,
          };
        });
    } catch {
      return [];
    }
  }

  detectSecurityIssues(dependencies: DependencyInfo[]): string[] {
    // Known vulnerable packages (simplified - in production use npm audit API)
    const knownVulnerable = [
      "event-stream",
      "eslint-scope",
      "flatmap-stream",
      "left-pad",
    ];

    return dependencies
      .filter((dep) => knownVulnerable.includes(dep.name))
      .map((dep) => `${dep.name}@${dep.version}`);
  }

  getPackageJson(projectPath: string): Record<string, unknown> | null {
    try {
      const content = fs.readFileSync(
        path.join(projectPath, "package.json"),
        "utf-8"
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}