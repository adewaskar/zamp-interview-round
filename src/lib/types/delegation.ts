import type { MessagePart } from "./parts";

/**
 * Result of the `delegate` tool. The main agent calls `delegate` with one or
 * more tasks; each task is handed to a sub-agent that runs its own tool loop.
 * The full sub-agent transcript (`parts`) is stored inside the tool-result so
 * a delegation can be re-rendered exactly from the database on reload.
 */
export interface DelegationOutcome {
  delegationId: string;
  taskId: string;
  agentSlug: string;
  agentName: string;
  /** Prompt the main agent handed to this sub-agent. */
  input: string;
  status: "completed" | "failed";
  /** The sub-agent's final written answer. */
  summary: string;
  /** Full sub-agent transcript (text + tool-call + tool-result parts). */
  parts: MessagePart[];
  error?: string;
}

export interface DelegateToolResult {
  delegations: DelegationOutcome[];
  /** Compact rollup the orchestrator reads to continue reasoning. */
  message: string;
  /** Tasks rejected before running (unknown/disabled agent). */
  rejected?: { taskId: string; agentSlug: string; reason: string }[];
}
