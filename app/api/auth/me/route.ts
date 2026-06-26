import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { query } from "@/lib/db";

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  preferredDarkMode: boolean;
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ user: null });

  const result = await query<UserRow>(
    `SELECT "id", "username", "displayName", COALESCE("preferredDarkMode", TRUE) AS "preferredDarkMode" FROM "User" WHERE "id"=$1 LIMIT 1`,
    [sessionUser.id]
  );

  const user = result.rows[0]
    ? {
        id: result.rows[0].id,
        username: result.rows[0].username,
        displayName: result.rows[0].displayName,
        preferredDarkMode: result.rows[0].preferredDarkMode
      }
    : null;

  return NextResponse.json({ user });
}
