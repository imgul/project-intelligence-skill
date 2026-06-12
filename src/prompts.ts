import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const prompts: Prompt[] = [
  {
    name: "plan-feature",
    description:
      "Create a phased implementation plan for a specific goal with risks and critical actions",
    arguments: [
      {
        name: "projectPath",
        description: "Path to the project root directory",
        required: true,
      },
      {
        name: "goal",
        description: "What you are trying to achieve or build",
        required: true,
      },
      {
        name: "timeframe",
        description: "today | this-week | this-sprint | this-month | this-quarter",
        required: false,
      },
      {
        name: "constraints",
        description: "Team size, tech limitations, budget, or other constraints",
        required: false,
      },
    ],
  },
  {
    name: "discover-requirements",
    description:
      "Generate requirements-discovery questions to clarify what to build before implementation",
    arguments: [
      {
        name: "projectPath",
        description: "Path to the project root directory",
        required: true,
      },
      {
        name: "topic",
        description: "Specific topic to focus questions on",
        required: false,
      },
      {
        name: "userInput",
        description: "What the user just said or is asking about",
        required: false,
      },
    ],
  },
  {
    name: "project-health-check",
    description:
      "Analyze the codebase and suggest the most impactful next actions across all areas",
    arguments: [
      {
        name: "projectPath",
        description: "Path to the project root directory",
        required: true,
      },
      {
        name: "currentTask",
        description: "What you are currently working on",
        required: false,
      },
    ],
  },
];

export function buildPromptMessage(
  name: string,
  args: Record<string, string> | undefined
): string {
  const projectPath = args?.projectPath || ".";

  switch (name) {
    case "plan-feature":
      return `Use the generate_plan tool to create an implementation plan.

Project path: ${projectPath}
Goal: ${args?.goal || "Improve the project"}
Timeframe: ${args?.timeframe || "this-sprint"}
${args?.constraints ? `Constraints: ${args.constraints}` : ""}

Analyze the project state and return a phased plan with risks, mitigations, and critical companion actions.`;

    case "discover-requirements":
      return `Use the generate_strategic_questions tool in "asking" mode.

Project path: ${projectPath}
${args?.topic ? `Topic: ${args.topic}` : ""}
${args?.userInput ? `User context: ${args.userInput}` : ""}

Generate clarifying questions to uncover requirements, edge cases, and success criteria before building.`;

    case "project-health-check":
      return `Use the suggest_next_actions tool with focusArea "all".

Project path: ${projectPath}
${args?.currentTask ? `Current task: ${args.currentTask}` : ""}

Return prioritized next actions with ready-to-use implementation prompts based on the project's current state.`;

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
