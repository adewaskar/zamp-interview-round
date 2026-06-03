import { createSession, listSessions } from "@/lib/db/services/chat-session.service";
import { errMessage, fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listSessions());
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function POST() {
  try {
    return ok(await createSession(), 201);
  } catch (e) {
    return fail(errMessage(e));
  }
}
