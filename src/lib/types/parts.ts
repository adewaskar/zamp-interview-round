/**
 * Message "parts" — the persisted representation of a conversation turn.
 *
 * A message is `{ role, content: MessagePart[] }`. The assistant's content is a
 * flat, ordered sequence of parts: interleaved text the model wrote, the tool
 * calls it made, and the results those tools returned. Storing the turn as an
 * ordered part list (rather than a single string) is what lets us re-render a
 * conversation exactly as it streamed — including tool calls and sub-agent
 * traces — and feed a faithful history back to the model on the next turn.
 *
 * This mirrors the AI SDK's content-part model. The DB convention is
 * `args`/`result`; the AI SDK stream/model convention is `input`/`output`.
 * The conversion lives in `src/lib/ai/messages.ts`.
 */

export type ChatRole = "user" | "assistant" | "tool" | "system";

export interface TextPart {
  type: "text";
  text: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  /** Arguments the model passed to the tool (AI SDK calls this `input`). */
  args: unknown;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  /** Original call args, kept alongside the result for self-contained rendering. */
  args?: unknown;
  /** Value the tool returned (AI SDK calls this `output`). */
  result: unknown;
}

export type MessagePart = TextPart | ToolCallPart | ToolResultPart;

export interface ChatMessage {
  /** Mongo subdocument id, present once persisted. */
  _id?: string;
  role: ChatRole;
  content: MessagePart[];
  createdAt?: string;
}

export const isTextPart = (p: MessagePart): p is TextPart => p.type === "text";
export const isToolCallPart = (p: MessagePart): p is ToolCallPart =>
  p.type === "tool-call";
export const isToolResultPart = (p: MessagePart): p is ToolResultPart =>
  p.type === "tool-result";
