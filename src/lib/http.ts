/** Tiny helpers for consistent JSON API responses. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function fail(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}

export function unauthorized(message = "Authentication required."): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Unexpected error.";
}
