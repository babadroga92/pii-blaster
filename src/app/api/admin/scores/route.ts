import { sql } from "@vercel/postgres";

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") ?? "pii_blaster";
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 1000);

  if (game !== "pii_blaster") {
    return new Response("Invalid game", { status: 400 });
  }

  const { rows } = await sql`
    SELECT username, score, created_at
    FROM scores
    WHERE game = ${game}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;

  return Response.json({ rows });
}

