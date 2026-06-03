import { signupSchema } from "@/lib/schemas/auth";
import { signupUser } from "@/lib/auth/service";
import { startSession } from "@/lib/auth/session";
import { errMessage, fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = signupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = await signupUser(parsed.data);
    await startSession({ sub: user.id, email: user.email });
    return ok(user, 201);
  } catch (e) {
    return fail(errMessage(e), 400);
  }
}
