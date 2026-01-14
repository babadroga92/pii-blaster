"use client";

import PiiBlasterCanvas from "./components/PiiBlasterCanvas";


import { useEffect, useMemo, useState } from "react";

type Screen = "intro" | "username" | "play";

const USERNAME_KEY = "privacyweek_username";

export default function PiiBlasterPage() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) setUsername(saved);
  }, []);

  const usernameValid = useMemo(
    () => /^[a-zA-Z0-9._-]{3,20}$/.test(username),
    [username]
  );

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold">PII Blaster</h1>
      <p className="text-sm text-neutral-600 -mt-4">Privacy Week 2026</p>

      {screen === "intro" && (
  <section className="rounded-2xl border p-6 bg-white flex flex-col gap-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-wider text-neutral-500">
          Privacy Week 2026
        </p>
        <h2 className="text-4xl font-black tracking-tight text-black">
  Blast the <span className="underline decoration-4">safe data</span>.
</h2>

        <p className="text-neutral-700 mt-1">
        <b>Shoot only safe data.</b>  
Shooting <b>PII</b> or <b>confidential</b> data costs you points.
        </p>
      </div>

      <div className="hidden sm:flex items-center justify-center rounded-xl border px-3 py-2 text-sm text-neutral-700">
        25s round
      </div>
    </div>

    <div className="grid sm:grid-cols-3 gap-3">
      <div className="rounded-xl border p-3">
      <p className="text-xl font-black tracking-wider text-black">
  ✅ SHOOT
</p>

        <p className="text-sm text-neutral-700 mt-1">
          Public / non-sensitive info
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Examples: Weather, blog, press release
        </p>
      </div>

      <div className="rounded-xl border p-3">
      <p className="text-xl font-black tracking-wider text-black">
  ⚠️ AVOID
</p>


        <p className="text-sm text-neutral-700 mt-1">
          PII (personal info)
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Examples: Email, phone, address
        </p>
      </div>

      <div className="rounded-xl border p-3">
      <p className="text-xl font-black tracking-wider text-black">
  🔒 AVOID
</p>

        <p className="text-sm text-neutral-700 mt-1">
          Confidential data
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Examples: Payroll, contracts, incidents
        </p>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
      <p className="text-xs text-neutral-500">
        Tip: Use a nickname. Don’t enter real personal data.
      </p>

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
        <section className="flex flex-col gap-3">
          <label className="font-medium">Choose a username (3–20 chars)</label>
          <input
            className="border rounded-lg px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="e.g. nemus_01"
          />

          {!usernameValid && (
            <p className="text-sm text-red-600">
              Allowed: letters/numbers/dot/underscore/dash (3–20 chars)
            </p>
          )}

          <div className="flex gap-3">
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

            <button
              className="rounded-lg border px-4 py-2"
              onClick={() => setScreen("intro")}
            >
              Back
            </button>
          </div>
        </section>
      )}

{screen === "play" && (
  <section className="flex flex-col gap-3">
    <PiiBlasterCanvas
      onFinish={(r) => {
        alert(`Round over! Score: ${r.score}\nSafe: ${r.safeHits}, PII: ${r.piiHits}, Conf: ${r.confHits}`);
        setScreen("intro");
      }}
    />
    <button className="rounded-lg border px-4 py-2 w-fit" onClick={() => setScreen("intro")}>
      Quit
    </button>
  </section>
)}
    </main>
  );
}

