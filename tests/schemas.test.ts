import { describe, it, expect } from "vitest";
import { suggestNextActionsSchema } from "../src/tools/suggest-next-actions.js";
import { strategicQuestionsSchema } from "../src/tools/strategic-questions.js";
import { planningAdvisorSchema } from "../src/tools/planning-advisor.js";

describe("Zod schemas", () => {
  it("validates suggest_next_actions input", () => {
    const result = suggestNextActionsSchema.parse({
      projectPath: "/tmp/project",
      count: 3,
      focusArea: "testing",
    });
    expect(result.count).toBe(3);
    expect(result.focusArea).toBe("testing");
  });

  it("applies defaults for suggest_next_actions", () => {
    const result = suggestNextActionsSchema.parse({
      projectPath: "/tmp/project",
    });
    expect(result.count).toBe(5);
    expect(result.focusArea).toBe("all");
  });

  it("validates generate_strategic_questions input", () => {
    const result = strategicQuestionsSchema.parse({
      projectPath: "/tmp/project",
      mode: "planning",
      topic: "deployment",
    });
    expect(result.mode).toBe("planning");
    expect(result.count).toBe(5);
  });

  it("validates generate_plan input", () => {
    const result = planningAdvisorSchema.parse({
      projectPath: "/tmp/project",
      goal: "Ship v1.0",
      timeframe: "this-week",
    });
    expect(result.goal).toBe("Ship v1.0");
    expect(result.timeframe).toBe("this-week");
  });

  it("rejects invalid focusArea", () => {
    expect(() =>
      suggestNextActionsSchema.parse({
        projectPath: "/tmp/project",
        focusArea: "invalid",
      })
    ).toThrow();
  });
});
