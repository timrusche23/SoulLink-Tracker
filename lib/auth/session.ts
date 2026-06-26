import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "soullink_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET muss mindestens 32 Zeichen lang sein.");
  return new TextEncoder().encode(value);
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ username: user.username, displayName: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_AGE_SECONDS}s`)
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    maxAge: SESSION_AGE_SECONDS,
    path: "/"
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.AUTH_COOKIE_SECURE === "true", maxAge: 0, path: "/" });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.username !== "string" || typeof payload.displayName !== "string") return null;
    return { id: payload.sub, username: payload.username, displayName: payload.displayName };
  } catch {
    return null;
  }
}
