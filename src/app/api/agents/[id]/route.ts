import { deleteAgent, updateAgent } from "@/lib/db/services/agent.service";
import { getCurrentUserId } from "@/lib/auth/session";
import { updateAgentSchema } from "@/lib/schemas/agent";
import { errMessage, fail, ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    const { id } = await params;
    const parsed = updateAgentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const updated = await updateAgent(id, userId, parsed.data);
    return updated ? ok(updated) : fail("Agent not found.", 404);
  } catch (e) {
    return fail(errMessage(e), 400);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  try {
    const { id } = await params;
    const deleted = await deleteAgent(id, userId);
    return deleted ? ok({ ok: true }) : fail("Agent not found.", 404);
  } catch (e) {
    return fail(errMessage(e));
  }
}
