"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  labels: Record<string, string> | null;
  hidden: boolean;
  rating: number;
  wins: number;
  losses: number;
}

interface CardPhoto {
  id: string;
  url: string;
  labels: Record<string, string> | null;
  yellowCards: number;
  redCards: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"players" | "cards">("players");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cardPhotos, setCardPhotos] = useState<CardPhoto[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "excluded">("all");
  const [message, setMessage] = useState("");
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [checkingBroken, setCheckingBroken] = useState(false);

  async function login() {
    document.cookie = `admin_secret=${secret}; path=/`;
    setLoading(true);
    const res = await fetch("/api/admin/photos");
    if (res.ok) {
      setAuthed(true);
      setPhotos(await res.json());
    } else {
      setMessage("Wrong secret.");
    }
    setLoading(false);
  }

  async function loadCards() {
    if (cardsLoaded) return;
    const res = await fetch("/api/admin/cards");
    if (res.ok) {
      setCardPhotos(await res.json());
      setCardsLoaded(true);
    }
  }

  async function toggleHidden(photo: Photo) {
    const res = await fetch("/api/admin/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id, hidden: !photo.hidden }),
    });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, hidden: !p.hidden } : p))
      );
    }
  }

  async function removePhoto(photo: Photo) {
    if (!confirm(`Remove ${photo.labels?.en ?? photo.id} permanently?`)) return;
    const res = await fetch("/api/admin/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setBrokenIds((prev) => { const next = new Set(prev); next.delete(photo.id); return next; });
    }
  }

  async function removeAllExcluded() {
    const targets = filtered.filter((p) => p.hidden);
    if (!targets.length) return;
    if (!confirm(`Permanently remove all ${targets.length} excluded players shown?`)) return;
    await Promise.all(
      targets.map((photo) =>
        fetch("/api/admin/photos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: photo.id }),
        })
      )
    );
    const removedIds = new Set(targets.map((p) => p.id));
    setPhotos((prev) => prev.filter((p) => !removedIds.has(p.id)));
    setBrokenIds((prev) => { const next = new Set(prev); removedIds.forEach((id) => next.delete(id)); return next; });
  }

  async function findBroken() {
    setCheckingBroken(true);
    setBrokenIds(new Set());
    const res = await fetch("/api/admin/photos/broken");
    if (res.ok) {
      const { broken } = await res.json();
      setBrokenIds(new Set(broken));
    }
    setCheckingBroken(false);
  }

  async function removeAllBroken() {
    const targets = photos.filter((p) => !p.hidden && brokenIds.has(p.id));
    if (!targets.length) return;
    if (!confirm(`Permanently remove ${targets.length} active photos with broken URLs?`)) return;
    await Promise.all(
      targets.map((photo) =>
        fetch("/api/admin/photos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: photo.id }),
        })
      )
    );
    const removedIds = new Set(targets.map((p) => p.id));
    setPhotos((prev) => prev.filter((p) => !removedIds.has(p.id)));
    setBrokenIds(new Set());
  }

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      const name = (p.labels?.en ?? "").toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && !p.hidden) ||
        (filter === "excluded" && p.hidden);
      return matchSearch && matchFilter;
    });
  }, [photos, search, filter]);

  const activeCount = photos.filter((p) => !p.hidden).length;
  const excludedCount = photos.filter((p) => p.hidden).length;
  const brokenActiveCount = photos.filter((p) => !p.hidden && brokenIds.has(p.id)).length;

  if (!authed) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 max-w-sm w-full mx-auto">
        <h1 className="text-2xl font-black">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          onClick={login}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {loading ? "Logging in…" : "Login"}
        </button>
        {message && <p className="text-rose-400 text-sm">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Admin Panel</h1>
        <div className="text-sm text-zinc-400">
          <span className="text-white font-semibold">{activeCount}</span> active &middot;{" "}
          <span className="text-zinc-500">{excludedCount}</span> excluded
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-700 text-sm w-fit">
        <button
          onClick={() => setActiveTab("players")}
          className={`px-5 py-2 font-semibold transition-colors ${activeTab === "players" ? "bg-rose-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
        >
          Players
        </button>
        <button
          onClick={() => { setActiveTab("cards"); loadCards(); }}
          className={`px-5 py-2 font-semibold transition-colors ${activeTab === "cards" ? "bg-rose-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
        >
          🟥 Cards
        </button>
      </div>

      {/* Cards tab */}
      {activeTab === "cards" && (
        <div className="flex flex-col gap-4">
          <p className="text-zinc-400 text-sm">Players sorted by total cards received from users.</p>
          {cardPhotos.length === 0 ? (
            <p className="text-zinc-500 text-sm">No cards given yet.</p>
          ) : (
            <div className="rounded-xl overflow-hidden border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Player</th>
                    <th className="text-center px-4 py-3">🟥 Red</th>
                    <th className="text-center px-4 py-3">🟨 Yellow</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cardPhotos.map((p, i) => (
                    <tr key={p.id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={p.url} alt={p.labels?.en ?? "Player"} fill className="object-cover object-top" sizes="32px" />
                          </div>
                          <span className="text-white font-medium truncate max-w-[180px]">{p.labels?.en ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${p.redCards > 0 ? "text-red-400" : "text-zinc-600"}`}>{p.redCards}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${p.yellowCards > 0 ? "text-amber-400" : "text-zinc-600"}`}>{p.yellowCards}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-xs font-semibold px-3 py-1 rounded-lg bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 transition-colors"
                          title="Remove player (coming soon)"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Players tab */}
      {activeTab === "players" && (<>

      {/* Broken photo tool */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <button
          onClick={findBroken}
          disabled={checkingBroken}
          className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
        >
          {checkingBroken ? "Scanning…" : "Find broken photos"}
        </button>
        {brokenActiveCount > 0 && (
          <>
            <span className="text-sm text-amber-400">
              {brokenActiveCount} active photo{brokenActiveCount !== 1 ? "s" : ""} with broken URLs
            </span>
            <button
              onClick={removeAllBroken}
              className="ml-auto text-sm font-semibold px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 transition-colors whitespace-nowrap"
            >
              Remove all broken
            </button>
          </>
        )}
        {!checkingBroken && brokenIds.size > 0 && brokenActiveCount === 0 && (
          <span className="text-sm text-emerald-400">All active photos look good</span>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm"
        />
        <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-sm">
          {(["all", "active", "excluded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 capitalize transition-colors ${
                filter === f
                  ? "bg-rose-500 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{filtered.length} players shown</div>
        {filtered.some((p) => p.hidden) && (
          <button
            onClick={removeAllExcluded}
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 transition-colors"
          >
            Remove all excluded ({filtered.filter((p) => p.hidden).length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((photo) => {
          const isBroken = !photo.hidden && brokenIds.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`relative rounded-xl overflow-hidden bg-zinc-900 transition-opacity ${
                photo.hidden ? "opacity-40" : ""
              } ${isBroken ? "ring-2 ring-amber-500" : ""}`}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.url}
                  alt={photo.labels?.en ?? "Player"}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
                {isBroken && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-amber-400 text-xs font-bold">Broken</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-white text-xs font-semibold truncate">
                  {photo.labels?.en ?? "—"}
                </p>
                <p className="text-zinc-500 text-xs">
                  {photo.wins}W / {photo.losses}L
                </p>
              </div>
              <button
                onClick={() => toggleHidden(photo)}
                className={`w-full text-xs font-semibold py-1 transition-colors ${
                  photo.hidden
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-zinc-700 hover:bg-rose-600 text-zinc-200 hover:text-white"
                }`}
              >
                {photo.hidden ? "Include" : "Exclude"}
              </button>
              {(photo.hidden || isBroken) && (
                <button
                  onClick={() => removePhoto(photo)}
                  className="w-full text-xs font-semibold py-1 bg-zinc-800 hover:bg-red-900 text-zinc-500 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
      </>)}
    </div>
  );
}
