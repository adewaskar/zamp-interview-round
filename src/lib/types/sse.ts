/**
 * Server-sent event protocol for `POST /api/sessions/:id/messages`.
 *
 * The route streams the assistant turn as a sequence of these events, one JSON
 * object per SSE `data:` line. The main thread emits `text-delta` / `tool-call`
 * / `tool-result`; when the orchestrator delegates, the sub-agent's own loop is
 * surfaced live through the `agent-*` events (keyed by `delegationId`) so the UI
 * can show nested sub-agent traces as they happen.
 */
export type ChatStreamEvent =
  // ---- lifecycle ----
  | { type: "message-start"; messageId: string }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string }
  // ---- main agent ----
  | { type: "text-delta"; delta: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown }
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: string;
      result: unknown;
    }
  // ---- nested sub-agent trace (delegate tool) ----
  | {
      type: "agent-start";
      delegationId: string;
      taskId: string;
      agentSlug: string;
      agentName: string;
      input: string;
    }
  | { type: "agent-text-delta"; delegationId: string; delta: string }
  | {
      type: "agent-tool-call";
      delegationId: string;
      toolCallId: string;
      toolName: string;
      args: unknown;
    }
  | {
      type: "agent-tool-result";
      delegationId: string;
      toolCallId: string;
      toolName: string;
      result: unknown;
    }
  | {
      type: "agent-finish";
      delegationId: string;
      status: "completed" | "failed";
      summary: string;
      error?: string;
    };

export type ChatStreamEventType = ChatStreamEvent["type"];
