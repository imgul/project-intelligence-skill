export interface FileInfo {
  path: string;
  extension: string;
  size: number;
  lastModified: Date;
  content?: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: "production" | "development" | "peer";
  isOutdated?: boolean;
  hasVulnerability?: boolean;
}

export interface GitInfo {
  currentBranch: string;
  recentCommits: CommitInfo[];
  modifiedFiles: string[];
  stagedFiles: string[];
  uncommittedChanges: boolean;
  remoteUrl?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: string[];
}

export interface ProjectContext {
  // Project Identity
  projectName: string;
  projectPath: string;
  projectType: ProjectType;
  framework: Framework;
  language: Language[];

  // Structure
  files: FileInfo[];
  directories: string[];
  totalFiles: number;
  totalLines: number;

  // Dependencies
  dependencies: DependencyInfo[];
  hasPackageJson: boolean;
  hasRequirementsTxt: boolean;
  hasPomXml: boolean;

  // Features Detected
  hasTests: boolean;
  testCoverage?: number;
  hasCI: boolean;
  hasDocker: boolean;
  hasKubernetes: boolean;
  hasDatabase: boolean;
  databaseType?: string;
  hasAuthentication: boolean;
  hasAPI: boolean;
  apiType?: "REST" | "GraphQL" | "gRPC" | "tRPC";
  hasFrontend: boolean;
  frontendFramework?: string;
  hasStateManagement: boolean;
  stateManagementLib?: string;

  // Code Quality
  hasLinting: boolean;
  hasFormatting: boolean;
  hasTypeChecking: boolean;
  hasHusky: boolean;

  // Security
  hasEnvFile: boolean;
  hasEnvExample: boolean;
  exposedSecrets: string[];
  missingSecurityHeaders: string[];

  // Git
  gitInfo?: GitInfo;
  isGitRepo: boolean;

  // Recent Activity
  recentlyModifiedFiles: string[];
  currentWorkContext: WorkContext;

  // Deployment
  hasVercelConfig: boolean;
  hasNetlifyConfig: boolean;
  hasHerokuConfig: boolean;
  hasAwsConfig: boolean;
  hasNginxConfig: boolean;

  // Documentation
  hasReadme: boolean;
  hasChangelog: boolean;
  hasApiDocs: boolean;
  hasJSDoc: boolean;
}

export type ProjectType =
  | "web-app"
  | "api"
  | "mobile"
  | "desktop"
  | "library"
  | "cli"
  | "fullstack"
  | "microservice"
  | "monorepo"
  | "unknown";

export type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "nuxt"
  | "express"
  | "fastify"
  | "nestjs"
  | "django"
  | "fastapi"
  | "flask"
  | "spring"
  | "laravel"
  | "rails"
  | "unknown";

export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "csharp"
  | "kotlin"
  | "swift";

export interface WorkContext {
  phase: WorkPhase;
  currentFeature?: string;
  recentChanges: string[];
  openTasks: string[];
}

export type WorkPhase =
  | "initial-setup"
  | "feature-development"
  | "bug-fixing"
  | "refactoring"
  | "testing"
  | "deployment-prep"
  | "maintenance"
  | "unknown";

export interface NextAction {
  id: string;
  category: ActionCategory;
  priority: Priority;
  title: string;
  description: string;
  prompt: string;
  rationale: string;
  estimatedImpact: Impact;
  tags: string[];
  relatedFiles?: string[];
}

export type ActionCategory =
  | "feature"
  | "security"
  | "performance"
  | "testing"
  | "deployment"
  | "documentation"
  | "refactoring"
  | "ui-ux"
  | "monitoring"
  | "accessibility"
  | "devops"
  | "database"
  | "api"
  | "authentication"
  | "error-handling";

export type Priority = "critical" | "high" | "medium" | "low";
export type Impact = "high" | "medium" | "low";

export interface StrategicQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  context: string;
  options?: string[];
  followUpQuestions?: string[];
  importance: Priority;
}

export type QuestionCategory =
  | "architecture"
  | "security"
  | "scalability"
  | "user-experience"
  | "business-logic"
  | "technical-debt"
  | "deployment"
  | "data-management"
  | "team-workflow"
  | "performance";
