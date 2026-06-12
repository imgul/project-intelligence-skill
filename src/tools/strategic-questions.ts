import { z } from "zod";
import { ProjectAnalyzer } from "../analyzers/project-analyzer.js";
import { QuestionGenerator } from "../generators/question-generator.js";
import { StrategicQuestion } from "../context/project-context.js";

export const strategicQuestionsSchema = z.object({
  projectPath: z.string().describe("Path to the project root"),
  mode: z
    .enum(["planning", "agent", "asking"])
    .default("planning")
    .describe(
      "Mode: planning (strategic), agent (implementation), asking (requirements clarification)"
    ),
  count: z
    .number()
    .min(1)
    .max(10)
    .default(5)
    .describe("Number of questions to ask"),
  topic: z
    .string()
    .optional()
    .describe("Specific topic to focus questions on"),
  userInput: z
    .string()
    .optional()
    .describe("What the user just said or is asking about"),
});

export type StrategicQuestionsInput = z.infer<typeof strategicQuestionsSchema>;

export async function generateStrategicQuestions(
  input: StrategicQuestionsInput
): Promise<string> {
  const analyzer = new ProjectAnalyzer();
  const generator = new QuestionGenerator();

  const context = await analyzer.analyze(input.projectPath);
  const questions = generator.generateQuestions(context, input.mode, input.count);

  return formatQuestionsOutput(questions, context, input.mode, input.userInput);
}

function formatQuestionsOutput(
  questions: StrategicQuestion[],
  context: any,
  mode: string,
  userInput?: string
): string {
  const modeDescriptions: Record<string, string> = {
    planning: "Strategic Planning Questions",
    agent: "Implementation Clarification Questions",
    asking: "Requirements & Discovery Questions",
  };

  const importanceEmoji: Record<string, string> = {
    critical: "🚨",
    high: "❗",
    medium: "⚠️",
    low: "ℹ️",
  };

  const categoryEmoji: Record<string, string> = {
    architecture: "🏗️",
    security: "🛡️",
    scalability: "📈",
    "user-experience": "👥",
    "business-logic": "💼",
    "technical-debt": "🔧",
    deployment: "🚀",
    "data-management": "🗄️",
    "team-workflow": "👥",
    performance: "⚡",
  };

  let output = `# 🤔 Strategic Questions: ${modeDescriptions[mode] || mode}\n\n`;
  output += `**Project**: ${context.projectName} | **Phase**: ${context.currentWorkContext.phase}\n\n`;

  if (userInput) {
    output += `> 🗣️ **Context**: Based on: "${userInput}"\n\n`;
  }

  output += `These questions will help clarify strategy and uncover hidden requirements before diving into implementation.\n\n`;
  output += `---\n\n`;

  questions.forEach((q, index) => {
    const impEmoji = importanceEmoji[q.importance] || "📌";
    const catEmoji = categoryEmoji[q.category] || "💬";

    output += `### Question ${index + 1}: ${catEmoji} ${q.category.replace("-", " ").toUpperCase()}\n\n`;
    output += `${impEmoji} **${q.question}**\n\n`;

    if (q.context) {
      output += `> 💡 *Why this matters*: ${q.context}\n\n`;
    }

    if (q.options && q.options.length > 0) {
      output += `**Options to consider**:\n`;
      q.options.forEach((opt) => (output += `- ${opt}\n`));
      output += "\n";
    }

    if (q.followUpQuestions && q.followUpQuestions.length > 0) {
      output += `**Follow-up questions**:\n`;
      q.followUpQuestions.forEach((fq) => (output += `- ${fq}\n`));
      output += "\n";
    }

    output += `---\n\n`;
  });

  output += `## 💬 How to Use These Questions\n\n`;
  output += `1. **Answer each question** - either in your head or write it down\n`;
  output += `2. **Share answers with AI** - paste your answers and ask for recommendations\n`;
  output += `3. **Update your plan** - let the answers guide your next implementation steps\n`;
  output += `4. **Revisit periodically** - some questions become relevant at different project stages\n\n`;

  output += `> 🎯 **Pro Tip**: The best time to answer architecture questions is before you're committed to a design. Answer these now to avoid costly refactors later.\n`;

  return output;
}