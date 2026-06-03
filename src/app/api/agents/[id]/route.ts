import { deleteAgent, updateAgent } from "@/lib/db/services/agent.service";
import { errMessage, fail, ok } from "@/lib/http";
import type { UpdateAgentBody } from "@/lib/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateAgentBody;
    const updated = await updateAgent(id, body);
    return updated ? ok(updated) : fail("Agent not found.", 404);
  } catch (e) {
    return fail(errMessage(e), 400);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await deleteAgent(id);
    return deleted ? ok({ ok: true }) : fail("Agent not found.", 404);
  } catch (e) {
    return fail(errMessage(e));
  }
}
