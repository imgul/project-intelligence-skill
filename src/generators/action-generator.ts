import {
  ProjectContext,
  NextAction,
  ActionCategory,
} from "../context/project-context.js";
import { SecurityScanner } from "../analyzers/security-scanner.js";
import { UIAnalyzer } from "../analyzers/ui-analyzer.js";

export class ActionGenerator {
  private securityScanner: SecurityScanner;
  private uiAnalyzer: UIAnalyzer;

  constructor() {
    this.securityScanner = new SecurityScanner();
    this.uiAnalyzer = new UIAnalyzer();
  }

  generateActions(context: ProjectContext, count: number = 5): NextAction[] {
    const allActions: NextAction[] = [
      ...this.securityScanner.generateSecurityActions(context),
      ...this.uiAnalyzer.generateUIActions(context),
      ...this.generateTestingActions(context),
      ...this.generateDeploymentActions(context),
      ...this.generatePerformanceActions(context),
      ...this.generateDeveloperExperienceActions(context),
      ...this.generateFeatureActions(context),
      ...this.generateMonitoringActions(context),
      ...this.generateDatabaseActions(context),
      ...this.generateDocumentationActions(context),
    ];

    // Score and sort actions
    const scored = this.scoreAndSortActions(allActions, context);

    // Ensure diversity across categories
    return this.ensureDiversity(scored, count);
  }

  private scoreAndSortActions(
    actions: NextAction[],
    context: ProjectContext
  ): NextAction[] {
    const priorityScore = { critical: 100, high: 75, medium: 50, low: 25 };
    const impactScore = { high: 30, medium: 20, low: 10 };
    const phaseBonus: Record<string, string[]> = {
      "initial-setup": ["security", "devops", "documentation"],
      "feature-development": ["feature", "testing", "api"],
      "bug-fixing": ["testing", "error-handling", "monitoring"],
      "deployment-prep": ["deployment", "security", "performance", "monitoring"],
      maintenance: ["refactoring", "documentation", "performance"],
    };

    return actions
      .map((action) => ({
        action,
        score:
          priorityScore[action.priority] +
          impactScore[action.estimatedImpact] +
          (phaseBonus[context.currentWorkContext.phase]?.includes(action.category)
            ? 20
            : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.action);
  }

  private ensureDiversity(actions: NextAction[], count: number): NextAction[] {
    const selected: NextAction[] = [];
    const usedCategories = new Set<ActionCategory>();

    // First pass: pick highest priority from each category
    for (const action of actions) {
      if (selected.length >= count) break;
      if (!usedCategories.has(action.category)) {
        selected.push(action);
        usedCategories.add(action.category);
      }
    }

    // Second pass: fill remaining slots with highest priority actions
    if (selected.length < count) {
      for (const action of actions) {
        if (selected.length >= count) break;
        if (!selected.includes(action)) {
          selected.push(action);
        }
      }
    }

    return selected;
  }

  private generateTestingActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (!context.hasTests) {
      actions.push({
        id: "testing-setup",
        category: "testing",
        priority: "high",
        title: "🧪 Set Up Comprehensive Testing Infrastructure",
        description: "No tests detected. Set up a complete testing suite.",
        prompt: `Help me set up a comprehensive testing infrastructure for my ${context.framework} project with ${context.language.join(", ")}:

1. **Unit Testing**:
   ${
     context.language.includes("typescript") || context.language.includes("javascript")
       ? "- Set up Vitest (preferred) or Jest with proper configuration\n   - Configure TypeScript support and path aliases\n   - Add coverage reporting with v8"
       : context.language.includes("python")
         ? "- Set up pytest with pytest-cov for coverage\n   - Configure conftest.py and fixtures"
         : "- Set up appropriate testing framework for the language"
   }

2. **Component Testing** (if applicable):
   ${
     context.hasFrontend
       ? "- Set up React Testing Library / Vue Testing Library\n   - Create component test patterns\n   - Mock providers and context"
       : ""
   }

3. **Integration Testing**:
   - API endpoint testing with supertest or httpx
   - Database integration tests with test database
   - Service-level integration tests

4. **E2E Testing**:
   - Set up Playwright (recommended) or Cypress
   - Create critical path tests
   - Implement visual regression testing

5. **Testing Utilities**:
   - Factory functions for test data
   - Database seeding for tests
   - Mock implementations for external services

6. **CI Integration**:
   - Run tests on every PR
   - Enforce coverage thresholds (aim for 80%+)
   - Parallel test execution

Please create the initial test setup and write tests for the most critical parts of my codebase.`,
        rationale: "Tests prevent regressions and enable confident refactoring",
        estimatedImpact: "high",
        tags: ["testing", "quality", "ci"],
      });
    } else {
      actions.push({
        id: "testing-e2e",
        category: "testing",
        priority: "medium",
        title: "🎭 Add E2E Tests for Critical User Flows",
        description: "Add end-to-end tests for the most important user journeys",
        prompt: `Help me implement E2E tests for critical user flows in my ${context.framework} application using Playwright:

1. **Setup Playwright**:
   - Install and configure Playwright
   - Set up test fixtures and helpers
   - Configure for ${context.framework} (dev server, base URL)

2. **Critical Flow Tests**:
   ${context.hasAuthentication ? "- Authentication flow (signup, login, logout, password reset)" : ""}
   - Main user journey (most important feature)
   - Error scenarios and edge cases
   - Mobile viewport testing

3. **Test Utilities**:
   - Page Object Model (POM) pattern
   - Authentication helpers
   - Database state management
   - API mocking/interception

4. **Visual Testing**:
   - Screenshot comparison for key pages
   - Component visual regression

5. **CI Pipeline**:
   - Run E2E tests in CI
   - Parallel execution
   - Test reports and screenshots on failure

Please analyze my application and create E2E tests for the 5 most critical user flows.`,
        rationale: "E2E tests catch integration issues that unit tests miss",
        estimatedImpact: "high",
        tags: ["testing", "e2e", "playwright", "quality"],
      });
    }

    return actions;
  }

  private generateDeploymentActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];
    const hasDeployment =
      context.hasVercelConfig ||
      context.hasNetlifyConfig ||
      context.hasHerokuConfig ||
      context.hasAwsConfig;

    if (!hasDeployment && !context.hasCI) {
      actions.push({
        id: "deployment-setup",
        category: "deployment",
        priority: "high",
        title: "🚀 Set Up CI/CD Pipeline & Deployment",
        description: "No CI/CD or deployment configuration detected",
        prompt: `Help me set up a complete CI/CD pipeline and deployment for my ${context.framework} project:

1. **CI/CD Pipeline (GitHub Actions)**:
   - PR checks: lint, typecheck, tests, build
   - Automated deployment on merge to main
   - Branch preview deployments
   - Environment-specific deployments (staging, production)

2. **Deployment Strategy**:
   ${
     context.framework === "nextjs"
       ? "- Recommend: Vercel (optimal for Next.js)\n   - Alternative: AWS with CloudFront + Lambda\n   - Self-hosted: Docker + nginx"
       : context.projectType === "api"
         ? "- Recommend: Railway, Render, or Fly.io for APIs\n   - Alternative: AWS ECS with Fargate\n   - Self-hosted: Docker + VPS"
         : "- Show deployment options for my specific stack"
   }

3. **Environment Management**:
   - Set up staging and production environments
   - Environment variable management (use platform secrets)
   - Feature flags for gradual rollouts

4. **Health Checks & Rollback**:
   - Health check endpoints
   - Automatic rollback on failed deployments
   - Zero-downtime deployments

5. **Monitoring Setup**:
   - Error tracking (Sentry)
   - Uptime monitoring
   - Performance monitoring

Please create the complete GitHub Actions workflow files and deployment configuration.`,
        rationale: "CI/CD enables reliable, fast, and consistent deployments",
        estimatedImpact: "high",
        tags: ["deployment", "ci-cd", "devops", "github-actions"],
      });
    }

    if (context.hasDocker && !context.hasKubernetes) {
      actions.push({
        id: "deployment-docker-optimize",
        category: "deployment",
        priority: "medium",
        title: "🐳 Optimize Docker Configuration",
        description: "Optimize Docker setup for production use",
        prompt: `Help me optimize my Docker configuration for production deployment:

1. **Multi-Stage Build**:
   - Create an optimized multi-stage Dockerfile
   - Minimize final image size
   - Use appropriate base images (alpine where possible)
   - Layer caching optimization

2. **Security Hardening**:
   - Run as non-root user
   - Use specific version tags (not latest)
   - Scan image for vulnerabilities
   - Remove unnecessary tools from production image

3. **Docker Compose**:
   - Development docker-compose.yml with hot reload
   - Production docker-compose.yml with proper networking
   - Add health checks for all services
   - Configure resource limits

4. **Optimization**:
   - .dockerignore optimization
   - Build caching strategies
   - Multi-platform builds (amd64/arm64)

5. **CI Integration**:
   - Build and push to container registry
   - Tag images properly (git SHA, semantic version)
   - Implement image scanning in CI

Please review my current Dockerfile and provide an optimized version.`,
        rationale: "Optimized Docker images reduce deployment time and costs",
        estimatedImpact: "medium",
        tags: ["docker", "deployment", "security", "performance"],
      });
    }

    return actions;
  }

  private generatePerformanceActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (context.hasFrontend) {
      actions.push({
        id: "performance-frontend",
        category: "performance",
        priority: "medium",
        title: "⚡ Optimize Frontend Performance (Core Web Vitals)",
        description: "Improve Core Web Vitals scores and overall frontend performance",
        prompt: `Help me optimize the frontend performance of my ${context.frontendFramework || context.framework} application, focusing on Core Web Vitals:

1. **LCP (Largest Contentful Paint) - Target: <2.5s**:
   - Optimize hero images (WebP, proper sizing, preload)
   - Implement critical CSS inlining
   - Reduce render-blocking resources
   ${context.framework === "nextjs" ? "- Use Next.js Image component with priority prop\n   - Enable ISR or SSG where possible" : ""}

2. **FID/INP (Interaction to Next Paint) - Target: <200ms**:
   - Break up long tasks (> 50ms)
   - Implement React.memo, useMemo, useCallback strategically
   - Code split large components
   - Defer non-critical JavaScript

3. **CLS (Cumulative Layout Shift) - Target: <0.1**:
   - Add explicit dimensions to images and videos
   - Reserve space for dynamic content (ads, banners)
   - Use CSS aspect-ratio

4. **Bundle Optimization**:
   - Analyze bundle with webpack-bundle-analyzer or similar
   - Implement route-based code splitting
   - Tree shake unused code
   - Lazy load below-fold components

5. **Caching Strategy**:
   - Implement proper Cache-Control headers
   - Use service worker for offline caching
   - Implement stale-while-revalidate

6. **Performance Monitoring**:
   - Set up Lighthouse CI
   - Real User Monitoring (RUM) with web-vitals library
   - Performance budget enforcement in CI

Please analyze my application and provide specific optimizations.`,
        rationale: "Core Web Vitals directly impact SEO rankings and user retention",
        estimatedImpact: "high",
        tags: ["performance", "core-web-vitals", "seo", "optimization"],
      });
    }

    if (context.hasDatabase) {
      actions.push({
        id: "performance-database",
        category: "performance",
        priority: "medium",
        title: "🗄️ Optimize Database Performance",
        description: "Add indexes, optimize queries, and implement caching",
        prompt: `Help me optimize database performance for my ${context.databaseType || "database"} setup:

1. **Query Optimization**:
   - Identify N+1 query problems
   - Review and optimize slow queries
   - Implement query analysis/logging
   ${context.databaseType?.includes("Prisma") ? "- Use Prisma's query engine features\n   - Implement select/include optimization" : ""}

2. **Indexing Strategy**:
   - Add indexes for frequently queried columns
   - Composite indexes for complex queries
   - Analyze index usage
   - Remove unused indexes

3. **Caching Layer**:
   - Implement Redis for:
     * Session storage
     * Frequently accessed data
     * Rate limiting
     * Job queues
   - Cache invalidation strategies

4. **Connection Pooling**:
   - Configure connection pool size
   - Implement connection timeout handling
   - Monitor connection usage

5. **Data Pagination**:
   - Replace offset pagination with cursor-based
   - Implement infinite scroll or virtual lists
   - Limit query result sizes

6. **Database Migrations**:
   - Review migration safety
   - Zero-downtime migration strategies
   - Backup procedures

Please review my database schema and queries, then provide specific optimizations.`,
        rationale: "Database performance is usually the #1 bottleneck in applications",
        estimatedImpact: "high",
        tags: ["database", "performance", "caching", "optimization"],
      });
    }

    return actions;
  }

  private generateDeveloperExperienceActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (!context.hasLinting || !context.hasFormatting) {
      actions.push({
        id: "dx-code-quality",
        category: "devops",
        priority: "medium",
        title: "🔧 Set Up Code Quality Tools",
        description: "Add linting, formatting, and pre-commit hooks",
        prompt: `Help me set up a comprehensive code quality toolchain for my ${context.framework} project:

1. **ESLint Configuration**:
   - Install and configure ESLint with appropriate plugins
   - ${context.language.includes("typescript") ? "Add @typescript-eslint rules" : "Configure for JavaScript"}
   - ${context.hasFrontend ? "Add React/Vue/Angular specific rules" : ""}
   - Add import ordering rules
   - Configure for your coding standards

2. **Prettier Setup**:
   - Install Prettier
   - Configure .prettierrc with team preferences
   - Integrate with ESLint (eslint-config-prettier)
   - Add .prettierignore

3. **Pre-commit Hooks with Husky + lint-staged**:
   - Run ESLint on staged files
   - Run Prettier on staged files
   - Run type checking
   - Run relevant tests

4. **Editor Configuration**:
   - Create .editorconfig
   - VS Code settings.json recommendations
   - VS Code extensions recommendations (.vscode/extensions.json)

5. **Commit Message Standards**:
   - Set up commitlint with conventional commits
   - Add commitizen for guided commit messages
   - Configure changelog generation

Please implement all of these and fix any existing linting errors.`,
        rationale:
          "Consistent code quality tools prevent bugs and improve team collaboration",
        estimatedImpact: "medium",
        tags: ["dx", "linting", "formatting", "pre-commit", "quality"],
      });
    }

    return actions;
  }

  private generateFeatureActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (
      !context.hasAuthentication &&
      !["library", "cli"].includes(context.projectType) &&
      (context.hasAPI || context.hasFrontend)
    ) {
      actions.push({
        id: "feature-authentication",
        category: "authentication",
        priority: "high",
        title: "🔑 Implement Authentication System",
        description: "Add a complete authentication system to the application",
        prompt: `Help me implement a complete authentication system for my ${context.framework} application:

1. **Auth Strategy Selection**:
   ${
     context.framework === "nextjs"
       ? "Recommend: Auth.js (NextAuth v5) with:\n   - Credentials provider (email/password)\n   - OAuth providers (Google, GitHub)\n   - Magic link email auth"
       : context.framework === "nestjs"
         ? "Recommend: Passport.js with JWT strategy"
         : "Show me the best auth approach for my stack"
   }

2. **User Management**:
   - Registration with email verification
   - Login with remember me
   - Password reset flow
   - Profile management
   - Account deletion (GDPR)

3. **Security Features**:
   - Password hashing (bcrypt/argon2)
   - Rate limiting on auth endpoints
   - CSRF protection
   - Secure session management

4. **Authorization (RBAC)**:
   - Role-based access control
   - Protected routes/endpoints
   - Permission checking utilities

5. **UI Components**:
   - Login page with social auth buttons
   - Registration form with validation
   - Password reset form
   - Email templates

6. **Testing**:
   - Auth flow unit tests
   - Integration tests for auth endpoints

Please implement a production-ready auth system.`,
        rationale: "Authentication is fundamental to most applications",
        estimatedImpact: "high",
        tags: ["authentication", "security", "feature"],
      });
    }

    // Real-time features
    const hasRealtime = context.dependencies.some((d) =>
      ["socket.io", "ws", "pusher", "ably"].includes(d.name)
    );
    if (!hasRealtime && context.projectType !== "library") {
      actions.push({
        id: "feature-realtime",
        category: "feature",
        priority: "low",
        title: "⚡ Add Real-Time Features",
        description: "Implement real-time functionality for better user experience",
        prompt: `Help me add real-time capabilities to my ${context.framework} application:

1. **Technology Selection**:
   - WebSockets for bidirectional real-time communication
   - Server-Sent Events (SSE) for server-to-client streaming
   - ${context.framework === "nextjs" ? "Consider Vercel's AI SDK streaming or Pusher for serverless" : "Socket.io for full-duplex communication"}

2. **Use Cases to Implement**:
   - Live notifications
   - Real-time data updates (dashboard, feeds)
   - Collaborative features (if applicable)
   - Online presence indicators

3. **Implementation**:
   - Set up WebSocket server/client
   - Implement connection management (reconnection, heartbeat)
   - Handle authentication over WebSocket
   - Scale considerations (Redis adapter for multiple instances)

4. **State Management**:
   - Integrate real-time data with existing state
   - Handle optimistic updates
   - Manage connection status UI

Please implement real-time features appropriate for my application.`,
        rationale: "Real-time features significantly improve user engagement",
        estimatedImpact: "medium",
        tags: ["realtime", "websockets", "feature", "ux"],
      });
    }

    return actions;
  }

  private generateMonitoringActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    const hasMonitoring = context.dependencies.some((d) =>
      ["@sentry/node", "@sentry/nextjs", "datadog", "newrelic", "pino"].includes(d.name)
    );

    if (!hasMonitoring) {
      actions.push({
        id: "monitoring-setup",
        category: "monitoring",
        priority: "high",
        title: "📊 Implement Observability (Monitoring, Logging & Alerts)",
        description: "Set up comprehensive monitoring, logging, and alerting",
        prompt: `Help me implement comprehensive observability for my ${context.framework} application:

1. **Error Tracking (Sentry)**:
   - Install and configure Sentry
   - Set up source maps
   - Configure error filtering
   - Create alert rules
   - Add custom context and breadcrumbs
   ${context.hasFrontend ? "- Set up Sentry for both frontend and backend" : ""}

2. **Structured Logging**:
   ${
     context.language.includes("typescript") || context.language.includes("javascript")
       ? "- Implement Pino or Winston for structured JSON logging\n   - Log levels: debug, info, warn, error\n   - Request/response logging middleware\n   - Correlation IDs for request tracing"
       : "- Implement appropriate logging for the language"
   }

3. **Performance Monitoring**:
   - API response time tracking
   - Database query performance
   - ${context.hasFrontend ? "Real User Monitoring (RUM) for frontend" : ""}
   - Custom metrics and dashboards

4. **Health Check Endpoints**:
   - /health - basic liveness check
   - /ready - readiness check (DB, cache connections)
   - /metrics - Prometheus metrics (if self-hosted)

5. **Alerting**:
   - Error rate alerts
   - Performance degradation alerts
   - Uptime monitoring (UptimeRobot, Betterstack)
   - On-call rotation setup

6. **Analytics**:
   - User behavior analytics (Plausible - privacy-friendly)
   - Feature usage tracking
   - Conversion funnels

Please implement a complete observability stack for my application.`,
        rationale:
          "You can't fix what you can't see — monitoring is critical for production",
        estimatedImpact: "high",
        tags: ["monitoring", "logging", "sentry", "observability"],
      });
    }

    return actions;
  }

  private generateDatabaseActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (context.hasDatabase) {
      actions.push({
        id: "database-backup",
        category: "database",
        priority: "high",
        title: "💾 Implement Database Backup & Recovery Strategy",
        description: "Set up automated backups and disaster recovery procedures",
        prompt: `Help me implement a robust database backup and recovery strategy for my ${context.databaseType || "database"}:

1. **Automated Backups**:
   - Daily automated backups
   - Point-in-time recovery (PITR)
   - Backup retention policy (30 days minimum)
   - Offsite backup storage (S3, GCS)

2. **Backup Testing**:
   - Automated restore testing
   - Backup integrity verification
   - Document and test recovery procedures
   - RTO/RPO targets

3. **Database Migrations**:
   - Migration version control
   - Rollback procedures
   - Zero-downtime migration strategies
   - Test migrations on staging first

4. **Connection Resilience**:
   - Implement retry logic for transient failures
   - Circuit breaker pattern
   - Connection pool monitoring
   - Graceful degradation

5. **Data Protection**:
   - Encryption at rest
   - Encryption in transit (SSL/TLS)
   - PII data handling and masking
   - GDPR compliance considerations

Please create a complete backup and recovery implementation.`,
        rationale: "Data loss without backups can be catastrophic and irreversible",
        estimatedImpact: "high",
        tags: ["database", "backup", "disaster-recovery", "security"],
      });
    }

    return actions;
  }

  private generateDocumentationActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (!context.hasReadme || !context.hasApiDocs) {
      actions.push({
        id: "docs-comprehensive",
        category: "documentation",
        priority: "medium",
        title: "📚 Create Comprehensive Project Documentation",
        description: "Write complete documentation for developers and users",
        prompt: `Help me create comprehensive documentation for my ${context.framework} project:

1. **README.md (Complete)**:
   - Project overview and purpose
   - Live demo link and screenshots
   - Tech stack with badges
   - Prerequisites
   - Quick start / Installation guide
   - Environment variables reference
   - Available scripts
   - Project structure explanation
   - Contributing guidelines
   - License

2. **API Documentation** (if applicable):
   ${
     context.hasAPI
       ? "- OpenAPI/Swagger specification\n   - Set up Swagger UI endpoint\n   - Document all endpoints with examples\n   - Request/response schemas\n   - Authentication documentation\n   - Error codes reference"
       : ""
   }

3. **Architecture Decision Records (ADRs)**:
   - Document key technical decisions
   - Why specific technologies were chosen
   - Trade-offs considered

4. **Developer Guide**:
   - Local development setup
   - Testing guide
   - Debugging tips
   - Common issues and solutions

5. **CHANGELOG.md**:
   - Set up conventional changelog
   - Document all versions and changes
   - Breaking changes highlighted

6. **Code Comments**:
   - JSDoc for public APIs and complex functions
   - README files for complex directories
   - Inline comments for non-obvious logic

Please generate complete documentation based on my codebase.`,
        rationale: "Good documentation reduces onboarding time and support burden",
        estimatedImpact: "medium",
        tags: ["documentation", "readme", "api-docs", "onboarding"],
      });
    }

    return actions;
  }
}
