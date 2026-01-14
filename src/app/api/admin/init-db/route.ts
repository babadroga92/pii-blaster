import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      game TEXT NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS scores_game_score_idx
    ON scores (game, score DESC);
  `;

  return Response.json({ ok: true });
}

