import { createAgent, listAgents } from "@/lib/db/services/agent.service";
import { errMessage, fail, ok } from "@/lib/http";
import { createAgentSchema } from "@/lib/schemas/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listAgents());
  } catch (e) {
    return fail(errMessage(e));
  }
}

export async function POST(req: Request) {
  try {
    const parsed = createAgentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    return ok(await createAgent(parsed.data), 201);
  } catch (e) {
    // Creation failures are almost always invalid input.
    return fail(errMessage(e), 400);
  }
}
