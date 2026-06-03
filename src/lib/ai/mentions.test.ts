import { describe, expect, it } from "vitest";
import type { AgentDTO } from "@/lib/types/api";
import { applyAgentMentions } from "./mentions";

function agent(slug: string): AgentDTO {
  return {
    id: slug,
    slug,
    name: slug,
    description: "",
    instructions: "",
    tools: [],
    model: "gpt-4.1",
    enabled: true,
    createdAt: "",
    updatedAt: "",
  };
}

const agents = [agent("company-profiler"), agent("market-analyst")];

describe("applyAgentMentions", () => {
  it("rewrites a known @slug into an <agent> directive", () => {
    expect(applyAgentMentions("use @company-profiler on Stripe", agents)).toBe(
      "use <agent>company-profiler</agent> on Stripe",
    );
  });

  it("rewrites multiple mentions", () => {
    expect(
      applyAgentMentions("@company-profiler and @market-analyst please", agents),
    ).toBe("<agent>company-profiler</agent> and <agent>market-analyst</agent> please");
  });

  it("matches slugs case-insensitively", () => {
    expect(applyAgentMentions("@Company-Profiler", agents)).toBe(
      "<agent>company-profiler</agent>",
    );
  });

  it("leaves unknown mentions untouched", () => {
    expect(applyAgentMentions("ask @nobody about it", agents)).toBe(
      "ask @nobody about it",
    );
  });

  it("does not rewrite mid-token @ (e.g. emails)", () => {
    expect(applyAgentMentions("mail me at a@market-analyst.com", agents)).toBe(
      "mail me at a@market-analyst.com",
    );
  });

  it("is a no-op when there are no agents", () => {
    expect(applyAgentMentions("@company-profiler", [])).toBe("@company-profiler");
  });
});
