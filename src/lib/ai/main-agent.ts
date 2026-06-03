import { DEFAULT_MODEL } from "@/lib/config";
import { listAgents } from "@/lib/db/services/agent.service";
import {
  appendMessage,
  getSession,
  setTitleIfDefault,
  updateMessageContent,
} from "@/lib/db/services/chat-session.service";
import { buildMainAgentTools } from "@/lib/tools";
import type { ChatMessage } from "@/lib/types/parts";
import type { ChatStreamEvent } from "@/lib/types/sse";
import type { AgentRunContext } from "./context";
import { runAgentTurn } from "./engine";
import { applyAgentMentions } from "./mentions";
import { toModelMessages } from "./messages";
import { buildMainAgentSystemPrompt } from "./prompts";
import { languageModel } from "./registry";

const MAIN_AGENT_MAX_STEPS = 14;

export interface RunMainAgentArgs {
  sessionId: string;
  userText: string;
  emit: (event: ChatStreamEvent) => void;
  signal?: AbortSignal;
}

/**
 * Drive one orchestrator turn:
 *  1. persist the user message (and auto-title the session on the first one),
 *  2. create the assistant message and announce its id,
 *  3. stream the turn — emitting SSE events and checkpointing parts to Mongo,
 *  4. signal completion.
 */
export async function runMainAgent({
  sessionId,
  userText,
  emit,
  signal,
}: RunMainAgentArgs): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found.");

  const enabledAgents = (await listAgents()).filter((a) => a.enabled);

  // 1. Persist the RAW user turn (the UI shows exactly what was typed).
  await appendMessage(sessionId, {
    role: "user",
    content: [{ type: "text", text: userText }],
  });
  await setTitleIfDefault(sessionId, userText);

  // 2. Create the (empty) assistant message we'll stream into.
  const assistantId = await appendMessage(sessionId, {
    role: "assistant",
    content: [],
  });
  emit({ type: "message-start", messageId: assistantId });

  // 3. Build model input from full history. For the current turn, expand
  //    `@slug` mentions into `<agent>slug</agent>` directives the orchestrator
  //    treats as an explicit request to use that sub-agent.
  const userMessage: ChatMessage = {
    role: "user",
    content: [{ type: "text", text: applyAgentMentions(userText, enabledAgents) }],
  };
  const modelMessages = toModelMessages([...session.messages, userMessage]);

  const runContext: AgentRunContext = { sessionId, depth: 0, signal, emit };

  const { parts } = await runAgentTurn({
    model: languageModel(session.model || DEFAULT_MODEL),
    system: buildMainAgentSystemPrompt(enabledAgents),
    messages: modelMessages,
    tools: buildMainAgentTools(),
    context: { run: runContext },
    maxSteps: MAIN_AGENT_MAX_STEPS,
    signal,
    onTextDelta: (delta) => emit({ type: "text-delta", delta }),
    onToolCall: (p) =>
      emit({ type: "tool-call", toolCallId: p.toolCallId, toolName: p.toolName, args: p.args }),
    onToolResult: (p) =>
      emit({ type: "tool-result", toolCallId: p.toolCallId, toolName: p.toolName, result: p.result }),
    onCheckpoint: (current) => updateMessageContent(sessionId, assistantId, current),
  });

  // 4. Belt-and-suspenders final persist, then done.
  await updateMessageContent(sessionId, assistantId, parts);
  emit({ type: "done", messageId: assistantId });
}
