import { type ModelMessage, stepCountIs, streamText, type ToolSet } from "ai";
import type { MessagePart, ToolCallPart, ToolResultPart } from "@/lib/types/parts";
import type { ToolContext } from "./context";
import { pushTextDelta, toolCallPart, toolResultPart } from "./messages";

/**
 * The shared turn loop. Runs one `streamText` invocation (which itself may span
 * multiple model steps when tools are used), consumes `fullStream`, and turns
 * each event into:
 *   - an accumulated `MessagePart[]` (the stored format), and
 *   - callbacks the caller wires to SSE emission and DB checkpointing.
 *
 * Used by both the orchestrator and each sub-agent — they differ only in how
 * the callbacks are wired, not in how a turn is consumed.
 */
export interface RunTurnArgs {
  model: Parameters<typeof streamText>[0]["model"];
  system: string;
  messages: ModelMessage[];
  tools: ToolSet;
  context: ToolContext;
  /** Max model steps; bounds tool-call loops. */
  maxSteps: number;
  signal?: AbortSignal;
  onTextDelta?: (delta: string) => void;
  onToolCall?: (part: ToolCallPart) => void;
  onToolResult?: (part: ToolResultPart) => void;
  /** Called after each tool event and once at the end — persist progress here. */
  onCheckpoint?: (parts: MessagePart[]) => void | Promise<void>;
}

export interface RunTurnResult {
  parts: MessagePart[];
  text: string;
}

function collapseText(parts: MessagePart[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function runAgentTurn(args: RunTurnArgs): Promise<RunTurnResult> {
  const parts: MessagePart[] = [];

  const result = streamText({
    model: args.model,
    system: args.system,
    messages: args.messages,
    tools: args.tools,
    stopWhen: stepCountIs(args.maxSteps),
    experimental_context: args.context,
    abortSignal: args.signal,
  });

  for await (const event of result.fullStream) {
    switch (event.type) {
      case "text-delta": {
        pushTextDelta(parts, event.text);
        args.onTextDelta?.(event.text);
        break;
      }
      case "tool-call": {
        const part = toolCallPart(event.toolCallId, event.toolName, event.input);
        parts.push(part);
        args.onToolCall?.(part);
        await args.onCheckpoint?.(parts);
        break;
      }
      case "tool-result": {
        const part = toolResultPart(
          event.toolCallId,
          event.toolName,
          event.output,
          event.input,
        );
        parts.push(part);
        args.onToolResult?.(part);
        await args.onCheckpoint?.(parts);
        break;
      }
      case "tool-error": {
        // Surface the failure to the UI and persist it; the model also sees it
        // and can recover on the next step.
        const message =
          event.error instanceof Error ? event.error.message : String(event.error);
        const part = toolResultPart(
          event.toolCallId,
          event.toolName,
          { error: message },
          event.input,
        );
        parts.push(part);
        args.onToolResult?.(part);
        await args.onCheckpoint?.(parts);
        break;
      }
      case "error": {
        const err = (event as { error: unknown }).error;
        throw err instanceof Error ? err : new Error(String(err));
      }
      default:
        break;
    }
  }

  // Final checkpoint captures trailing text that followed the last tool event.
  await args.onCheckpoint?.(parts);

  return { parts, text: collapseText(parts) };
}
