import { runMainAgent } from "@/lib/ai/main-agent";
import { getCurrentUserId } from "@/lib/auth/session";
import { errMessage, fail, unauthorized } from "@/lib/http";
import type { ChatStreamEvent } from "@/lib/types/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Research turns (web search + sub-agents) can run long. 60s is the Vercel
// Hobby (free) function ceiling; raise this to 300 on Vercel Pro or hosts
// without a hard timeout.
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Chat endpoint. Streams the assistant turn as Server-Sent Events — one JSON
 * `ChatStreamEvent` per `data:` frame. (POST, so the client reads the body as a
 * stream rather than via EventSource.) Requires auth; the run is scoped to the
 * authenticated user (the session must be theirs).
 */
export async function POST(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  let message = "";
  try {
    const body = (await req.json()) as { message?: unknown };
    if (typeof body.message === "string") message = body.message.trim();
  } catch {
    return fail("Invalid JSON body.", 400);
  }
  if (!message) return fail("message is required.", 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (event: ChatStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true; // client went away
        }
      };

      try {
        await runMainAgent({
          sessionId: id,
          userId,
          userText: message,
          emit,
          signal: req.signal,
        });
      } catch (e) {
        emit({ type: "error", message: errMessage(e) });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
