import {
    ProjectContext,
    StrategicQuestion,
    WorkPhase,
  } from "../context/project-context.js";
  
  export class QuestionGenerator {
    generateQuestions(
      context: ProjectContext,
      mode: "planning" | "agent" | "asking",
      count: number = 5
    ): StrategicQuestion[] {
      const allQuestions = [
        ...this.generateArchitectureQuestions(context),
        ...this.generateScalabilityQuestions(context),
        ...this.generateUserExperienceQuestions(context),
        ...this.generateSecurityQuestions(context),
        ...this.generateBusinessLogicQuestions(context),
        ...this.generateTechnicalDebtQuestions(context),
        ...this.generateDeploymentQuestions(context),
        ...this.generateDataManagementQuestions(context),
      ];
  
      // Filter by mode
      const filtered = this.filterByMode(allQuestions, mode, context);
  
      // Sort by importance and relevance
      const sorted = this.sortByRelevance(filtered, context);
  
      return sorted.slice(0, count);
    }
  
    private filterByMode(
      questions: StrategicQuestion[],
      mode: string,
      context: ProjectContext
    ): StrategicQuestion[] {
      switch (mode) {
        case "planning":
          // Planning mode: broad strategic questions
          return questions.filter((q) =>
            ["architecture", "scalability", "business-logic", "deployment"].includes(
              q.category
            )
          );
        case "agent":
          // Agent mode: specific implementation questions
          return questions.filter((q) =>
            ["technical-debt", "data-management", "security", "performance"].includes(
              q.category
            )
          );
        case "asking":
          // Ask mode: clarifying questions about requirements
          return questions.filter((q) =>
            ["user-experience", "business-logic", "architecture"].includes(
              q.category
            )
          );
        default:
          return questions;
      }
    }
  
    private sortByRelevance(
      questions: StrategicQuestion[],
      context: ProjectContext
    ): StrategicQuestion[] {
      const importanceScore = { critical: 100, high: 75, medium: 50, low: 25 };
      const phaseRelevance: Record<WorkPhase, string[]> = {
        "initial-setup": ["architecture", "scalability", "deployment"],
        "feature-development": ["business-logic", "user-experience", "architecture"],
        "bug-fixing": ["technical-debt", "data-management"],
        "deployment-prep": ["deployment", "security", "scalability"],
        "testing": ["technical-debt", "security"],
        "refactoring": ["architecture", "technical-debt"],
        "maintenance": ["scalability", "security", "technical-debt"],
        "unknown": [],
      };
  
      return questions
        .map((q) => ({
          q,
          score:
            importanceScore[q.importance] +
            (phaseRelevance[context.currentWorkContext.phase]?.includes(q.category)
              ? 20
              : 0),
        }))
        .sort((a, b) => b.score - a.score)
        .map((item) => item.q);
    }
  
    private generateArchitectureQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      if (context.projectType === "unknown" || context.files.length < 20) {
        questions.push({
          id: "arch-scale-expectations",
          category: "architecture",
          question:
            "What scale do you expect this application to reach in the next 12 months? (users, requests/second, data volume)",
          context:
            "Understanding scale expectations helps design the right architecture from the start",
          options: [
            "Small (< 1,000 users)",
            "Medium (1,000 - 100,000 users)",
            "Large (100,000+ users)",
            "Uncertain/startup phase",
          ],
          followUpQuestions: [
            "Will you need to support multiple regions?",
            "Do you have specific latency requirements?",
          ],
          importance: "high",
        });
      }
  
      if (context.projectType === "fullstack" || context.projectType === "api") {
        questions.push({
          id: "arch-api-versioning",
          category: "architecture",
          question:
            "Have you planned your API versioning strategy? How will you handle breaking changes when clients are already in production?",
          context:
            "API versioning is often overlooked until it becomes a painful problem",
          options: [
            "URL versioning (/api/v1/, /api/v2/)",
            "Header versioning (API-Version: 2)",
            "No versioning needed (internal only)",
            "Haven't thought about it yet",
          ],
          followUpQuestions: [
            "How will you deprecate old versions?",
            "Do you need to support multiple versions simultaneously?",
          ],
          importance: "high",
        });
      }
  
      if (context.projectType === "monorepo") {
        questions.push({
          id: "arch-monorepo-strategy",
          category: "architecture",
          question:
            "What's your strategy for shared code and package boundaries in the monorepo? How do you prevent unintended coupling between packages?",
          context: "Monorepo architecture decisions early prevent painful refactors later",
          options: [
            "Turborepo with strict package boundaries",
            "Nx with dependency graph enforcement",
            "pnpm workspaces with manual management",
            "Not yet defined",
          ],
          importance: "high",
        });
      }
  
      questions.push({
        id: "arch-error-strategy",
        category: "architecture",
        question:
          "Do you have a centralized error handling strategy? How are errors propagated from the database layer all the way to the API response and UI?",
        context:
          "Inconsistent error handling leads to poor debugging experience and security leaks",
        options: [
          "Centralized error handler with typed errors",
          "Try/catch at each layer",
          "No consistent strategy yet",
          "Using a library (neverthrow, fp-ts)",
        ],
        importance: "high",
      });
  
      return questions;
    }
  
    private generateScalabilityQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      if (context.hasDatabase) {
        questions.push({
          id: "scale-database-strategy",
          category: "scalability",
          question: `Your app uses ${context.databaseType || "a database"}. Have you considered what happens when your dataset grows 100x? Do you have a sharding or read replica strategy?`,
          context:
            "Database scaling is the most common bottleneck for growing applications",
          options: [
            "Read replicas for query distribution",
            "Database sharding",
            "Event sourcing / CQRS",
            "Will cross that bridge when we get there",
          ],
          importance: "medium",
        });
      }
  
      questions.push({
        id: "scale-caching-strategy",
        category: "scalability",
        question:
          "What's your caching strategy? Have you identified which data is frequently read but rarely changed that could be cached?",
        context:
          "Strategic caching can reduce database load by 90% and dramatically improve response times",
        options: [
          "No caching currently",
          "In-memory caching (application level)",
          "Redis/Memcached (distributed cache)",
          "CDN caching for static assets",
          "Multi-layer caching strategy",
        ],
        followUpQuestions: [
          "How do you handle cache invalidation?",
          "What's your cache hit ratio target?",
        ],
        importance: "medium",
      });
  
      if (context.hasAPI) {
        questions.push({
          id: "scale-rate-limiting",
          category: "scalability",
          question:
            "Do you have rate limiting implemented on your API? Have you considered how to handle traffic spikes or potential DDoS scenarios?",
          context: "Rate limiting protects your infrastructure and ensures fair usage",
          options: [
            "No rate limiting yet",
            "IP-based rate limiting",
            "User/API key based rate limiting",
            "Using a WAF/CDN layer",
          ],
          importance: "high",
        });
      }
  
      return questions;
    }
  
    private generateUserExperienceQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      if (context.hasFrontend) {
        questions.push({
          id: "ux-user-research",
          category: "user-experience",
          question:
            "Have you done user research or usability testing? What are the top 3 tasks users will perform most frequently in your application?",
          context:
            "Designing for actual user behavior vs. assumptions leads to dramatically better UX",
          options: [
            "Yes, we have user research data",
            "We have personas but no testing yet",
            "Based on assumptions/similar products",
            "Haven't considered this yet",
          ],
          followUpQuestions: [
            "How are you measuring user satisfaction (NPS, CSAT)?",
            "How will you collect user feedback once launched?",
          ],
          importance: "high",
        });
  
        questions.push({
          id: "ux-onboarding",
          category: "user-experience",
          question:
            "What does your user onboarding experience look like? How do you ensure new users reach their 'aha moment' within the first session?",
          context:
            "Poor onboarding is the #1 cause of churn for SaaS products",
          options: [
            "Interactive product tour",
            "Setup wizard/checklist",
            "Empty states with CTAs",
            "No specific onboarding yet",
            "Video walkthrough",
          ],
          importance: "high",
        });
  
        questions.push({
          id: "ux-analytics",
          category: "user-experience",
          question:
            "How are you tracking user behavior and feature usage? Do you know which features are most used and which are never touched?",
          context:
            "Without analytics, you're building blind. Data-driven decisions 10x product quality.",
          options: [
            "Google Analytics",
            "Mixpanel / Amplitude (event-based)",
            "Plausible / Fathom (privacy-focused)",
            "Custom analytics",
            "No analytics yet",
          ],
          importance: "medium",
        });
      }
  
      return questions;
    }
  
    private generateSecurityQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      questions.push({
        id: "security-threat-model",
        category: "security",
        question:
          "Have you done a threat modeling exercise? Who are the potential attackers and what are the most valuable assets to protect in your application?",
        context:
          "Threat modeling helps prioritize security investments where they matter most",
        options: [
          "Yes, formal threat model exists",
          "Informal review done",
          "Haven't done this yet",
          "Using a security framework (OWASP, STRIDE)",
        ],
        importance: "high",
      });
  
      if (context.hasAuthentication) {
        questions.push({
          id: "security-mfa",
          category: "security",
          question:
            "Do you support Multi-Factor Authentication (MFA/2FA)? For sensitive applications, have you considered making it mandatory for certain roles?",
          context:
            "MFA prevents 99.9% of automated account compromise attacks",
          options: [
            "Yes, TOTP-based MFA implemented",
            "SMS-based 2FA (note: less secure)",
            "Hardware key support (WebAuthn/FIDO2)",
            "Planned but not implemented",
            "Not required for this use case",
          ],
          importance: "high",
        });
      }
  
      questions.push({
        id: "security-compliance",
        category: "security",
        question:
          "Are there compliance requirements you need to meet? (GDPR, HIPAA, SOC2, PCI-DSS). Have you conducted a data privacy impact assessment?",
        context:
          "Compliance requirements significantly impact architecture and data handling decisions",
        options: [
          "GDPR (EU users)",
          "HIPAA (healthcare data)",
          "SOC2 (enterprise SaaS)",
          "PCI-DSS (payment data)",
          "Multiple compliance frameworks",
          "No specific compliance required",
        ],
        importance: "high",
      });
  
      return questions;
    }
  
    private generateBusinessLogicQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      questions.push({
        id: "biz-success-metrics",
        category: "business-logic",
        question:
          "What are the 3 most important success metrics for this project? How are you measuring them today vs. your targets?",
        context:
          "Building without clear success metrics leads to building the wrong things",
        followUpQuestions: [
          "What does success look like at 3 months? 12 months?",
          "Which metric would you sacrifice others for?",
        ],
        importance: "high",
      });
  
      questions.push({
        id: "biz-edge-cases",
        category: "business-logic",
        question:
          "Have you mapped out the edge cases and failure scenarios for your core business logic? What happens when: a payment fails, an upload is corrupted, two users edit the same record simultaneously?",
        context:
          "Edge cases in business logic are where most bugs that reach production come from",
        importance: "high",
      });
  
      if (context.hasDatabase) {
        questions.push({
          id: "biz-data-consistency",
          category: "business-logic",
          question:
            "How do you handle data consistency in multi-step operations? If step 3 of a 5-step process fails, how does the system recover? Do you use database transactions?",
          context:
            "Lack of proper transaction handling leads to data corruption and hard-to-debug issues",
          options: [
            "Database transactions for all multi-step operations",
            "Saga pattern for distributed transactions",
            "Eventual consistency with compensation logic",
            "Not handling this yet",
          ],
          importance: "high",
        });
      }
  
      return questions;
    }
  
    private generateTechnicalDebtQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      questions.push({
        id: "debt-known-issues",
        category: "technical-debt",
        question:
          "What are the top 3 areas of technical debt you're most worried about? Are there any \"time bombs\" in the codebase that you've been meaning to address?",
        context:
          "Acknowledging technical debt is the first step to managing it strategically",
        importance: "medium",
      });
  
      if (context.totalLines > 10000) {
        questions.push({
          id: "debt-refactoring-plan",
          category: "technical-debt",
          question:
            "Do you have a refactoring strategy for your codebase? How do you balance feature development with paying down technical debt?",
          context:
            "Without a strategy, technical debt compounds and eventually dominates development time",
          options: [
            "20% of each sprint dedicated to debt",
            "Dedicated refactoring sprints",
            "Boy scout rule (leave code better than you found it)",
            "Reactive only (when it hurts enough)",
            "No formal strategy",
          ],
          importance: "medium",
        });
      }
  
      questions.push({
        id: "debt-dependency-updates",
        category: "technical-debt",
        question:
          "How do you manage dependency updates? Do you have a strategy for staying current with security patches and major version upgrades?",
        context:
          "Stale dependencies are a security risk and make major updates increasingly painful",
        options: [
          "Dependabot / Renovate bot automated PRs",
          "Manual monthly review",
          "Only when security issues arise",
          "No current process",
        ],
        importance: "medium",
      });
  
      return questions;
    }
  
    private generateDeploymentQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      if (!context.hasCI) {
        questions.push({
          id: "deploy-strategy",
          category: "deployment",
          question:
            "What's your deployment process? How confident are you in deploying to production on a Friday afternoon? (This is a signal of deployment maturity)",
          context:
            "Deployment confidence indicates automation, testing, and rollback capabilities",
          options: [
            "Automated CI/CD with confidence",
            "Manual with checklists",
            "Infrequent, stressful deployments",
            "Not yet deployed / pre-launch",
          ],
          importance: "high",
        });
      }
  
      questions.push({
        id: "deploy-rollback",
        category: "deployment",
        question:
          "What's your rollback strategy when a deployment goes wrong? How long does it take to rollback? Have you tested the rollback process?",
        context:
          "Untested rollback procedures often don't work when you actually need them",
        options: [
          "Automated rollback on health check failure",
          "Blue-green deployment",
          "Manual rollback via platform UI",
          "Git revert + redeploy",
          "No rollback plan",
        ],
        importance: "high",
      });
  
      questions.push({
        id: "deploy-environments",
        category: "deployment",
        question:
          "How many environments do you have? Is your staging environment truly production-like? Are there configuration differences that could hide bugs?",
        context:
          "\"Works in staging\" failures usually mean staging isn't production-equivalent",
        options: [
          "Local only",
          "Dev + Production",
          "Dev + Staging + Production",
          "Full environment parity with feature flags",
        ],
        importance: "medium",
      });
  
      return questions;
    }
  
    private generateDataManagementQuestions(
      context: ProjectContext
    ): StrategicQuestion[] {
      const questions: StrategicQuestion[] = [];
  
      if (context.hasDatabase) {
        questions.push({
          id: "data-gdpr",
          category: "data-management",
          question:
            "How do you handle user data deletion requests (GDPR's Right to Erasure)? Can you delete all of a user's PII while maintaining referential integrity?",
          context:
            "GDPR violations can result in fines up to 4% of annual global revenue",
          options: [
            "Implemented: soft delete + anonymization",
            "Planned but not implemented",
            "Haven't considered this",
            "Not applicable (no EU users)",
          ],
          importance: "high",
        });
  
        questions.push({
          id: "data-migration-strategy",
          category: "data-management",
          question:
            "How do you handle database schema migrations in production? Do you have a tested rollback plan for migration failures?",
          context:
            "Botched migrations are a top cause of production outages",
          options: [
            "Automated migrations with Prisma/Flyway",
            "Manual SQL with backups",
            "Blue-green database strategy",
            "Zero-downtime migrations with expand-contract pattern",
            "No formal process",
          ],
          importance: "high",
        });
      }
  
      return questions;
    }
  }