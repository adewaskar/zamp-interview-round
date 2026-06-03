import { createAgent, listAgents } from "@/lib/db/services/agent.service";
import { getCurrentUserId } from "@/lib/auth/session";
import { createAgentSchema } from "@/lib/schemas/agent";
import { errMessage, fail, ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    return ok(await listAgents(userId));
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    const parsed = createAgentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    return ok(await createAgent(userId, parsed.data), 201);
  } catch (e) {
    // Creation failures are almost always invalid input.
    return fail(errMessage(e), 400);
  }
}
