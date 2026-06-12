import { ProjectContext, NextAction } from "../context/project-context.js";

export class SecurityScanner {
  generateSecurityActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    // Exposed secrets
    if (context.exposedSecrets.length > 0) {
      actions.push({
        id: "security-exposed-secrets",
        category: "security",
        priority: "critical",
        title: "🚨 Remove Exposed Secrets from Codebase",
        description: `Found ${context.exposedSecrets.length} potential secret(s) hardcoded in the codebase.`,
        prompt: `I have hardcoded secrets in my codebase that need to be removed immediately. Here are the issues found:
${context.exposedSecrets.join("\n")}

Please help me:
1. Remove all hardcoded secrets from the code
2. Set up proper environment variable management with .env files
3. Add .env to .gitignore if not already there
4. Create a .env.example file with placeholder values
5. Update all code references to use process.env or equivalent
6. Check git history for any previously committed secrets and provide instructions to remove them using git filter-branch or BFG Repo-Cleaner`,
        rationale: "Hardcoded secrets are a critical security vulnerability",
        estimatedImpact: "high",
        tags: ["security", "critical", "secrets", "environment-variables"],
      });
    }

    if (context.vulnerableDependencies && context.vulnerableDependencies.length > 0) {
      actions.push({
        id: "security-vulnerable-deps",
        category: "security",
        priority: "high",
        title: "⚠️ Upgrade Vulnerable Dependencies",
        description: `Known vulnerable packages detected: ${context.vulnerableDependencies.join(", ")}`,
        prompt: `My project has potentially vulnerable dependencies:
${context.vulnerableDependencies.join("\n")}

Please help me:
1. Identify safe upgrade paths for each package
2. Check for breaking changes in major version bumps
3. Update package.json / requirements and lockfiles
4. Run tests to verify compatibility
5. Document any packages that need manual migration`,
        rationale: "Vulnerable dependencies increase supply-chain attack risk",
        estimatedImpact: "high",
        tags: ["security", "dependencies", "supply-chain"],
      });
    }

    // Missing .env.example
    if (context.hasEnvFile && !context.hasEnvExample) {
      actions.push({
        id: "security-env-example",
        category: "security",
        priority: "high",
        title: "📋 Create .env.example for Team Documentation",
        description:
          "You have a .env file but no .env.example for documentation and onboarding.",
        prompt: `My project has a .env file but no .env.example file. Please help me:
1. Create a .env.example file with all the same keys as my .env but with safe placeholder values
2. Add comments explaining what each variable does and where to get the values
3. Ensure .env is in .gitignore
4. Add setup instructions to README.md
5. Consider categorizing variables (Database, Auth, External APIs, etc.)`,
        rationale: "Enables team collaboration without exposing real secrets",
        estimatedImpact: "medium",
        tags: ["security", "documentation", "onboarding"],
      });
    }

    // Missing security headers
    if (
      context.missingSecurityHeaders.length > 0 &&
      (context.hasAPI || context.hasFrontend)
    ) {
      actions.push({
        id: "security-headers",
        category: "security",
        priority: "high",
        title: "🛡️ Add Security Headers",
        description: `Missing security headers: ${context.missingSecurityHeaders.join(", ")}`,
        prompt: `My ${context.framework} application is missing important security headers: ${context.missingSecurityHeaders.join(", ")}.

Please help me implement all recommended security headers:
1. Content-Security-Policy (CSP)
2. X-Frame-Options or CSP frame-ancestors
3. X-Content-Type-Options: nosniff
4. Strict-Transport-Security (HSTS)
5. Referrer-Policy
6. Permissions-Policy
7. X-XSS-Protection

${
  context.framework === "nextjs"
    ? "Add these to next.config.js headers configuration"
    : context.framework === "express"
      ? "Use helmet.js middleware for Express"
      : context.framework === "nestjs"
        ? "Use @nestjs/helmet package"
        : "Show me the appropriate implementation for my stack"
}

Also provide a checklist for testing the headers using tools like securityheaders.com`,
        rationale:
          "Security headers protect against XSS, clickjacking, and other attacks",
        estimatedImpact: "high",
        tags: ["security", "headers", "web-security"],
      });
    }

    // Authentication improvements
    if (context.hasAuthentication) {
      actions.push({
        id: "security-auth-audit",
        category: "security",
        priority: "medium",
        title: "🔐 Audit & Strengthen Authentication",
        description: "Review and strengthen authentication implementation",
        prompt: `Please audit my authentication implementation in this ${context.framework} project and help me:

1. **Rate Limiting**: Add rate limiting to auth endpoints to prevent brute force attacks
2. **Password Security**: Ensure passwords are hashed with bcrypt/argon2 with appropriate salt rounds
3. **Session Management**: 
   - Implement proper session expiration
   - Add session invalidation on logout
   - Consider refresh token rotation
4. **JWT Security** (if using JWT):
   - Verify proper signing algorithm (avoid 'none')
   - Check token expiration
   - Implement token blacklisting for logout
5. **Account Security**:
   - Add email verification
   - Implement account lockout after failed attempts
   - Consider 2FA/MFA support
6. **OAuth/Social Login** security best practices

Please analyze my current auth code and provide specific improvements.`,
        rationale: "Authentication vulnerabilities are a top attack vector",
        estimatedImpact: "high",
        tags: ["security", "authentication", "jwt", "sessions"],
      });
    }

    // Input validation
    if (context.hasAPI) {
      actions.push({
        id: "security-input-validation",
        category: "security",
        priority: "high",
        title: "✅ Implement Comprehensive Input Validation",
        description:
          "Add robust input validation and sanitization to all API endpoints",
        prompt: `Help me implement comprehensive input validation and sanitization for my ${context.framework} ${context.apiType || "REST"} API:

1. **Schema Validation**: 
   ${
     context.framework === "nestjs"
       ? "Use class-validator and class-transformer with DTOs"
       : context.language.includes("typescript")
         ? "Implement Zod schemas for all request bodies, params, and query strings"
         : "Implement proper validation middleware"
   }

2. **SQL Injection Prevention**: 
   - Use parameterized queries or ORM
   - Avoid raw query strings with user input
   
3. **XSS Prevention**:
   - Sanitize HTML input
   - Use DOMPurify on frontend
   
4. **Prototype Pollution Prevention**:
   - Validate and sanitize object inputs
   
5. **File Upload Security** (if applicable):
   - Validate file types by magic bytes, not just extension
   - Limit file sizes
   - Scan for malware if possible

6. **Error Messages**:
   - Don't expose internal details in error responses
   - Implement proper error handling

Please review my API endpoints and create comprehensive validation for each.`,
        rationale: "Input validation prevents injection attacks and data corruption",
        estimatedImpact: "high",
        tags: ["security", "validation", "api", "xss", "sql-injection"],
      });
    }

    return actions;
  }
}
