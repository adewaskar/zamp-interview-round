import { endSession } from "@/lib/auth/session";
import { ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return ok({ ok: true });
}
