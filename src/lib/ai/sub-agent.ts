import type { AgentDTO } from "@/lib/types/api";
import type { DelegationOutcome } from "@/lib/types/delegation";
import { buildLeafTools } from "@/lib/tools/leaf";
import type { AgentRunContext } from "./context";
import { runAgentTurn } from "./engine";
import { buildSubAgentSystemPrompt } from "./prompts";
import { languageModel } from "./registry";

const SUB_AGENT_MAX_STEPS = 8;

/**
 * Run one sub-agent against one delegated task to completion. The sub-agent has
 * its own system prompt (the user's instructions) and its own granted tools,
 * and runs its own bounded tool loop. Its internal steps are surfaced live to
 * the client as `agent-*` SSE events (keyed by `delegationId`), and its full
 * transcript is returned in the outcome so the delegation can be re-rendered
 * from the database later.
 */
export async function runSubAgent(
  parent: AgentRunContext,
  agent: AgentDTO,
  task: { taskId: string; input: string; delegationId: string },
): Promise<DelegationOutcome> {
  const { taskId, input, delegationId } = task;

  const base = {
    delegationId,
    taskId,
    agentSlug: agent.slug,
    agentName: agent.name,
    input,
  };

  parent.emit({ type: "agent-start", ...base });

  const childContext: AgentRunContext = {
    sessionId: parent.sessionId,
    depth: parent.depth + 1,
    signal: parent.signal,
    emit: () => {}, // leaf tools don't emit; nested events come from the callbacks below
  };

  try {
    const { parts, text } = await runAgentTurn({
      model: languageModel(agent.model),
      system: buildSubAgentSystemPrompt(agent),
      messages: [{ role: "user", content: input }],
      tools: buildLeafTools(agent.tools),
      context: { run: childContext },
      maxSteps: SUB_AGENT_MAX_STEPS,
      signal: parent.signal,
      onTextDelta: (delta) =>
        parent.emit({ type: "agent-text-delta", delegationId, delta }),
      onToolCall: (p) =>
        parent.emit({
          type: "agent-tool-call",
          delegationId,
          toolCallId: p.toolCallId,
          toolName: p.toolName,
          args: p.args,
        }),
      onToolResult: (p) =>
        parent.emit({
          type: "agent-tool-result",
          delegationId,
          toolCallId: p.toolCallId,
          toolName: p.toolName,
          result: p.result,
        }),
    });

    const summary = text.trim() || "(the sub-agent produced no written answer)";
    parent.emit({ type: "agent-finish", delegationId, status: "completed", summary });

    return { ...base, status: "completed", summary, parts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    parent.emit({
      type: "agent-finish",
      delegationId,
      status: "failed",
      summary: "",
      error: message,
    });
    return { ...base, status: "failed", summary: "", parts: [], error: message };
  }
}
