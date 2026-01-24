"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PiiBlasterCanvas, { GameResult } from "./components/PiiBlasterCanvas";

type Screen = "intro" | "username" | "play" | "results";
type LbRow = { username: string; score: number; created_at: string };

export default function PiiBlasterPage() {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const [screen, setScreen] = useState<Screen>("intro");
  const [username, setUsername] = useState("");

  // countdown state (3..2..1..GO)
  const [countdown, setCountdown] = useState<number>(3);
  const [countdownActive, setCountdownActive] = useState(false);

  // results state
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LbRow[]>([]);
  const [savingMsg, setSavingMsg] = useState<string>("");

  // ✅ prevents duplicate submissions per round
  const finishLockRef = useRef(false);

  const u = username.trim();
  const usernameValid = useMemo(() => /^[a-zA-Z0-9._-]{3,20}$/.test(u), [u]);

  // Start 3-2-1 countdown whenever we enter the play screen
  useEffect(() => {
    if (screen !== "play") return;

    finishLockRef.current = false; // ✅ reset each round

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
      body: JSON.stringify({ username: u, game: "pii_blaster", score }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#070915",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 400px at 20% 10%, rgba(96,165,250,0.18), transparent 60%), radial-gradient(500px 380px at 80% 20%, rgba(34,197,94,0.14), transparent 55%)",
          animation: "floatBg 20s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes floatBg {
          from { transform: translateY(0px); }
          to { transform: translateY(-40px); }
        }
      `}</style>

      {/* Content */}
      <div
        style={{
          position: "relative",
          width: 880,
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Privacy Week 2026
          </div>

          <h1
            style={{
              margin: "12px 0 6px",
              fontSize: 46,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            PII Blaster
          </h1>

          <p
            style={{
              maxWidth: 720,
              fontSize: 16,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            <span style={{ fontWeight: 900 }}>Shoot only safe data.</span> Shooting{" "}
            <span style={{ fontWeight: 900 }}>PII</span> or{" "}
            <span style={{ fontWeight: 900 }}>confidential data</span> costs you points.
          </p>
        </header>

        {/* Main card */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 16,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(9,12,28,0.88)",
            padding: 22,
            boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
          }}
        >
          {/* Left column */}
          <div>
            {screen === "intro" && (
              <>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  How it works
                </h2>

                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 900 }}>✅ SHOOT</div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.78)",
                        lineHeight: 1.5,
                      }}
                    >
                      Public / non-sensitive info
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Examples: Weather, blog, press
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 900 }}>⚠️ AVOID</div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.78)",
                        lineHeight: 1.5,
                      }}
                    >
                      PII (personal info)
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Examples: Email, phone, address
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 900 }}>🔒 AVOID</div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.78)",
                        lineHeight: 1.5,
                      }}
                    >
                      Confidential data
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Examples: Payroll, contracts
                    </div>
                  </div>
                </div>

                {/* Disclaimer (added) */}
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(251,113,133,0.25)",
                    background: "rgba(251,113,133,0.08)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <b style={{ color: "rgba(251,113,133,0.95)" }}>Important:</b>{" "}
                  Please don’t use your real name or any real credentials. Use a fun alias — this
                  game stores data only for gameplay and demonstration purposes.
                </div>

                {/* Data collected (added) */}
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>
                    Data Collected During Gameplay
                  </div>

                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>
                      <b>Username:</b> The display name you choose for this game session.
                    </li>
                    <li>
                      <b>Score:</b> Your accumulated points based on progress and performance.
                    </li>
                    <li>
                      <b>Round Duration:</b> The game round length (for this mode, 60 seconds).
                    </li>
                    <li>
                      <b>Completion Timestamp:</b> The date and time when the session ends.
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  60s round
                </div>
              </>
            )}

            {screen === "play" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ fontWeight: 900 }}>SHOOT</span> safe ·{" "}
                    <span style={{ fontWeight: 900 }}>AVOID</span> PII & confidential
                  </div>
                  <button
                    onClick={() => setScreen("intro")}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    Exit
                  </button>
                </div>

                <div style={{ position: "relative", minHeight: 560 }}>
                  {/* Always mounted to avoid layout shift */}
                  <div
                    style={{
                      pointerEvents: countdownActive ? "none" : "auto",
                      opacity: countdownActive ? 0 : 1,
                      transition: "opacity 150ms ease",
                    }}
                  >
                    <PiiBlasterCanvas
                      onFinish={async (r) => {
                        if (finishLockRef.current) return;
                        finishLockRef.current = true;

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

                        const audio = bgMusicRef.current;
                        if (audio) {
                          audio.pause();
                          audio.currentTime = 0;
                        }

                        setScreen("results");
                      }}
                    />
                  </div>

                  {countdownActive && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.78)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 72, fontWeight: 900, color: "white" }}>
                        {countdown === 0 ? "GO!" : countdown}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
                        Get ready…
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {screen === "results" && lastResult && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
                      Round complete
                    </h2>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {savingMsg}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      textAlign: "right",
                      minWidth: 120,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Your score
                    </div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "white" }}>
                      {lastResult.score}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Safe hits
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>{lastResult.safeHits}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      PII hits
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>{lastResult.piiHits}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Conf hits
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>{lastResult.confHits}</div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>Privacy takeaway</div>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    If it identifies a person (PII) or exposes internal business details
                    (confidential), treat it as sensitive and handle it carefully.
                  </p>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    overflowX: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>Top 5 leaderboard</div>
                  </div>

                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                        <th style={{ padding: "10px 0", fontWeight: 900 }}>Rank</th>
                        <th style={{ fontWeight: 900 }}>Username</th>
                        <th style={{ fontWeight: 900 }}>Score</th>
                        <th style={{ fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((r, i) => (
                        <tr
                          key={`${r.username}-${r.created_at}-${i}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <td style={{ padding: "10px 0", fontWeight: 800 }}>{i + 1}</td>
                          <td style={{ fontWeight: 800 }}>{r.username}</td>
                          <td style={{ fontWeight: 900 }}>{r.score}</td>
                          <td style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                            {new Date(r.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}

                      {leaderboard.length === 0 && (
                        <tr>
                          <td style={{ padding: "12px 0", color: "rgba(255,255,255,0.7)" }} colSpan={4}>
                            No scores yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Right column (CTA / username) */}
          <div>
            <audio ref={bgMusicRef} src="/audio/bg-music.mp3" loop preload="auto" />

            {screen === "intro" && (
              <>
                <label
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Ready to start?
                </label>

                <button
                  onClick={() => setScreen("username")}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "#60a5fa",
                    color: "#071225",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 12px 30px rgba(96,165,250,0.35)",
                  }}
                >
                  Start game →
                </button>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.5,
                  }}
                >
                  Tip: use a nickname. Don’t enter real personal data.
                </div>
              </>
            )}

            {screen === "username" && (
              <>
                <label
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Choose a username (3–20 chars)
                </label>

                <div
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(251,113,133,0.25)",
                    background: "rgba(251,113,133,0.08)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  ⚠️ Do not use your personal name
                </div>

                <input
                  value={u}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    usernameValid &&
                    (() => {
                      const audio = bgMusicRef.current;
                      if (audio) {
                        audio.volume = 0.15;
                        audio.currentTime = 0;
                        audio.play();
                      }
                      setScreen("play");
                    })()
                  }
                  placeholder="e.g. code_ninja"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: 14,
                    border: `1px solid ${
                      !u
                        ? "rgba(255,255,255,0.18)"
                        : usernameValid
                        ? "rgba(34,197,94,0.6)"
                        : "rgba(251,113,133,0.7)"
                    }`,
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    outline: "none",
                    fontSize: 16,
                  }}
                />

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: !u
                      ? "rgba(255,255,255,0.55)"
                      : usernameValid
                      ? "rgba(34,197,94,0.9)"
                      : "rgba(251,113,133,0.95)",
                  }}
                >
                  {!u
                    ? "Use a nickname (not your real name)."
                    : usernameValid
                    ? "Looks good."
                    : "Allowed: letters/numbers/dot/underscore/dash (3–20 chars)"}
                </div>

                <button
                  disabled={!usernameValid}
                  onClick={() => {
                    const audio = bgMusicRef.current;
                    if (audio) {
                      audio.volume = 0.15;
                      audio.currentTime = 0;
                      audio.play();
                    }
                    setScreen("play");
                  }}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: usernameValid ? "#60a5fa" : "rgba(255,255,255,0.12)",
                    color: usernameValid ? "#071225" : "rgba(255,255,255,0.5)",
                    fontWeight: 900,
                    cursor: usernameValid ? "pointer" : "not-allowed",
                    boxShadow: usernameValid
                      ? "0 12px 30px rgba(96,165,250,0.35)"
                      : "none",
                  }}
                >
                  Continue
                </button>

                <button
                  onClick={() => setScreen("intro")}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
              </>
            )}

            {screen === "play" && (
              <>
                <label
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  In round
                </label>

                <button
                  onClick={() => setScreen("intro")}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Exit to home
                </button>
              </>
            )}

            {screen === "results" && lastResult && (
              <>
                <label
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Next
                </label>

                <button
                  onClick={() => setScreen("play")}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "#60a5fa",
                    color: "#071225",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 12px 30px rgba(96,165,250,0.35)",
                  }}
                >
                  Play again
                </button>

                <button
                  onClick={() => setScreen("intro")}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Back to home
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
