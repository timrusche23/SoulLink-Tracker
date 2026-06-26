import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { query } from "@/lib/db";

interface ChallengeSummaryRow { id: string; name: string; gameId: string; generationId: string; participantCount: number; updatedAt: Date }

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const result = await query<ChallengeSummaryRow>(
    `SELECT "id", "name", "gameId", "generationId", "participantCount", "updatedAt" FROM "Challenge" WHERE "ownerId"=$1 ORDER BY "updatedAt" DESC`,
    [user.id]
  );
  return NextResponse.json({ challenges: result.rows });
}
