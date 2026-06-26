import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { Challenge } from "@/types";

interface ChallengeRow { data: Challenge }
interface OwnerRow { ownerId: string }

function validChallenge(value: unknown): value is Challenge {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Challenge>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.gameId === "string" && typeof item.generationId === "string" && Array.isArray(item.participants) && Array.isArray(item.encounters);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const result = await query<ChallengeRow>(`SELECT "data" FROM "Challenge" WHERE "id"=$1 AND "ownerId"=$2 LIMIT 1`, [params.id, user.id]);
  if (!result.rows[0]) return NextResponse.json({ error: "Challenge nicht gefunden." }, { status: 404 });
  return NextResponse.json({ challenge: result.rows[0].data });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const data = await request.json();
  if (!validChallenge(data) || data.id !== params.id || data.participants.length < 1 || data.participants.length > 5) return NextResponse.json({ error: "Ungültige Challenge-Daten." }, { status: 400 });
  const owner = await query<OwnerRow>(`SELECT "ownerId" FROM "Challenge" WHERE "id"=$1 LIMIT 1`, [params.id]);
  if (owner.rows[0] && owner.rows[0].ownerId !== user.id) return NextResponse.json({ error: "Kein Zugriff auf diese Challenge." }, { status: 403 });
  await query(
    `INSERT INTO "Challenge" ("id","ownerId","name","gameId","generationId","participantCount","data","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW(),NOW())
     ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name", "gameId"=EXCLUDED."gameId", "generationId"=EXCLUDED."generationId", "participantCount"=EXCLUDED."participantCount", "data"=EXCLUDED."data", "updatedAt"=NOW()`,
    [data.id, user.id, data.name, data.gameId, data.generationId, data.participants.length, JSON.stringify(data)]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const result = await query(`DELETE FROM "Challenge" WHERE "id"=$1 AND "ownerId"=$2`, [params.id, user.id]);
  if (result.rowCount === 0) return NextResponse.json({ error: "Challenge nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
