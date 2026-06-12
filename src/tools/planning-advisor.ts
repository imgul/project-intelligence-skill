import { z } from "zod";
import { ProjectAnalyzer } from "../analyzers/project-analyzer.js";
import { ActionGenerator } from "../generators/action-generator.js";
import { QuestionGenerator } from "../generators/question-generator.js";
import { NextAction, ProjectContext } from "../context/project-context.js";

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

const TIMEFRAME_DAYS: Record<string, number> = {
  today: 1,
  "this-week": 5,
  "this-sprint": 10,
  "this-month": 20,
  "this-quarter": 60,
};

export async function generatePlan(input: PlanningAdvisorInput): Promise<string> {
  const analyzer = new ProjectAnalyzer();
  const actionGenerator = new ActionGenerator();
  const questionGenerator = new QuestionGenerator();

  const context = await analyzer.analyze(input.projectPath);
  const actions = actionGenerator.generateActions(context, 5);
  const questions = questionGenerator.generateQuestions(context, "planning", 3, {
    topic: input.goal,
    userInput: input.constraints,
  });

  let output = `# 🗺️ Project Intelligence: Planning Advisor\n\n`;
  output += `**Goal**: ${input.goal}\n`;
  output += `**Timeframe**: ${input.timeframe}\n`;
  output += `**Project**: ${context.projectName} (${context.framework})\n`;

  if (input.constraints) {
    output += `**Constraints**: ${input.constraints}\n`;
  }

  output += `\n---\n\n`;

  output += `## ❓ Before You Start: Answer These First\n\n`;
  questions.forEach((q, i) => {
    output += `${i + 1}. **${q.question}**\n`;
    output += `   *${q.context}*\n\n`;
  });

  output += `---\n\n`;

  output += `## 📋 Recommended Implementation Plan\n\n`;
  output += `Based on your project's current state, here's a strategic plan for "${input.goal}":\n\n`;

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

  output += `## ⚠️ Risks & Mitigations\n\n`;
  const risks = identifyRisks(context, input.goal, input.constraints);
  risks.forEach((risk) => {
    output += `**Risk**: ${risk.risk}\n`;
    output += `**Mitigation**: ${risk.mitigation}\n\n`;
  });

  output += `---\n\n`;

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
  timeframe: string,
  context: ProjectContext,
  actions: NextAction[]
): Array<{ name: string; timeline: string; tasks: string[] }> {
  const goalLower = goal.toLowerCase();
  const totalDays = TIMEFRAME_DAYS[timeframe] || 10;
  const highPriorityTasks = actions
    .filter((a) => a.priority === "critical" || a.priority === "high")
    .slice(0, 3)
    .map((a) => a.title);

  const contextTasks: string[] = [];
  if (!context.hasTests) contextTasks.push("Add test coverage for affected areas");
  if (!context.hasCI) contextTasks.push("Ensure CI runs on the feature branch");
  if (context.exposedSecrets.length > 0) {
    contextTasks.push("Rotate exposed secrets before shipping");
  }
  if (context.vulnerableDependencies?.length) {
    contextTasks.push("Address known vulnerable dependencies");
  }

  if (goalLower.includes("auth")) {
    return buildPhasedPlan(totalDays, [
      {
        name: "Foundation",
        tasks: [
          "Set up auth library",
          "Design user schema",
          "Create auth routes",
          ...contextTasks,
        ],
      },
      {
        name: "Core Features",
        tasks: [
          "Login/Register flows",
          "Session management",
          "Protected routes",
          ...highPriorityTasks,
        ],
      },
      {
        name: "Security Hardening",
        tasks: ["Rate limiting", "CSRF protection", "Security headers", "Auth tests"],
      },
    ]);
  }

  if (goalLower.includes("deploy") || goalLower.includes("ci")) {
    return buildPhasedPlan(totalDays, [
      {
        name: "CI Pipeline",
        tasks: [
          "GitHub Actions setup",
          "Lint and type check",
          "Test job",
          ...contextTasks,
        ],
      },
      {
        name: "Deployment",
        tasks: [
          "Choose deployment platform",
          "Configure environments",
          "Secrets management",
          ...highPriorityTasks,
        ],
      },
      {
        name: "Production",
        tasks: [
          "Deploy to production",
          "Monitoring",
          "Alerts",
          "Runbook documentation",
        ],
      },
    ]);
  }

  if (goalLower.includes("test")) {
    return buildPhasedPlan(totalDays, [
      {
        name: "Test Infrastructure",
        tasks: ["Choose test framework", "Configure test runner", ...contextTasks],
      },
      {
        name: "Critical Path Coverage",
        tasks: ["Identify critical modules", "Write unit tests", ...highPriorityTasks],
      },
      {
        name: "CI Integration",
        tasks: [
          "Add test job to CI",
          "Set coverage thresholds",
          "Document testing conventions",
        ],
      },
    ]);
  }

  const phaseCount = totalDays <= 1 ? 2 : totalDays <= 5 ? 3 : 4;
  const genericPhases = [
    {
      name: "Planning & Setup",
      tasks: [
        `Define done criteria for: ${goal}`,
        "Design data model / API contracts",
        "Identify dependencies and risks",
        ...contextTasks,
      ],
    },
    {
      name: "Core Implementation",
      tasks: [
        "Implement backend logic",
        "Build UI / integration layer",
        ...highPriorityTasks,
      ],
    },
    {
      name: "Quality & Polish",
      tasks: [
        "Write tests",
        "Handle error cases",
        "Code review",
        "Update documentation",
      ],
    },
  ];

  if (phaseCount >= 4) {
    genericPhases.splice(2, 0, {
      name: "Integration",
      tasks: [
        "Connect components end-to-end",
        "Validate against requirements",
        "Address feedback from review",
      ],
    });
  }

  return buildPhasedPlan(totalDays, genericPhases);
}

function buildPhasedPlan(
  totalDays: number,
  phases: Array<{ name: string; tasks: string[] }>
): Array<{ name: string; timeline: string; tasks: string[] }> {
  const daysPerPhase = Math.max(1, Math.floor(totalDays / phases.length));
  return phases.map((phase, index) => {
    const start = index * daysPerPhase + 1;
    const end = index === phases.length - 1 ? totalDays : (index + 1) * daysPerPhase;
    const timeline = start === end ? `Day ${start}` : `Days ${start}-${end}`;
    return { name: phase.name, timeline, tasks: phase.tasks };
  });
}

function identifyRisks(
  context: ProjectContext,
  goal: string,
  constraints?: string
): Array<{ risk: string; mitigation: string }> {
  const risks: Array<{ risk: string; mitigation: string }> = [];
  const goalLower = goal.toLowerCase();

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

  if (context.vulnerableDependencies?.length) {
    risks.push({
      risk: `Known vulnerable dependencies: ${context.vulnerableDependencies.join(", ")}`,
      mitigation: "Upgrade or replace vulnerable packages before proceeding",
    });
  }

  if (!context.hasCI) {
    risks.push({
      risk: "Without CI, quality issues might slip through to production",
      mitigation: "Set up basic CI checks before the feature is complete",
    });
  }

  if (goalLower.includes("auth") && !context.hasAuthentication) {
    risks.push({
      risk: "Adding authentication touches security-sensitive flows",
      mitigation: "Threat-model auth flows and add security review before launch",
    });
  }

  if (
    constraints?.toLowerCase().includes("solo") ||
    constraints?.toLowerCase().includes("one person")
  ) {
    risks.push({
      risk: "Solo delivery increases bus factor and review gaps",
      mitigation:
        "Keep scope minimal and use automated checks to compensate for missing reviewers",
    });
  }

  risks.push({
    risk: "Scope creep during implementation",
    mitigation: 'Define a clear "done" criteria and stick to it. Log ideas for later.',
  });

  return risks.slice(0, 5);
}
