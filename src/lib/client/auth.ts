/**
 * Typed client for the Scout auth API.
 *
 * Thin `fetch` wrappers mirroring `api.ts`. Authentication is carried by an
 * httpOnly cookie set by the server, so we never read or store a token here —
 * `credentials: "same-origin"` simply lets the browser send/receive the cookie
 * on these same-origin requests. Each wrapper throws an `Error` carrying the
 * server's `{ error }` message on any non-2xx response.
 */
import type { UserDTO } from "@/lib/types/api";
import type { LoginBody, SignupBody } from "@/lib/schemas/auth";

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
    credentials: "same-origin",
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

export const auth = {
  signup: (body: SignupBody) =>
    request<UserDTO>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: LoginBody) =>
    request<UserDTO>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: async (): Promise<void> => {
    await request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  me: () => request<UserDTO>("/api/auth/me"),
};
