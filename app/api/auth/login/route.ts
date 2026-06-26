import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

interface UserRow { id: string; username: string; displayName: string; passwordHash: string; preferredDarkMode: boolean }

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    const username = body.username?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const result = await query<UserRow>(`SELECT "id", "username", "displayName", "passwordHash", COALESCE("preferredDarkMode", TRUE) AS "preferredDarkMode" FROM "User" WHERE LOWER("username")=$1 LIMIT 1`, [username]);
    const user = result.rows[0];
    if (!user || !(await compare(password, user.passwordHash))) return NextResponse.json({ error: "Benutzername oder Passwort ist falsch." }, { status: 401 });
    const sessionUser = { id: user.id, username: user.username, displayName: user.displayName };
    await createSession(sessionUser);
    return NextResponse.json({ user: { ...sessionUser, preferredDarkMode: user.preferredDarkMode } });
  } catch {
    return NextResponse.json({ error: "Die Anmeldung ist fehlgeschlagen." }, { status: 500 });
  }
}
