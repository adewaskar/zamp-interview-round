import type { ModelMessage } from "ai";
import type {
  ChatMessage,
  MessagePart,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from "@/lib/types/parts";

/**
 * Conversion between our stored "parts" format and the AI SDK's `ModelMessage`
 * format.
 *
 * The two conventions differ deliberately:
 *  - Storage:   tool-call uses `args`,  tool-result uses `result`. Both the
 *               call and its result live in the SAME assistant message, in the
 *               order they streamed.
 *  - AI SDK v6: tool-call uses `input`, tool-result uses `output` (a typed
 *               union), and results must live in a separate `role: 'tool'`
 *               message that follows the assistant message.
 *
 * `toModelMessages` performs the non-trivial direction: it splits each stored
 * assistant turn into an assistant message (text + tool-calls) plus a trailing
 * tool message (tool-results), which is what the model needs to see to continue
 * a multi-step tool conversation faithfully.
 */

// ----- part builders (used by the streaming runner) -----

export const textPart = (text: string): TextPart => ({ type: "text", text });

export const toolCallPart = (
  toolCallId: string,
  toolName: string,
  args: unknown,
): ToolCallPart => ({ type: "tool-call", toolCallId, toolName, args });

export const toolResultPart = (
  toolCallId: string,
  toolName: string,
  result: unknown,
  args?: unknown,
): ToolResultPart => ({ type: "tool-result", toolCallId, toolName, args, result });

/**
 * Append a text delta, coalescing into the trailing text part when possible so
 * a streamed turn produces one text part per contiguous text run rather than
 * one per token.
 */
export function pushTextDelta(parts: MessagePart[], delta: string): void {
  if (!delta) return;
  const last = parts[parts.length - 1];
  if (last && last.type === "text") {
    last.text += delta;
  } else {
    parts.push(textPart(delta));
  }
}

// ----- stored parts -> AI SDK ModelMessage[] -----

/** Wrap a tool's return value in the AI SDK's typed tool-output union. */
export function toToolOutput(result: unknown): {
  type: "text" | "json";
  value: unknown;
} {
  if (typeof result === "string") return { type: "text", value: result };
  return { type: "json", value: result ?? null };
}

/**
 * What the model should see for a stored tool-result on replay. Identical to
 * `toToolOutput` except for `delegate`: its stored result carries the full
 * sub-agent transcript (for the UI), so we replay only the compact `message`
 * to keep the orchestrator's context lean across turns.
 */
function toolResultModelOutput(part: ToolResultPart): {
  type: "text" | "json";
  value: unknown;
} {
  if (
    part.toolName === "delegate" &&
    part.result &&
    typeof part.result === "object"
  ) {
    const message = (part.result as { message?: unknown }).message;
    if (typeof message === "string") return { type: "text", value: message };
  }
  return toToolOutput(part.result);
}

function collapseText(parts: MessagePart[]): string {
  return parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function toModelMessages(messages: ChatMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];

  for (const message of messages) {
    const parts = message.content ?? [];

    if (message.role === "user") {
      const text = collapseText(parts);
      if (text) out.push({ role: "user", content: text });
      continue;
    }

    if (message.role === "system") {
      const text = collapseText(parts);
      if (text) out.push({ role: "system", content: text });
      continue;
    }

    if (message.role === "assistant") {
      // Assistant content: text + tool-call parts, in original stream order.
      const assistantContent: Array<
        { type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
      > = [];
      const toolResults: ToolResultPart[] = [];

      for (const part of parts) {
        if (part.type === "text") {
          if (part.text) assistantContent.push({ type: "text", text: part.text });
        } else if (part.type === "tool-call") {
          assistantContent.push({
            type: "tool-call",
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            input: part.args,
          });
        } else if (part.type === "tool-result") {
          toolResults.push(part);
        }
      }

      if (assistantContent.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        out.push({ role: "assistant", content: assistantContent as any });
      }

      if (toolResults.length > 0) {
        out.push({
          role: "tool",
          content: toolResults.map((r) => ({
            type: "tool-result" as const,
            toolCallId: r.toolCallId,
            toolName: r.toolName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output: toolResultModelOutput(r) as any,
          })),
        });
      }
    }
  }

  return out;
}
