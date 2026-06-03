import { randomUUID } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { getAgentBySlug } from "@/lib/db/services/agent.service";
import { MAX_DELEGATION_DEPTH, type ToolContext } from "@/lib/ai/context";
import { runSubAgent } from "@/lib/ai/sub-agent";
import type {
  DelegateToolResult,
  DelegationOutcome,
} from "@/lib/types/delegation";

const TaskSchema = z.object({
  agentSlug: z
    .string()
    .describe("Slug of a sub-agent from your available list (exact match)."),
  taskId: z
    .string()
    .describe('Short unique label for this task (e.g. "competitors").'),
  input: z
    .string()
    .min(1)
    .describe(
      "Complete, self-contained prompt for the sub-agent. It cannot see this conversation.",
    ),
});

const InputSchema = z.object({
  tasks: z
    .array(TaskSchema)
    .min(1)
    .max(5)
    .describe("One or more tasks. Multiple tasks run in parallel."),
});

/** Compact text the orchestrator reads back (keeps sub-agent transcripts out of its context). */
function buildRollup(
  outcomes: DelegationOutcome[],
  rejected: DelegateToolResult["rejected"],
): string {
  const blocks = outcomes.map((o) =>
    o.status === "completed"
      ? `### ${o.agentName} — ${o.taskId}\n${o.summary}`
      : `### ${o.agentName} — ${o.taskId}\n[failed: ${o.error ?? "unknown error"}]`,
  );
  if (rejected?.length) {
    blocks.push(
      `### Rejected tasks\n${rejected
        .map((r) => `- ${r.agentSlug} (${r.taskId}): ${r.reason}`)
        .join("\n")}`,
    );
  }
  return blocks.join("\n\n") || "No tasks were executed.";
}

export const delegateTool = tool({
  description:
    "Delegate one or more self-contained tasks to your available sub-agents. Each sub-agent runs independently with its own tools and returns a written result. Put multiple tasks in one call to run them in parallel. Only use agent slugs from your available sub-agents list.",
  inputSchema: InputSchema,
  execute: async ({ tasks }, options): Promise<DelegateToolResult> => {
    const ctx = options?.experimental_context as ToolContext | undefined;
    const run = ctx?.run;

    if (!run) {
      return { delegations: [], message: "Internal error: missing run context." };
    }
    if (run.depth >= MAX_DELEGATION_DEPTH) {
      return {
        delegations: [],
        message: "Sub-agents cannot delegate further (max depth reached).",
      };
    }

    // Validate each task's target agent before running anything.
    const rejected: NonNullable<DelegateToolResult["rejected"]> = [];
    const runnable: { agent: Awaited<ReturnType<typeof getAgentBySlug>>; taskId: string; input: string }[] =
      [];

    for (const t of tasks) {
      const agent = await getAgentBySlug(t.agentSlug, run.userId);
      if (!agent) {
        rejected.push({ taskId: t.taskId, agentSlug: t.agentSlug, reason: "No such sub-agent." });
      } else if (!agent.enabled) {
        rejected.push({ taskId: t.taskId, agentSlug: t.agentSlug, reason: "Sub-agent is disabled." });
      } else {
        runnable.push({ agent, taskId: t.taskId, input: t.input });
      }
    }

    const delegations = await Promise.all(
      runnable.map(({ agent, taskId, input }) =>
        runSubAgent(run, agent!, { taskId, input, delegationId: randomUUID() }),
      ),
    );

    return {
      delegations,
      message: buildRollup(delegations, rejected.length ? rejected : undefined),
      ...(rejected.length ? { rejected } : {}),
    };
  },
  // The model only needs the compact rollup; the full transcript stays in the
  // persisted result for the UI to render.
  toModelOutput: ({ output }) => ({ type: "text", value: output.message }),
});
