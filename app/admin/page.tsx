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

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "excluded">("all");
  const [message, setMessage] = useState("");

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
        <h1 className="text-3xl font-black">Player Management</h1>
        <div className="text-sm text-zinc-400">
          <span className="text-white font-semibold">{activeCount}</span> active &middot;{" "}
          <span className="text-zinc-500">{excludedCount}</span> excluded
        </div>
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

      <div className="text-xs text-zinc-500">{filtered.length} players shown</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((photo) => (
          <div
            key={photo.id}
            className={`relative rounded-xl overflow-hidden bg-zinc-900 transition-opacity ${
              photo.hidden ? "opacity-40" : ""
            }`}
          >
            <div className="relative aspect-square">
              <Image
                src={photo.url}
                alt={photo.labels?.en ?? "Player"}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 50vw, 20vw"
              />
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
          </div>
        ))}
      </div>
    </div>
  );
}
