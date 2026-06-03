import type { ChatStreamEvent } from "@/lib/types/sse";

/**
 * Runtime context threaded through an agent run and into every tool's
 * `execute` via the AI SDK's `experimental_context`. Tools read it as
 * `options.experimental_context as ToolContext`.
 */
export interface AgentRunContext {
  sessionId: string;
  /** Owner of the session — scopes data access (sub-agent lookups, etc.). */
  userId: string;
  /** Push an SSE event to the client. */
  emit: (event: ChatStreamEvent) => void;
  /** 0 = orchestrator. Sub-agents run at depth 1. Guards delegation recursion. */
  depth: number;
  /** Aborts the run (client disconnect). */
  signal?: AbortSignal;
}

export interface ToolContext {
  run: AgentRunContext;
}

/** Sub-agents may not delegate further; this caps the agent tree at one level. */
export const MAX_DELEGATION_DEPTH = 1;
