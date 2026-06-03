import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const ISSUER = "scout";
const AUDIENCE = "scout";
const EXPIRES_IN = "7d";

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env.");
  }
  return new TextEncoder().encode(secret);
}

export interface AuthClaims {
  /** User id. */
  sub: string;
  email: string;
}

/** Sign a stateless session token (HS256, 7-day expiry). */
export async function signAuthToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRES_IN)
    .sign(secretKey());
}

/** Verify a token; returns the claims or null if invalid/expired. */
export async function verifyAuthToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub === "string" && typeof payload.email === "string") {
      return { sub: payload.sub, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}
