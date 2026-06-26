import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { query } from "@/lib/db";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  try {
    const body = (await request.json()) as { preferredDarkMode?: boolean };
    if (typeof body.preferredDarkMode !== "boolean") {
      return NextResponse.json({ error: "Ungültige Einstellung." }, { status: 400 });
    }

    await query(
      `UPDATE "User" SET "preferredDarkMode"=$1, "updatedAt"=NOW() WHERE "id"=$2`,
      [body.preferredDarkMode, user.id]
    );

    return NextResponse.json({ ok: true, preferredDarkMode: body.preferredDarkMode });
  } catch {
    return NextResponse.json({ error: "Die Einstellung konnte nicht gespeichert werden." }, { status: 500 });
  }
}
