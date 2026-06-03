import type { ChatMessage } from "./parts";
import type { ToolId } from "../tools/catalog";

/** A user-defined sub-agent (the orchestrator can delegate to these). */
export interface AgentDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  instructions: string;
  tools: ToolId[];
  model: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type { CreateAgentBody, UpdateAgentBody } from "@/lib/schemas/agent";

/** Lightweight row for the chat sidebar list. */
export interface SessionListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/** Full session with its message history. */
export interface SessionDTO {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageBody {
  message: string;
}

/** Uniform error body returned by the API routes. */
export interface ApiError {
  error: string;
}
