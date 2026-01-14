"use client";

import { useEffect, useMemo, useState } from "react";
import PiiBlasterCanvas, { GameResult } from "./components/PiiBlasterCanvas";

type Screen = "intro" | "username" | "play" | "results";

const USERNAME_KEY = "privacyweek_username";

type LbRow = { username: string; score: number; created_at: string };

export default function PiiBlasterPage() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [username, setUsername] = useState("");

  // countdown state (3..2..1..GO)
  const [countdown, setCountdown] = useState<number>(3);
  const [countdownActive, setCountdownActive] = useState(false);

  // results state
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LbRow[]>([]);
  const [savingMsg, setSavingMsg] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) setUsername(saved);
  }, []);

  const usernameValid = useMemo(() => /^[a-zA-Z0-9._-]{3,20}$/.test(username), [username]);

  // Start 3-2-1 countdown whenever we enter the play screen
  useEffect(() => {
    if (screen !== "play") return;

    setCountdown(3);
    setCountdownActive(true);

    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          setCountdownActive(false);
          return 0;
        }
        return c - 1;
      });
    }, 900);

    return () => clearInterval(t);
  }, [screen]);

  async function fetchLeaderboardTop5() {
    const res = await fetch("/api/leaderboard?game=pii_blaster&limit=5");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.rows ?? []) as LbRow[];
  }

  async function submitScore(score: number) {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, game: "pii_blaster", score }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-neutral-500">Privacy Week 2026</p>
          <h1 className="text-3xl font-bold">PII Blaster</h1>
        </div>
      </header>

      {screen === "intro" && (
        <section className="rounded-2xl border p-6 bg-white text-black flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-black">
                Blast the <span className="underline decoration-4">safe data</span>.
              </h2>

              <p className="mt-3 text-lg text-black">
                <span className="font-black">Shoot only safe data.</span>{" "}
                Shooting <span className="font-black">PII</span> or{" "}
                <span className="font-black">confidential data</span> costs you points.
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center rounded-xl border px-3 py-2 text-sm text-black">
              25s round
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-xl font-black tracking-wider text-black">✅ SHOOT</p>
              <p className="text-sm text-neutral-700 mt-1">Public / non-sensitive info</p>
              <p className="text-xs text-neutral-500 mt-2">Examples: Weather, blog, press</p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xl font-black tracking-wider text-black">⚠️ AVOID</p>
              <p className="text-sm text-neutral-700 mt-1">PII (personal info)</p>
              <p className="text-xs text-neutral-500 mt-2">Examples: Email, phone, address</p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xl font-black tracking-wider text-black">🔒 AVOID</p>
              <p className="text-sm text-neutral-700 mt-1">Confidential data</p>
              <p className="text-xs text-neutral-500 mt-2">Examples: Payroll, contracts</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
            <p className="text-xs text-neutral-500">Tip: use a nickname. Don’t enter real personal data.</p>

            <button
              className="rounded-lg bg-black text-white px-5 py-2 w-fit"
              onClick={() => setScreen("username")}
            >
              Start game →
            </button>
          </div>
        </section>
      )}

      {screen === "username" && (
        <section className="rounded-2xl border p-6 bg-white flex flex-col gap-3">
          <label className="font-semibold text-black">Choose a username (3–20 chars)</label>
          <input
            className="border rounded-lg px-3 py-2 text-black font-semibold text-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="e.g. code_ninja"
          />

          {!usernameValid && (
            <p className="text-sm text-red-600">
              Allowed: letters/numbers/dot/underscore/dash (3–20 chars)
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-40"
              disabled={!usernameValid}
              onClick={() => {
                localStorage.setItem(USERNAME_KEY, username);
                setScreen("play");
              }}
            >
              Continue
            </button>

            <button className="rounded-lg border px-4 py-2" onClick={() => setScreen("intro")}>
              Back
            </button>
          </div>
        </section>
      )}

      {screen === "play" && (
        <section className="grid lg:grid-cols-[1fr_180px] gap-4 items-start">
          <div className="flex flex-col gap-3">
            <div className="relative min-h-[560px]">
              {/* Always mounted to avoid layout shift */}
              <div className={countdownActive ? "pointer-events-none opacity-0" : ""}>
                <PiiBlasterCanvas
                  onFinish={async (r) => {
                    setLastResult(r);
                    setSavingMsg("Saving score…");
                    try {
                      await submitScore(r.score);
                      setSavingMsg("Score saved ✅");
                    } catch (e: any) {
                      setSavingMsg(`Score NOT saved: ${String(e?.message ?? e)}`);
                    }

                    const top5 = await fetchLeaderboardTop5();
                    setLeaderboard(top5);

                    setScreen("results");
                  }}
                />
              </div>

              {/* Countdown overlay covers the canvas, but canvas still reserves space */}
              {countdownActive && (
                <div className="absolute inset-0 rounded-xl border bg-black/90 flex flex-col items-center justify-center gap-3">
                  <div className="text-white text-7xl font-black">
                    {countdown === 0 ? "GO!" : countdown}
                  </div>
                  <div className="text-white/80 text-sm">Get ready…</div>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <aside className="rounded-2xl border bg-white p-4 flex flex-col gap-3 sticky top-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">Controls</p>
              <p className="text-sm text-black mt-1">
                <span className="font-bold">← →</span> or <span className="font-bold">A D</span> move
                <br />
                <span className="font-bold">Space</span> (or <span className="font-bold">Enter</span>) shoot
              </p>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Rules</p>
              <p className="text-sm text-black mt-1">
                <span className="font-black">SHOOT</span> safe items
                <br />
                <span className="font-black">AVOID</span> PII & confidential
              </p>
            </div>

            <div className="border-t pt-3 flex gap-2">
              <button
                className="rounded-lg border px-3 py-2 text-sm w-full"
                onClick={() => setScreen("intro")}
              >
                Exit
              </button>
            </div>

            <p className="text-xs text-neutral-500">(Timer + score are shown in the game HUD.)</p>
          </aside>
        </section>
      )}

      {screen === "results" && lastResult && (
        <section className="rounded-2xl border p-6 bg-white flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-black">Round complete</h2>
              <p className="text-sm text-neutral-600 mt-1">{savingMsg}</p>
            </div>

            <div className="rounded-xl border px-4 py-3">
              <div className="text-xs text-neutral-600">Your score</div>
              <div className="text-3xl font-black text-black">{lastResult.score}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-600">Safe hits</div>
              <div className="text-2xl font-black text-black">{lastResult.safeHits}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-600">PII hits</div>
              <div className="text-2xl font-black text-black">{lastResult.piiHits}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-neutral-600">Conf hits</div>
              <div className="text-2xl font-black text-black">{lastResult.confHits}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4 bg-neutral-50">
            <p className="font-semibold text-black">Privacy takeaway</p>
            <p className="text-sm text-neutral-700 mt-1">
              If it identifies a person (PII) or exposes internal business details (confidential), treat
              it as sensitive and handle it carefully.
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-black">Top 5 leaderboard</p>
              <button
                className="rounded-lg border px-3 py-2 text-sm"
                onClick={async () => setLeaderboard(await fetchLeaderboardTop5())}
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Rank</th>
                    <th>Username</th>
                    <th>Score</th>
                    <th className="hidden sm:table-cell">When</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r, i) => (
                    <tr key={`${r.username}-${r.created_at}-${i}`} className="border-b hover:bg-neutral-50">
                      <td className="py-2 font-semibold text-black">{i + 1}</td>
                      <td className="font-semibold text-black">{r.username}</td>
                      <td className="font-black text-black">{r.score}</td>
                      <td className="hidden sm:table-cell text-sm text-neutral-500">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {leaderboard.length === 0 && (
                    <tr>
                      <td className="py-4 text-neutral-600" colSpan={4}>
                        No scores yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="rounded-lg bg-black text-white px-4 py-2" onClick={() => setScreen("play")}>
              Play again
            </button>
            <button className="rounded-lg border px-4 py-2" onClick={() => setScreen("intro")}>
              Back to home
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
