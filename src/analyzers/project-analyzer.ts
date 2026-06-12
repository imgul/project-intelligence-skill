import * as path from "path";
import { FileScanner } from "../utils/file-scanner.js";
import { GitAnalyzer } from "../utils/git-analyzer.js";
import { DependencyAnalyzer } from "../utils/dependency-analyzer.js";
import {
  ProjectContext,
  FileInfo,
  CommitInfo,
  ProjectType,
  Framework,
  Language,
  WorkContext,
  WorkPhase,
} from "../context/project-context.js";

export class ProjectAnalyzer {
  private fileScanner: FileScanner;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor() {
    this.fileScanner = new FileScanner();
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  async analyze(projectPath: string): Promise<ProjectContext> {
    const absolutePath = path.resolve(projectPath);
    const projectName = path.basename(absolutePath);

    // Scan files
    const files = await this.fileScanner.scanDirectory(absolutePath);
    const directories = this.fileScanner.getDirectories(absolutePath);

    // Analyze dependencies
    const npmDependencies = this.dependencyAnalyzer.analyzePnpmJson(absolutePath);
    const pythonDependencies =
      this.dependencyAnalyzer.analyzePythonRequirements(absolutePath);
    const dependencies = [...npmDependencies, ...pythonDependencies];
    const vulnerableDependencies =
      this.dependencyAnalyzer.detectSecurityIssues(dependencies);
    dependencies.forEach((dep) => {
      if (vulnerableDependencies.some((v) => v.startsWith(`${dep.name}@`))) {
        dep.hasVulnerability = true;
      }
    });

    // Git analysis
    const gitAnalyzer = new GitAnalyzer(absolutePath);
    const isGitRepo = await gitAnalyzer.isGitRepo();
    const gitInfo = isGitRepo ? await gitAnalyzer.getGitInfo() : null;
    const recentlyModifiedFiles = isGitRepo
      ? await gitAnalyzer.getRecentlyModifiedFiles(7)
      : [];

    // Detect project characteristics
    const framework = this.detectFramework(files, dependencies);
    const language = this.detectLanguages(files);
    const isMcpServer = this.detectMcpServer(files, dependencies);
    const projectType = this.detectProjectType(
      files,
      framework,
      dependencies,
      isMcpServer
    );

    // Feature detection
    const hasTests = this.detectTests(files);
    const hasCI = this.detectCI(files);
    const hasDocker = this.detectDocker(files);
    const hasKubernetes = this.detectKubernetes(files);
    const hasDatabase = this.detectDatabase(files, dependencies);
    const hasAuthentication = this.detectAuthentication(files, dependencies);
    const hasAPI = isMcpServer ? false : this.detectAPI(files, framework);
    const hasFrontend = this.detectFrontend(framework, files);

    // Security checks
    const hasEnvFile = this.fileScanner.fileExists(path.join(absolutePath, ".env"));
    const hasEnvExample =
      this.fileScanner.fileExists(path.join(absolutePath, ".env.example")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".env.sample"));
    const exposedSecrets = this.detectExposedSecrets(files);

    // Deployment detection
    const hasVercelConfig =
      this.fileScanner.fileExists(path.join(absolutePath, "vercel.json")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".vercel"));
    const hasNetlifyConfig = this.fileScanner.fileExists(
      path.join(absolutePath, "netlify.toml")
    );
    const hasHerokuConfig = this.fileScanner.fileExists(
      path.join(absolutePath, "Procfile")
    );
    const hasAwsConfig =
      this.fileScanner.fileExists(path.join(absolutePath, "serverless.yml")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "template.yaml")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".aws"));
    const hasNginxConfig = files.some(
      (f) => f.path.includes("nginx") && f.extension === ".conf"
    );

    // Documentation
    const hasReadme =
      this.fileScanner.fileExists(path.join(absolutePath, "README.md")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "readme.md"));
    const hasChangelog =
      this.fileScanner.fileExists(path.join(absolutePath, "CHANGELOG.md")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "CHANGELOG"));
    const hasApiDocs = files.some(
      (f) =>
        f.path.includes("swagger") ||
        f.path.includes("openapi") ||
        f.path.includes("api-docs")
    );

    // Code quality
    const hasLinting =
      this.fileScanner.fileExists(path.join(absolutePath, ".eslintrc")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".eslintrc.js")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".eslintrc.json")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".eslintrc.yaml")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "eslint.config.js"));
    const hasFormatting =
      this.fileScanner.fileExists(path.join(absolutePath, ".prettierrc")) ||
      this.fileScanner.fileExists(path.join(absolutePath, ".prettierrc.json")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "prettier.config.js"));
    const hasTypeChecking =
      this.fileScanner.fileExists(path.join(absolutePath, "tsconfig.json")) ||
      this.fileScanner.fileExists(path.join(absolutePath, "mypy.ini"));
    const hasHusky =
      this.fileScanner.fileExists(path.join(absolutePath, ".husky")) ||
      dependencies.some((d) => d.name === "husky");

    // Count total lines
    const totalLines = files.reduce((acc, file) => {
      if (file.content) {
        return acc + file.content.split("\n").length;
      }
      return acc;
    }, 0);

    // Determine current work context
    const currentWorkContext = this.determineWorkContext(
      files,
      gitInfo,
      recentlyModifiedFiles
    );

    // Detect state management
    const stateManagementLib = this.detectStateManagement(dependencies);
    const apiType = isMcpServer
      ? undefined
      : this.detectAPIType(files, dependencies, framework);
    const databaseType = this.detectDatabaseType(files, dependencies);
    const frontendFramework = this.detectFrontendFramework(framework);

    return {
      projectName,
      projectPath: absolutePath,
      projectType,
      framework,
      language,
      files,
      directories,
      totalFiles: files.length,
      totalLines,
      dependencies,
      hasPackageJson: this.fileScanner.fileExists(
        path.join(absolutePath, "package.json")
      ),
      hasRequirementsTxt:
        this.fileScanner.fileExists(path.join(absolutePath, "requirements.txt")) ||
        this.fileScanner.fileExists(path.join(absolutePath, "pyproject.toml")),
      hasPomXml: this.fileScanner.fileExists(path.join(absolutePath, "pom.xml")),
      hasTests,
      hasCI,
      hasDocker,
      hasKubernetes,
      hasDatabase,
      databaseType,
      hasAuthentication,
      hasAPI,
      apiType,
      hasFrontend,
      frontendFramework,
      hasStateManagement: !!stateManagementLib,
      stateManagementLib,
      hasLinting,
      hasFormatting,
      hasTypeChecking,
      hasHusky,
      hasEnvFile,
      hasEnvExample,
      exposedSecrets,
      missingSecurityHeaders: this.detectMissingSecurityHeaders(files),
      vulnerableDependencies:
        vulnerableDependencies.length > 0 ? vulnerableDependencies : undefined,
      gitInfo: gitInfo || undefined,
      isGitRepo,
      recentlyModifiedFiles,
      currentWorkContext,
      hasVercelConfig,
      hasNetlifyConfig,
      hasHerokuConfig,
      hasAwsConfig,
      hasNginxConfig,
      hasReadme,
      hasChangelog,
      hasApiDocs,
      hasJSDoc: this.detectJSDoc(files),
    };
  }

  private getAnalysisFiles(files: FileInfo[]): FileInfo[] {
    return files.filter(
      (f) =>
        !f.path.includes("generators/") &&
        !f.path.includes("fixtures/") &&
        !f.path.includes("dist/")
    );
  }

  private detectFramework(
    files: FileInfo[],
    dependencies: { name: string }[]
  ): Framework {
    const depNames = dependencies.map((d) => d.name);
    const analysisFiles = this.getAnalysisFiles(files);
    const fileContents = analysisFiles.map((f) => f.path).join(" ");

    if (depNames.includes("@modelcontextprotocol/sdk")) {
      return "unknown";
    }

    if (depNames.includes("next") || fileContents.includes("next.config")) {
      return "nextjs";
    }
    if (depNames.includes("nuxt") || fileContents.includes("nuxt.config")) {
      return "nuxt";
    }
    if (depNames.includes("@nestjs/core")) return "nestjs";
    if (depNames.includes("fastify")) return "fastify";
    if (depNames.includes("express")) return "express";
    if (depNames.includes("react") || depNames.includes("react-dom")) {
      return "react";
    }
    if (depNames.includes("vue") || depNames.includes("@vue/core")) {
      return "vue";
    }
    if (depNames.includes("@angular/core")) return "angular";
    if (depNames.includes("svelte") || depNames.includes("@sveltejs/kit")) {
      return "svelte";
    }

    // Python frameworks (implementation files only)
    if (
      analysisFiles.some(
        (f) =>
          f.content?.includes("from django") || f.content?.includes("import django")
      )
    ) {
      return "django";
    }
    if (
      analysisFiles.some(
        (f) =>
          f.content?.includes("from fastapi") || f.content?.includes("import fastapi")
      )
    ) {
      return "fastapi";
    }
    if (
      analysisFiles.some(
        (f) => f.content?.includes("from flask") || f.content?.includes("import flask")
      )
    ) {
      return "flask";
    }

    return "unknown";
  }

  private detectLanguages(files: FileInfo[]): Language[] {
    const languages = new Set<Language>();
    const extensionMap: Record<string, Language> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".php": "php",
      ".rb": "ruby",
      ".cs": "csharp",
      ".kt": "kotlin",
      ".swift": "swift",
    };

    files.forEach((file) => {
      const lang = extensionMap[file.extension];
      if (lang) languages.add(lang);
    });

    return Array.from(languages);
  }

  private detectMcpServer(
    files: FileInfo[],
    dependencies: { name: string }[]
  ): boolean {
    if (dependencies.some((d) => d.name === "@modelcontextprotocol/sdk")) {
      return true;
    }
    return files.some(
      (f) =>
        f.content?.includes("StdioServerTransport") ||
        f.content?.includes("@modelcontextprotocol/sdk")
    );
  }

  private detectProjectType(
    files: FileInfo[],
    framework: Framework,
    dependencies: { name: string }[],
    isMcpServer: boolean
  ): ProjectType {
    const depNames = dependencies.map((d) => d.name);

    if (isMcpServer) {
      return "cli";
    }

    if (files.some((f) => f.path.includes("packages/") || f.path.includes("apps/"))) {
      return "monorepo";
    }
    if (
      framework === "nextjs" ||
      framework === "nuxt" ||
      (["react", "vue", "angular", "svelte"].includes(framework) &&
        ["express", "fastify", "nestjs"].some((f) => depNames.includes(f)))
    ) {
      return "fullstack";
    }
    if (["react", "vue", "angular", "svelte"].includes(framework)) {
      return "web-app";
    }
    if (["express", "fastify", "nestjs", "django", "fastapi"].includes(framework)) {
      return "api";
    }
    if (depNames.includes("react-native") || depNames.includes("expo")) {
      return "mobile";
    }
    if (depNames.some((d) => d.includes("electron"))) {
      return "desktop";
    }

    return "unknown";
  }

  private detectTests(files: FileInfo[]): boolean {
    return files.some(
      (f) =>
        f.path.includes("__tests__") ||
        f.path.includes(".test.") ||
        f.path.includes(".spec.") ||
        f.path.includes("test/") ||
        f.path.includes("tests/")
    );
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
  }

  private detectCI(files: FileInfo[]): boolean {
    return files.some((f) => {
      const p = this.normalizePath(f.path);
      return (
        p.includes(".github/workflows") ||
        p.includes(".gitlab-ci") ||
        p.includes("Jenkinsfile") ||
        p.includes(".circleci") ||
        p.includes(".travis.yml")
      );
    });
  }

  private detectDocker(files: FileInfo[]): boolean {
    return files.some(
      (f) =>
        f.path.toLowerCase().includes("dockerfile") || f.path.includes("docker-compose")
    );
  }

  private detectKubernetes(files: FileInfo[]): boolean {
    return files.some(
      (f) =>
        f.path.includes("k8s/") ||
        f.path.includes("kubernetes/") ||
        (f.extension === ".yaml" &&
          (f.content?.includes("kind: Deployment") ||
            f.content?.includes("kind: Service") ||
            f.content?.includes("kind: Pod")))
    );
  }

  private detectDatabase(files: FileInfo[], dependencies: { name: string }[]): boolean {
    const dbDeps = [
      "prisma",
      "mongoose",
      "sequelize",
      "typeorm",
      "pg",
      "mysql2",
      "mongodb",
      "redis",
      "sqlite3",
      "@prisma/client",
      "drizzle-orm",
    ];
    return (
      dependencies.some((d) => dbDeps.includes(d.name)) ||
      files.some(
        (f) =>
          f.path.includes(".prisma") ||
          f.path.includes("migrations/") ||
          f.path.includes("schema.sql")
      )
    );
  }

  private detectDatabaseType(
    files: FileInfo[],
    dependencies: { name: string }[]
  ): string | undefined {
    const depNames = dependencies.map((d) => d.name);

    if (
      depNames.includes("@prisma/client") ||
      files.some((f) => f.path.endsWith(".prisma"))
    ) {
      const prismaSchema = files.find((f) => f.path.endsWith(".prisma"));
      if (prismaSchema?.content?.includes('provider = "postgresql"'))
        return "PostgreSQL (Prisma)";
      if (prismaSchema?.content?.includes('provider = "mysql"'))
        return "MySQL (Prisma)";
      if (prismaSchema?.content?.includes('provider = "sqlite"'))
        return "SQLite (Prisma)";
      return "Prisma ORM";
    }
    if (depNames.includes("mongoose")) return "MongoDB";
    if (depNames.includes("pg")) return "PostgreSQL";
    if (depNames.includes("mysql2")) return "MySQL";
    if (depNames.includes("redis")) return "Redis";
    if (depNames.includes("sqlite3")) return "SQLite";

    return undefined;
  }

  private detectAuthentication(
    files: FileInfo[],
    dependencies: { name: string }[]
  ): boolean {
    const authDeps = [
      "next-auth",
      "passport",
      "@auth/core",
      "clerk",
      "auth0",
      "firebase",
      "supabase",
      "jsonwebtoken",
      "bcrypt",
      "bcryptjs",
      "jose",
      "@clerk/nextjs",
      "lucia",
    ];
    if (dependencies.some((d) => authDeps.includes(d.name))) {
      return true;
    }

    const implFiles = files.filter(
      (f) =>
        !f.path.includes("generators/") &&
        !f.path.includes("fixtures/") &&
        !f.path.endsWith(".md") &&
        (f.extension === ".ts" || f.extension === ".js")
    );

    return implFiles.some(
      (f) =>
        (f.path.includes("/auth/") ||
          f.path.includes("/authentication/") ||
          /[/\\]auth\.(ts|js)$/.test(f.path)) &&
        f.content !== undefined &&
        (f.content.includes("passport") ||
          f.content.includes("jsonwebtoken") ||
          f.content.includes("bcrypt") ||
          f.content.includes("next-auth") ||
          f.content.includes("@auth/core"))
    );
  }

  private detectAPI(files: FileInfo[], framework: Framework): boolean {
    return (
      ["express", "fastify", "nestjs", "django", "fastapi", "flask"].includes(
        framework
      ) ||
      files.some(
        (f) =>
          f.path.includes("/api/") ||
          f.path.includes("routes/") ||
          f.path.includes("controllers/")
      )
    );
  }

  private detectAPIType(
    files: FileInfo[],
    dependencies: { name: string }[],
    framework: Framework
  ): "REST" | "GraphQL" | "gRPC" | "tRPC" | undefined {
    const depNames = dependencies.map((d) => d.name);

    if (depNames.includes("@trpc/server") || depNames.includes("@trpc/client"))
      return "tRPC";
    if (
      depNames.includes("graphql") ||
      depNames.includes("@apollo/server") ||
      depNames.includes("apollo-server")
    )
      return "GraphQL";
    if (depNames.includes("@grpc/grpc-js") || depNames.includes("grpc")) return "gRPC";
    if (
      files.some((f) => {
        const p = this.normalizePath(f.path);
        return (
          p.includes("/api/") || p.includes("routes/") || p.includes("controllers/")
        );
      })
    ) {
      return "REST";
    }
    if (
      ["express", "fastify", "nestjs", "django", "fastapi", "flask"].includes(framework)
    ) {
      return "REST";
    }

    return undefined;
  }

  private detectFrontend(framework: Framework, files: FileInfo[]): boolean {
    return (
      ["react", "vue", "angular", "svelte", "nextjs", "nuxt"].includes(framework) ||
      files.some(
        (f) =>
          f.extension === ".tsx" || f.extension === ".jsx" || f.extension === ".vue"
      )
    );
  }

  private detectFrontendFramework(framework: Framework): string | undefined {
    const frontendMap: Partial<Record<Framework, string>> = {
      nextjs: "Next.js",
      react: "React",
      vue: "Vue.js",
      angular: "Angular",
      svelte: "SvelteKit",
      nuxt: "Nuxt.js",
    };
    return frontendMap[framework];
  }

  private detectStateManagement(dependencies: { name: string }[]): string | undefined {
    const depNames = dependencies.map((d) => d.name);

    if (depNames.includes("zustand")) return "Zustand";
    if (depNames.includes("@reduxjs/toolkit") || depNames.includes("redux"))
      return "Redux";
    if (depNames.includes("jotai")) return "Jotai";
    if (depNames.includes("recoil")) return "Recoil";
    if (depNames.includes("mobx")) return "MobX";
    if (depNames.includes("pinia")) return "Pinia";
    if (depNames.includes("vuex")) return "Vuex";
    if (depNames.includes("xstate")) return "XState";

    return undefined;
  }

  private detectExposedSecrets(files: FileInfo[]): string[] {
    const secrets: string[] = [];
    const secretPatterns = [
      /(?:API_KEY|SECRET_KEY|PASSWORD|TOKEN|PRIVATE_KEY)\s*=\s*['"][^'"]{8,}['"]/gi,
      /sk-[a-zA-Z0-9]{48}/g,
      /ghp_[a-zA-Z0-9]{36}/g,
      /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
    ];

    // Only check files that shouldn't have secrets
    const dangerousFiles = files.filter(
      (f) =>
        !f.path.includes(".env") &&
        !f.path.includes(".example") &&
        !f.path.includes(".sample") &&
        (f.extension === ".ts" ||
          f.extension === ".js" ||
          f.extension === ".py" ||
          f.extension === ".json")
    );

    dangerousFiles.forEach((file) => {
      if (file.content) {
        secretPatterns.forEach((pattern) => {
          const matches = file.content!.match(pattern);
          if (matches) {
            secrets.push(
              `Potential secret in ${file.path}: ${matches[0].substring(0, 30)}...`
            );
          }
        });
      }
    });

    return secrets;
  }

  private detectMissingSecurityHeaders(files: FileInfo[]): string[] {
    const missing: string[] = [];
    const allContent = files.map((f) => f.content || "").join("\n");

    if (!allContent.includes("Content-Security-Policy")) {
      missing.push("Content-Security-Policy");
    }
    if (
      !allContent.includes("X-Frame-Options") &&
      !allContent.includes("frame-ancestors")
    ) {
      missing.push("X-Frame-Options");
    }
    if (!allContent.includes("X-Content-Type-Options")) {
      missing.push("X-Content-Type-Options");
    }
    if (!allContent.includes("Strict-Transport-Security")) {
      missing.push("Strict-Transport-Security (HSTS)");
    }

    return missing;
  }

  private detectJSDoc(files: FileInfo[]): boolean {
    return files.some(
      (f) =>
        (f.extension === ".ts" ||
          f.extension === ".js" ||
          f.extension === ".tsx" ||
          f.extension === ".jsx") &&
        f.content?.includes("/**") &&
        f.content?.includes("@param")
    );
  }

  private determineWorkContext(
    files: FileInfo[],
    gitInfo: any,
    _recentlyModifiedFiles: string[]
  ): WorkContext {
    let phase: WorkPhase = "unknown";
    const recentChanges: string[] = [];
    let currentFeature: string | undefined;

    if (gitInfo?.recentCommits?.length > 0) {
      const recentMessages = gitInfo.recentCommits
        .slice(0, 5)
        .map((c: CommitInfo) => c.message.toLowerCase());

      recentChanges.push(
        ...gitInfo.recentCommits.slice(0, 3).map((c: CommitInfo) => c.message)
      );

      if (recentMessages.some((m: string) => m.includes("fix") || m.includes("bug"))) {
        phase = "bug-fixing";
      } else if (
        recentMessages.some(
          (m: string) =>
            m.includes("feat") || m.includes("add") || m.includes("implement")
        )
      ) {
        phase = "feature-development";
      } else if (
        recentMessages.some(
          (m: string) =>
            m.includes("refactor") || m.includes("clean") || m.includes("improve")
        )
      ) {
        phase = "refactoring";
      } else if (
        recentMessages.some((m: string) => m.includes("test") || m.includes("spec"))
      ) {
        phase = "testing";
      } else if (
        recentMessages.some(
          (m: string) =>
            m.includes("deploy") || m.includes("release") || m.includes("ci")
        )
      ) {
        phase = "deployment-prep";
      }

      // Try to extract current feature from branch name
      if (
        gitInfo.currentBranch &&
        gitInfo.currentBranch !== "main" &&
        gitInfo.currentBranch !== "master"
      ) {
        currentFeature = gitInfo.currentBranch
          .replace(/^(feature|feat|fix|bugfix|hotfix)\//, "")
          .replace(/-/g, " ");
      }
    }

    if (phase === "unknown") {
      if (files.length < 10) {
        phase = "initial-setup";
      } else {
        phase = "feature-development";
      }
    }

    return {
      phase,
      currentFeature,
      recentChanges,
      openTasks: [], // Could be parsed from TODO comments
    };
  }
}
