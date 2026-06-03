import { loginSchema } from "@/lib/schemas/auth";
import { loginUser } from "@/lib/auth/service";
import { startSession } from "@/lib/auth/session";
import { errMessage, fail, ok, unauthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = await loginUser(parsed.data);
    if (!user) return unauthorized("Invalid email or password.");
    await startSession({ sub: user.id, email: user.email });
    return ok(user);
  } catch (e) {
    return fail(errMessage(e), 400);
  }
}
