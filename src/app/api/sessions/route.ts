import { createSession, listSessions } from "@/lib/db/services/chat-session.service";
import { getCurrentUserId } from "@/lib/auth/session";
import { errMessage, fail, ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    return ok(await listSessions(userId));
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    return ok(await createSession(userId), 201);
  } catch (e) {
    return fail(errMessage(e));
  }
}
