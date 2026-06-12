#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  suggestNextActions,
  suggestNextActionsSchema,
} from "./tools/suggest-next-actions.js";
import {
  generateStrategicQuestions,
  strategicQuestionsSchema,
} from "./tools/strategic-questions.js";
import { generatePlan, planningAdvisorSchema } from "./tools/planning-advisor.js";

const tools: Tool[] = [
  {
    name: "suggest_next_actions",
    description: `Analyzes the project codebase and suggests the next 4-5 most impactful actions with ready-to-use prompts.
    
Analyzes:
- Project structure, framework, and language
- Security vulnerabilities (exposed secrets, missing headers, auth issues)
- Missing features (tests, CI/CD, monitoring, auth)
- UI/UX improvements (loading states, accessibility, dark mode, responsive)
- Performance optimization opportunities
- Deployment and DevOps needs
- Documentation gaps
- Technical debt

Returns prioritized actions with complete, contextual prompts you can use immediately.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Path to the project root directory",
        },
        count: {
          type: "number",
          description: "Number of suggestions (1-10, default 5)",
          minimum: 1,
          maximum: 10,
          default: 5,
        },
        focusArea: {
          type: "string",
          description: "Focus area for suggestions",
          enum: [
            "security",
            "performance",
            "testing",
            "deployment",
            "ui-ux",
            "feature",
            "all",
          ],
          default: "all",
        },
        currentTask: {
          type: "string",
          description: "What you are currently working on",
        },
      },
      required: ["projectPath"],
    },
  },
  {
    name: "generate_strategic_questions",
    description: `Generates relevant strategic questions to clarify requirements, improve planning, and uncover hidden issues.

Modes:
- planning: Broad strategic questions about architecture, scale, and business goals
- agent: Specific implementation questions when working on a feature
- asking: Requirements clarification questions to understand what to build

Categories covered:
- Architecture decisions and trade-offs
- Scalability and performance planning  
- Security and compliance requirements
- User experience and business logic
- Technical debt and team workflow
- Deployment and data management

Returns questions with context, answer options, and follow-up questions.`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Path to the project root directory",
        },
        mode: {
          type: "string",
          enum: ["planning", "agent", "asking"],
          description:
            "Question mode: planning (strategic), agent (implementation), asking (requirements)",
          default: "planning",
        },
        count: {
          type: "number",
          description: "Number of questions (1-10, default 5)",
          minimum: 1,
          maximum: 10,
          default: 5,
        },
        topic: {
          type: "string",
          description: "Specific topic to focus questions on",
        },
        userInput: {
          type: "string",
          description: "What the user just said or asked about",
        },
      },
      required: ["projectPath"],
    },
  },
  {
    name: "generate_plan",
    description: `Creates a comprehensive, phased implementation plan for a specific goal.

Provides:
- Pre-planning questions to answer before starting
- Phased implementation plan with timeline
- Risk identification and mitigation strategies
- Critical actions that should accompany the work
- Context-aware suggestions based on current project state`,
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Path to the project root directory",
        },
        goal: {
          type: "string",
          description: "What you are trying to achieve or build",
        },
        timeframe: {
          type: "string",
          enum: ["today", "this-week", "this-sprint", "this-month", "this-quarter"],
          default: "this-sprint",
        },
        constraints: {
          type: "string",
          description: "Any constraints (team size, tech limitations, budget)",
        },
      },
      required: ["projectPath", "goal"],
    },
  },
];

async function main() {
  const server = new Server(
    {
      name: "project-intelligence",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "suggest_next_actions": {
          const input = suggestNextActionsSchema.parse(args);
          result = await suggestNextActions(input);
          break;
        }
        case "generate_strategic_questions": {
          const input = strategicQuestionsSchema.parse(args);
          result = await generateStrategicQuestions(input);
          break;
        }
        case "generate_plan": {
          const input = planningAdvisorSchema.parse(args);
          result = await generatePlan(input);
          break;
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Project Intelligence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
