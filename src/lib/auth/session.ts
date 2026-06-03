import { cookies } from "next/headers";
import { signAuthToken, verifyAuthToken, type AuthClaims } from "./jwt";

export const AUTH_COOKIE = "scout_token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Issue a JWT and store it in an httpOnly cookie. */
export async function startSession(claims: AuthClaims): Promise<void> {
  const token = await signAuthToken(claims);
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/** The authenticated user's id, or null if the cookie is missing/invalid. */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifyAuthToken(token);
  return claims?.sub ?? null;
}

/** Like {@link getCurrentUserId} but throws {@link UnauthorizedError}. */
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError();
  return id;
}
