import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/services/agent.service", () => ({
  getAgentBySlug: vi.fn(),
}));
vi.mock("@/lib/ai/sub-agent", () => ({
  runSubAgent: vi.fn(),
}));

import { delegateTool } from "./delegate";
import { getAgentBySlug } from "@/lib/db/services/agent.service";
import { runSubAgent } from "@/lib/ai/sub-agent";
import type { AgentDTO } from "@/lib/types/api";
import type { DelegateToolResult } from "@/lib/types/delegation";

// `tool().execute` is typed as value-or-async-iterable; ours always returns a value.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runDelegate = (input: any, opts: any) =>
  delegateTool.execute!(input, opts) as Promise<DelegateToolResult>;

const mockedGet = vi.mocked(getAgentBySlug);
const mockedRun = vi.mocked(runSubAgent);

function makeAgent(slug: string, enabled = true): AgentDTO {
  return {
    id: slug,
    slug,
    name: `${slug} agent`,
    description: "d",
    instructions: "i",
    tools: ["web_search"],
    model: "gpt-4.1",
    enabled,
    createdAt: "",
    updatedAt: "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function options(depth = 0): any {
  return {
    toolCallId: "tc",
    messages: [],
    experimental_context: {
      run: { sessionId: "s", depth, emit: vi.fn(), signal: undefined },
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("delegate tool", () => {
  it("runs known enabled agents and reports rejected ones", async () => {
    mockedGet.mockImplementation(async (slug: string) =>
      slug === "known" ? makeAgent("known") : slug === "off" ? makeAgent("off", false) : null,
    );
    mockedRun.mockImplementation(async (_run, agent, task) => ({
      delegationId: task.delegationId,
      taskId: task.taskId,
      agentSlug: agent.slug,
      agentName: agent.name,
      input: task.input,
      status: "completed" as const,
      summary: `did ${task.taskId}`,
      parts: [{ type: "text", text: `did ${task.taskId}` }],
    }));

    const res = await runDelegate(
      {
        tasks: [
          { agentSlug: "known", taskId: "a", input: "do a" },
          { agentSlug: "missing", taskId: "b", input: "do b" },
          { agentSlug: "off", taskId: "c", input: "do c" },
        ],
      },
      options(),
    );

    expect(res.delegations).toHaveLength(1);
    expect(res.delegations[0].summary).toBe("did a");
    expect(mockedRun).toHaveBeenCalledTimes(1);
    expect(res.rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ agentSlug: "missing", reason: expect.stringMatching(/No such/) }),
        expect.objectContaining({ agentSlug: "off", reason: expect.stringMatching(/disabled/) }),
      ]),
    );
    // Compact rollup the orchestrator reads back includes the summary.
    expect(res.message).toContain("did a");
  });

  it("runs multiple tasks in parallel", async () => {
    mockedGet.mockImplementation(async (slug: string) => makeAgent(slug));
    mockedRun.mockImplementation(async (_run, agent, task) => ({
      delegationId: task.delegationId,
      taskId: task.taskId,
      agentSlug: agent.slug,
      agentName: agent.name,
      input: task.input,
      status: "completed" as const,
      summary: "ok",
      parts: [],
    }));

    const res = await runDelegate(
      {
        tasks: [
          { agentSlug: "one", taskId: "1", input: "x" },
          { agentSlug: "two", taskId: "2", input: "y" },
        ],
      },
      options(),
    );
    expect(res.delegations).toHaveLength(2);
    expect(mockedRun).toHaveBeenCalledTimes(2);
  });

  it("blocks delegation once max depth is reached", async () => {
    const res = await runDelegate(
      { tasks: [{ agentSlug: "known", taskId: "a", input: "x" }] },
      options(1), // MAX_DELEGATION_DEPTH === 1
    );
    expect(res.delegations).toHaveLength(0);
    expect(mockedGet).not.toHaveBeenCalled();
    expect(res.message).toMatch(/cannot delegate further/i);
  });

  it("compacts the model-facing output to the rollup message", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = (delegateTool as any).toModelOutput({
      toolCallId: "t",
      input: {},
      output: { delegations: [{ parts: ["huge transcript"] }], message: "ROLLUP" },
    });
    expect(out).toEqual({ type: "text", value: "ROLLUP" });
  });
});
