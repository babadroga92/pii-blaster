import { sql } from "@vercel/postgres";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const game = searchParams.get("game") ?? "pii_blaster";
  const limitRaw = Number(searchParams.get("limit") ?? 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50);

  if (game !== "pii_blaster") {
    return new Response("Invalid game", { status: 400 });
  }

  const { rows } = await sql`
    SELECT username, score, created_at
    FROM scores
    WHERE game = ${game}
    ORDER BY score DESC, created_at ASC
    LIMIT ${limit};
  `;

  return Response.json({ rows });
}

