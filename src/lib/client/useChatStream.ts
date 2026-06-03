"use client";

/**
 * Drives a single streaming chat turn against
 * `POST /api/sessions/:id/messages` (which returns `text/event-stream`).
 *
 * Because the endpoint is a POST we cannot use `EventSource`; instead we read
 * `response.body` with a `ReadableStreamDefaultReader`, buffer the decoded text,
 * split on the SSE frame delimiter (`\n\n`), strip the leading `data: `, and
 * parse each frame as a `ChatStreamEvent`.
 *
 * The reducer in `applyEvent` folds the event stream into the assistant
 * message's ordered `MessagePart[]`. The key design choice: a `delegate`
 * tool-call part owns a synthesized `DelegateToolResult` that the nested
 * `agent-*` events accumulate into. That means the live shape is byte-for-byte
 * the same as what the server persists, so the delegation renderer treats live
 * and reloaded state identically.
 */
import { useCallback, useRef, useState } from "react";
import type { ChatMessage, MessagePart } from "@/lib/types/parts";
import type {
  DelegateToolResult,
  DelegationOutcome,
} from "@/lib/types/delegation";
import type { ChatStreamEvent } from "@/lib/types/sse";

const DELEGATE_TOOL = "delegate";

/** Append a text delta, coalescing into the trailing text part. */
function pushTextDelta(parts: MessagePart[], delta: string): void {
  if (!delta) return;
  const last = parts[parts.length - 1];
  if (last && last.type === "text") {
    last.text += delta;
  } else {
    parts.push({ type: "text", text: delta });
  }
}

/** Find (or lazily create) the `DelegateToolResult` carried by a delegate part. */
function ensureDelegateResult(part: {
  result?: unknown;
}): DelegateToolResult {
  const current = part.result as DelegateToolResult | undefined;
  if (current && Array.isArray(current.delegations)) return current;
  const fresh: DelegateToolResult = { delegations: [], message: "" };
  part.result = fresh;
  return fresh;
}

/** Locate the live delegation row for a delegationId across all parts. */
function findDelegation(
  parts: MessagePart[],
  delegationId: string,
): DelegationOutcome | undefined {
  for (const part of parts) {
    if (part.type !== "tool-result" || part.toolName !== DELEGATE_TOOL) continue;
    const result = part.result as DelegateToolResult | undefined;
    const match = result?.delegations?.find(
      (d) => d.delegationId === delegationId,
    );
    if (match) return match;
  }
  return undefined;
}

/**
 * Fold one event into the assistant message's parts (mutating a fresh array
 * the caller has cloned). Returns nothing; the parts array is updated in place.
 */
function applyEvent(parts: MessagePart[], event: ChatStreamEvent): void {
  switch (event.type) {
    case "text-delta":
      pushTextDelta(parts, event.delta);
      return;

    case "tool-call":
      parts.push({
        type: "tool-call",
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        args: event.args,
      });
      return;

    case "tool-result": {
      // A delegate result may have streamed its children already; preserve them.
      const existing = parts.find(
        (p): p is Extract<MessagePart, { type: "tool-result" }> =>
          p.type === "tool-result" && p.toolCallId === event.toolCallId,
      );
      const merged =
        event.toolName === DELEGATE_TOOL && existing
          ? mergeDelegateResult(existing.result, event.result)
          : event.result;
      if (existing) {
        existing.result = merged;
        existing.toolName = event.toolName;
      } else {
        parts.push({
          type: "tool-result",
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          result: merged,
        });
      }
      return;
    }

    // ---- nested sub-agent trace ----
    case "agent-start": {
      // Attach to the delegate tool-result for this turn, creating one if the
      // tool-result frame has not arrived yet.
      let host = parts.find(
        (p): p is Extract<MessagePart, { type: "tool-result" }> =>
          p.type === "tool-result" && p.toolName === DELEGATE_TOOL,
      );
      if (!host) {
        host = {
          type: "tool-result",
          toolCallId: `delegate:${event.delegationId}`,
          toolName: DELEGATE_TOOL,
          result: { delegations: [], message: "" } as DelegateToolResult,
        };
        parts.push(host);
      }
      const result = ensureDelegateResult(host);
      if (!result.delegations.some((d) => d.delegationId === event.delegationId)) {
        result.delegations.push({
          delegationId: event.delegationId,
          taskId: event.taskId,
          agentSlug: event.agentSlug,
          agentName: event.agentName,
          input: event.input,
          status: "completed",
          summary: "",
          parts: [],
        });
      }
      return;
    }

    case "agent-text-delta": {
      const delegation = findDelegation(parts, event.delegationId);
      if (delegation) pushTextDelta(delegation.parts, event.delta);
      return;
    }

    case "agent-tool-call": {
      const delegation = findDelegation(parts, event.delegationId);
      delegation?.parts.push({
        type: "tool-call",
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        args: event.args,
      });
      return;
    }

    case "agent-tool-result": {
      const delegation = findDelegation(parts, event.delegationId);
      delegation?.parts.push({
        type: "tool-result",
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        result: event.result,
      });
      return;
    }

    case "agent-finish": {
      const delegation = findDelegation(parts, event.delegationId);
      if (delegation) {
        delegation.status = event.status;
        delegation.summary = event.summary;
        if (event.error) delegation.error = event.error;
      }
      return;
    }

    // lifecycle / error events are handled by the caller, not the reducer
    default:
      return;
  }
}

/**
 * When the final delegate `tool-result` arrives it carries the authoritative
 * `DelegateToolResult`. Merge it over any live-accumulated state, preferring the
 * server's `delegations`/`message` but keeping live nested `parts` if the server
 * omitted them (it normally includes them).
 */
function mergeDelegateResult(live: unknown, incoming: unknown): unknown {
  const incomingResult = incoming as DelegateToolResult | undefined;
  if (!incomingResult || !Array.isArray(incomingResult.delegations)) {
    return live ?? incoming;
  }
  const liveResult = live as DelegateToolResult | undefined;
  const byId = new Map<string, DelegationOutcome>();
  for (const d of liveResult?.delegations ?? []) byId.set(d.delegationId, d);
  const delegations = incomingResult.delegations.map((d) => {
    const prior = byId.get(d.delegationId);
    return {
      ...d,
      parts: d.parts?.length ? d.parts : (prior?.parts ?? []),
    };
  });
  return { ...incomingResult, delegations };
}

export interface ChatStreamHandlers {
  /** Called when a new assistant message is created (message-start). */
  onMessageStart: (messageId: string) => void;
  /** Called after every applied event with the rebuilt assistant content. */
  onAssistantUpdate: (messageId: string, content: MessagePart[]) => void;
  /** Stream finished cleanly. */
  onDone?: (messageId: string) => void;
  /** A protocol `error` event or a transport failure. */
  onError?: (message: string) => void;
}

/** Split a raw chunk into complete SSE frames, returning the unparsed remainder. */
function drainFrames(buffer: string): { frames: string[]; rest: string } {
  const frames: string[] = [];
  let idx = buffer.indexOf("\n\n");
  while (idx !== -1) {
    frames.push(buffer.slice(0, idx));
    buffer = buffer.slice(idx + 2);
    idx = buffer.indexOf("\n\n");
  }
  return { frames, rest: buffer };
}

/** Parse a single SSE frame body (possibly multi-line) into an event. */
function parseFrame(frame: string): ChatStreamEvent | null {
  const data = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return null;
  }
}

export interface UseChatStream {
  /** True while a turn is streaming. */
  streaming: boolean;
  /** Begin a turn for `sessionId`; resolves when the stream ends. */
  send: (
    sessionId: string,
    message: string,
    handlers: ChatStreamHandlers,
  ) => Promise<void>;
  /** Abort the in-flight turn (e.g. on unmount or session switch). */
  abort: () => void;
}

export function useChatStream(): UseChatStream {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (
      sessionId: string,
      message: string,
      handlers: ChatStreamHandlers,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      // Local working copy of the assistant message content, mutated as events
      // arrive and snapshotted (deep-cloned) to React on each update.
      let messageId = "";
      let content: MessagePart[] = [];
      const emit = () =>
        handlers.onAssistantUpdate(
          messageId,
          structuredClone(content) as MessagePart[],
        );

      try {
        const res = await fetch(`/api/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let msg = `Request failed (${res.status})`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body?.error) msg = body.error;
          } catch {
            /* non-JSON error body */
          }
          handlers.onError?.(msg);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handle = (event: ChatStreamEvent): boolean => {
          switch (event.type) {
            case "message-start":
              messageId = event.messageId;
              content = [];
              handlers.onMessageStart(messageId);
              emit();
              return true;
            case "error":
              handlers.onError?.(event.message);
              return false; // stop the stream
            case "done":
              handlers.onDone?.(event.messageId || messageId);
              return false;
            default:
              applyEvent(content, event);
              emit();
              return true;
          }
        };

        let open = true;
        while (open) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { frames, rest } = drainFrames(buffer);
          buffer = rest;
          for (const frame of frames) {
            const event = parseFrame(frame);
            if (!event) continue;
            if (!handle(event)) {
              open = false;
              break;
            }
          }
        }

        // Flush any trailing buffered frame without a final delimiter.
        if (open && buffer.trim()) {
          const event = parseFrame(buffer);
          if (event) handle(event);
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          handlers.onError?.(
            err instanceof Error ? err.message : "Stream connection failed",
          );
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [],
  );

  return { streaming, send, abort };
}

/** Build an optimistic user message for immediate echo in the list. */
export function optimisticUserMessage(text: string): ChatMessage {
  return {
    _id: `local-${Date.now()}`,
    role: "user",
    content: [{ type: "text", text }],
  };
}
