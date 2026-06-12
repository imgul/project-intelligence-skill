import { z } from "zod";
import { ProjectAnalyzer } from "../analyzers/project-analyzer.js";
import { ActionGenerator } from "../generators/action-generator.js";
import { QuestionGenerator } from "../generators/question-generator.js";

export const planningAdvisorSchema = z.object({
  projectPath: z.string().describe("Path to the project root"),
  goal: z.string().describe("What you are trying to achieve or build"),
  timeframe: z
    .enum(["today", "this-week", "this-sprint", "this-month", "this-quarter"])
    .default("this-sprint"),
  constraints: z
    .string()
    .optional()
    .describe("Any constraints (team size, tech limitations, etc.)"),
});

export type PlanningAdvisorInput = z.infer<typeof planningAdvisorSchema>;

export async function generatePlan(input: PlanningAdvisorInput): Promise<string> {
  const analyzer = new ProjectAnalyzer();
  const actionGenerator = new ActionGenerator();
  const questionGenerator = new QuestionGenerator();

  const context = await analyzer.analyze(input.projectPath);
  const actions = actionGenerator.generateActions(context, 5);
  const questions = questionGenerator.generateQuestions(context, "planning", 3);

  let output = `# 🗺️ Project Intelligence: Planning Advisor\n\n`;
  output += `**Goal**: ${input.goal}\n`;
  output += `**Timeframe**: ${input.timeframe}\n`;
  output += `**Project**: ${context.projectName} (${context.framework})\n`;

  if (input.constraints) {
    output += `**Constraints**: ${input.constraints}\n`;
  }

  output += `\n---\n\n`;

  // Pre-planning questions
  output += `## ❓ Before You Start: Answer These First\n\n`;
  questions.forEach((q, i) => {
    output += `${i + 1}. **${q.question}**\n`;
    output += `   *${q.context}*\n\n`;
  });

  output += `---\n\n`;

  // Recommended plan
  output += `## 📋 Recommended Implementation Plan\n\n`;
  output += `Based on your project's current state, here's a strategic plan for "${input.goal}":\n\n`;

  // Phase breakdown
  const phases = generatePhases(input.goal, input.timeframe, context, actions);
  phases.forEach((phase, index) => {
    output += `### Phase ${index + 1}: ${phase.name}\n\n`;
    output += `**Timeline**: ${phase.timeline}\n\n`;
    phase.tasks.forEach((task) => {
      output += `- ${task}\n`;
    });
    output += "\n";
  });

  output += `---\n\n`;

  // Risks and mitigations
  output += `## ⚠️ Risks & Mitigations\n\n`;
  const risks = identifyRisks(context, input.goal);
  risks.forEach((risk) => {
    output += `**Risk**: ${risk.risk}\n`;
    output += `**Mitigation**: ${risk.mitigation}\n\n`;
  });

  output += `---\n\n`;

  // Related next actions
  output += `## 🎯 Critical Actions That Should Accompany This Work\n\n`;
  const criticalActions = actions
    .filter((a) => a.priority === "critical" || a.priority === "high")
    .slice(0, 3);

  criticalActions.forEach((action) => {
    output += `- **${action.title}**: ${action.description}\n`;
  });

  return output;
}

function generatePhases(
  goal: string,
  _timeframe: string,
  _context: any,
  _actions: any[]
): Array<{ name: string; timeline: string; tasks: string[] }> {
  const goalLower = goal.toLowerCase();

  if (goalLower.includes("auth")) {
    return [
      {
        name: "Foundation",
        timeline: "Day 1-2",
        tasks: [
          "Set up auth library (Auth.js/Passport)",
          "Design user schema",
          "Create auth routes",
          "Implement session management",
        ],
      },
      {
        name: "Core Features",
        timeline: "Day 3-4",
        tasks: [
          "Login/Register forms",
          "Email verification",
          "Password reset flow",
          "Protected routes",
        ],
      },
      {
        name: "Security Hardening",
        timeline: "Day 5",
        tasks: ["Rate limiting", "CSRF protection", "Security headers", "Auth tests"],
      },
    ];
  }

  if (goalLower.includes("deploy") || goalLower.includes("ci")) {
    return [
      {
        name: "CI Pipeline",
        timeline: "Day 1",
        tasks: [
          "GitHub Actions setup",
          "Lint and type check jobs",
          "Test job",
          "Build verification",
        ],
      },
      {
        name: "Deployment",
        timeline: "Day 2",
        tasks: [
          "Choose deployment platform",
          "Set up environments",
          "Configure secrets management",
          "Deploy staging",
        ],
      },
      {
        name: "Production",
        timeline: "Day 3",
        tasks: [
          "Deploy to production",
          "Set up monitoring",
          "Configure alerts",
          "Document deployment process",
        ],
      },
    ];
  }

  // Generic phases
  return [
    {
      name: "Planning & Setup",
      timeline: "Day 1",
      tasks: [
        "Define requirements clearly",
        "Design the data model",
        "Identify dependencies",
        "Set up feature branch",
      ],
    },
    {
      name: "Core Implementation",
      timeline: "Days 2-3",
      tasks: [
        "Implement backend logic",
        "Create API endpoints",
        "Build UI components",
        "Connect frontend to backend",
      ],
    },
    {
      name: "Quality & Polish",
      timeline: "Days 4-5",
      tasks: [
        "Write tests",
        "Handle error cases",
        "Code review",
        "Documentation update",
      ],
    },
  ];
}

function identifyRisks(
  context: any,
  _goal: string
): Array<{ risk: string; mitigation: string }> {
  const risks = [];

  if (!context.hasTests) {
    risks.push({
      risk: "No test coverage means changes might break existing functionality",
      mitigation: "Write tests for affected code before making changes",
    });
  }

  if (!context.isGitRepo || !context.gitInfo) {
    risks.push({
      risk: "No version control means no ability to rollback changes",
      mitigation: "Initialize git and commit current state before starting",
    });
  }

  if (context.exposedSecrets.length > 0) {
    risks.push({
      risk: "Hardcoded secrets in codebase pose security risk",
      mitigation: "Rotate all secrets before deploying any new features",
    });
  }

  if (!context.hasCI) {
    risks.push({
      risk: "Without CI, quality issues might slip through to production",
      mitigation: "Set up basic CI checks before the feature is complete",
    });
  }

  risks.push({
    risk: "Scope creep during implementation",
    mitigation: 'Define a clear "done" criteria and stick to it. Log ideas for later.',
  });

  return risks.slice(0, 4);
}
