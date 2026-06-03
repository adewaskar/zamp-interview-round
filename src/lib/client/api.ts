/**
 * Typed client for the Scout REST API.
 *
 * Thin `fetch` wrappers that return the shared DTO types and throw an `Error`
 * carrying the server's `{ error }` message on any non-2xx response. The chat
 * streaming endpoint is intentionally NOT here — it returns `text/event-stream`
 * and is consumed by `useChatStream` instead.
 */
import type {
  AgentDTO,
  CreateAgentBody,
  SessionDTO,
  SessionListItem,
  UpdateAgentBody,
} from "@/lib/types/api";

/** Extract a human-readable message from an error response body. */
async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // body was not JSON; fall through to a generic message
  }
  return `Request failed (${res.status})`;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as T;
}

export const api = {
  // ----- sessions -----
  listSessions: () => request<SessionListItem[]>("/api/sessions"),

  createSession: () =>
    request<SessionDTO>("/api/sessions", { method: "POST" }),

  getSession: (id: string) => request<SessionDTO>(`/api/sessions/${id}`),

  deleteSession: (id: string) =>
    request<{ ok: true }>(`/api/sessions/${id}`, { method: "DELETE" }),

  // ----- agents -----
  listAgents: () => request<AgentDTO[]>("/api/agents"),

  createAgent: (body: CreateAgentBody) =>
    request<AgentDTO>("/api/agents", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateAgent: (id: string, body: UpdateAgentBody) =>
    request<AgentDTO>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteAgent: (id: string) =>
    request<{ ok: true }>(`/api/agents/${id}`, { method: "DELETE" }),
};
