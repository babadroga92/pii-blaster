"use client";

import { useState } from "react";

type Row = { username: string; score: number; created_at: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setError("");
    setStatus("");
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
    setStatus(`Loaded ${data.rows?.length ?? 0} rows`);
  }

  async function resetAllScores() {
    const ok = confirm(
      "⚠️ Reset ALL scores?\n\nThis will delete ALL leaderboard entries and cannot be undone."
    );
    if (!ok) return;

    setError("");
    setStatus("Resetting ALL scores…");

    const res = await fetch("/api/admin/reset-scores", {
      method: "POST",
      headers: { "x-admin-token": token },
    });

    if (!res.ok) {
      setError(await res.text());
      setStatus("");
      return;
    }

    setStatus("ALL scores reset ✅");
    await load();
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Admin — Leaderboard</h1>

      <div className="rounded-xl border p-4 flex flex-col gap-3">
        <label className="font-medium">Admin token</label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="border rounded-lg px-3 py-2 flex-1 font-mono"
            placeholder="Paste ADMIN_TOKEN here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <button
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-40"
            onClick={load}
            disabled={!token}
          >
            Load
          </button>

          <button
            className="rounded-lg border border-red-600 text-red-700 px-4 py-2 disabled:opacity-40"
            onClick={resetAllScores}
            disabled={!token}
            title="Deletes all leaderboard rows"
          >
            Reset all scores
          </button>
        </div>

        {status && <p className="text-sm text-neutral-700">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-white">
          Tip: don’t share this token. Anyone with it can view or reset the leaderboard.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4 overflow-auto">
  <table className="w-full text-sm text-white">
    <thead className="bg-neutral-950">
      <tr className="text-left border-b border-neutral-700">
        <th className="py-2 font-black">When</th>
        <th className="font-black">Username</th>
        <th className="font-black">Score</th>
      </tr>
    </thead>

    <tbody>
      {rows.map((r, i) => (
        <tr
          key={i}
          className="border-b border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
        >
          <td className="py-2 whitespace-nowrap text-neutral-300">
            {new Date(r.created_at).toLocaleString()}
          </td>
          <td className="whitespace-nowrap font-semibold text-white">
            {r.username}
          </td>
          <td className="whitespace-nowrap font-black text-white">
            {r.score}
          </td>
        </tr>
      ))}

      {rows.length === 0 && (
        <tr className="bg-neutral-900">
          <td className="py-6 text-neutral-400" colSpan={3}>
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
