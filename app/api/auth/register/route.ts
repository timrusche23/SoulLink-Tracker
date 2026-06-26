import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Die öffentliche Registrierung ist deaktiviert. Accounts werden nur vom Administrator angelegt." },
    { status: 403 }
  );
}
