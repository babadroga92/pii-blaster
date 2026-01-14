"use client";

import { useState } from "react";

type Row = { username: string; score: number; created_at: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setRows([]);

    const res = await fetch("/api/admin/scores?game=pii_blaster&limit=500", {
      headers: { "x-admin-token": token },
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    const data = await res.json();
    setRows(data.rows ?? []);
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Admin — Leaderboard</h1>

      <div className="rounded-xl border p-4 flex flex-col gap-3">
        <label className="font-medium">Admin token</label>
        <div className="flex gap-2">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="Paste ADMIN_TOKEN here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="rounded-lg bg-black text-white px-4 py-2" onClick={load}>
            Load
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-neutral-600">
          Tip: don’t share this token. Anyone with it can view the full score list.
        </p>
      </div>

      <div className="rounded-xl border p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">When</th>
              <th>Username</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-2 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="whitespace-nowrap">{r.username}</td>
                <td className="whitespace-nowrap">{r.score}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-neutral-600" colSpan={3}>
                  No rows loaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

