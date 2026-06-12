import { z } from "zod";
import { ProjectAnalyzer } from "../analyzers/project-analyzer.js";
import { ActionGenerator } from "../generators/action-generator.js";
import { NextAction } from "../context/project-context.js";

export const suggestNextActionsSchema = z.object({
  projectPath: z.string().describe("Absolute or relative path to the project root"),
  count: z
    .number()
    .min(1)
    .max(10)
    .default(5)
    .describe("Number of action suggestions to return"),
  focusArea: z
    .enum([
      "security",
      "performance",
      "testing",
      "deployment",
      "ui-ux",
      "feature",
      "all",
    ])
    .default("all")
    .describe("Focus area for suggestions"),
  currentTask: z.string().optional().describe("What you are currently working on"),
});

export type SuggestNextActionsInput = z.infer<typeof suggestNextActionsSchema>;

export async function suggestNextActions(
  input: SuggestNextActionsInput
): Promise<string> {
  const analyzer = new ProjectAnalyzer();
  const generator = new ActionGenerator();

  const context = await analyzer.analyze(input.projectPath);

  if (input.currentTask) {
    context.currentWorkContext.currentFeature = input.currentTask;
  }

  let actions = generator.generateActions(context, input.count);

  if (input.focusArea !== "all") {
    const categoryMap: Record<string, string[]> = {
      security: ["security", "authentication"],
      performance: ["performance", "database"],
      testing: ["testing"],
      deployment: ["deployment", "devops", "monitoring"],
      "ui-ux": ["ui-ux", "accessibility"],
      feature: ["feature", "api", "authentication"],
    };
    const targetCategories = categoryMap[input.focusArea] || [];
    const filtered = actions.filter((a) => targetCategories.includes(a.category));
    if (filtered.length > 0) {
      const filteredIds = new Set(filtered.map((a) => a.id));
      const backfill = actions.filter((a) => !filteredIds.has(a.id));
      actions = [...filtered, ...backfill].slice(0, input.count);
    }
  }

  return formatActionsOutput(actions, context);
}

function formatActionsOutput(actions: NextAction[], context: any): string {
  const priorityEmoji: Record<string, string> = {
    critical: "🚨",
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  const categoryEmoji: Record<string, string> = {
    security: "🛡️",
    performance: "⚡",
    testing: "🧪",
    deployment: "🚀",
    "ui-ux": "🎨",
    feature: "✨",
    documentation: "📚",
    monitoring: "📊",
    database: "🗄️",
    refactoring: "🔧",
    authentication: "🔐",
    accessibility: "♿",
    devops: "⚙️",
    api: "🔌",
    "error-handling": "🚫",
  };

  let output = `# 🧠 Project Intelligence: Next Action Suggestions\n\n`;
  output += `**Project**: ${context.projectName} | **Framework**: ${context.framework} | **Phase**: ${context.currentWorkContext.phase}\n`;
  output += `**Files**: ${context.totalFiles} | **Lines**: ${context.totalLines.toLocaleString()} | **Branch**: ${context.gitInfo?.currentBranch || "N/A"}\n\n`;

  if (context.currentWorkContext.currentFeature) {
    output += `> 🎯 **Current Focus**: ${context.currentWorkContext.currentFeature}\n\n`;
  }

  output += `---\n\n`;
  output += `## Suggested Next Actions (${actions.length})\n\n`;

  actions.forEach((action, index) => {
    const prioEmoji = priorityEmoji[action.priority] || "⚪";
    const catEmoji = categoryEmoji[action.category] || "📌";

    output += `### ${index + 1}. ${action.title}\n\n`;
    output += `${prioEmoji} **Priority**: ${action.priority.toUpperCase()} | ${catEmoji} **Category**: ${action.category} | 💥 **Impact**: ${action.estimatedImpact}\n\n`;
    output += `**Why now?** ${action.rationale}\n\n`;
    output += `**Description**: ${action.description}\n\n`;
    output += `**Prompt**:\n\n`;
    output += `\`\`\`\n${action.prompt}\n\`\`\`\n\n`;
    output += `**Tags**: ${action.tags.map((t) => `\`${t}\``).join(", ")}\n\n`;
    output += `---\n\n`;
  });

  // Summary section
  output += `## 📈 Quick Wins Summary\n\n`;
  const critical = actions.filter((a) => a.priority === "critical");
  const high = actions.filter((a) => a.priority === "high");

  if (critical.length > 0) {
    output += `### 🚨 Critical (Do Today):\n`;
    critical.forEach((a) => (output += `- ${a.title}\n`));
    output += "\n";
  }

  if (high.length > 0) {
    output += `### 🔴 High Priority (This Sprint):\n`;
    high.forEach((a) => (output += `- ${a.title}\n`));
    output += "\n";
  }

  output += `\n> 💡 **Tip**: Use the full prompts above directly in your AI assistant to implement each action. They are designed to be comprehensive and context-aware.\n`;

  return output;
}
