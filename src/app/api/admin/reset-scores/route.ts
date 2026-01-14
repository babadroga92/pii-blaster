import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let game: string | null = null;

  // allow either JSON body { game: "pii_blaster" } or query ?game=pii_blaster
  try {
    const url = new URL(req.url);
    game = url.searchParams.get("game");

    if (!game) {
      const body = await req.json().catch(() => null);
      if (body && typeof body.game === "string") game = body.game;
    }
  } catch {
    // ignore parse errors
  }

  // If game is provided, only delete that game. Otherwise wipe all scores.
  if (game) {
    if (game !== "pii_blaster") {
      return new Response("Invalid game", { status: 400 });
    }

    await sql`
      DELETE FROM scores
      WHERE game = ${game};
    `;

    return Response.json({ ok: true, scope: "game", game });
  }

  // wipe everything (future-proof for more games)
  // RESTART IDENTITY resets serial IDs (if your table has them)
  await sql`TRUNCATE TABLE scores RESTART IDENTITY;`;

  return Response.json({ ok: true, scope: "all" });
}

