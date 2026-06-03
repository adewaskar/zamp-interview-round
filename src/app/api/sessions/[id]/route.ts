import { deleteSession, getSession } from "@/lib/db/services/chat-session.service";
import { errMessage, fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession(id);
    return session ? ok(session) : fail("Session not found.", 404);
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await deleteSession(id);
    return deleted ? ok({ ok: true }) : fail("Session not found.", 404);
  } catch (e) {
    return fail(errMessage(e));
  }
}
