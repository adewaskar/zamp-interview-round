import { getCurrentUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/service";
import { ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const id = await getCurrentUserId();
  if (!id) return unauthorized();
  const user = await getUserById(id);
  return user ? ok(user) : unauthorized();
}
