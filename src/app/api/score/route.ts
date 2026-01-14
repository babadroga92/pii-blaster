import { sql } from "@vercel/postgres";

const MAX_USERNAME_LEN = 20;

function sanitizeUsername(raw: unknown) {
  const u = String(raw ?? "").trim();
  if (u.length < 3 || u.length > MAX_USERNAME_LEN) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) return null;
  return u;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("Bad JSON", { status: 400 });

  const username = sanitizeUsername(body.username);
  const game = String(body.game ?? "");
  const score = Number(body.score);

  if (!username) return new Response("Invalid username", { status: 400 });
  if (game !== "pii_blaster") return new Response("Invalid game", { status: 400 });

  // basic anti-abuse bounds
  if (!Number.isFinite(score) || score < -500 || score > 5000) {
    return new Response("Invalid score", { status: 400 });
  }

  await sql`
    INSERT INTO scores (username, game, score)
    VALUES (${username}, ${game}, ${Math.trunc(score)});
  `;

  return Response.json({ ok: true });
}

