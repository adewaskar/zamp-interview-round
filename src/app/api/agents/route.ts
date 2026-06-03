import { createAgent, listAgents } from "@/lib/db/services/agent.service";
import { errMessage, fail, ok } from "@/lib/http";
import type { CreateAgentBody } from "@/lib/types/api";

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
    const body = (await req.json()) as CreateAgentBody;
    return ok(await createAgent(body), 201);
  } catch (e) {
    // Creation failures are almost always invalid input.
    return fail(errMessage(e), 400);
  }
}
