"use client";

import { useState, useCallback, useEffect } from "react";
import PhotoCard from "./PhotoCard";
import Champion from "./Champion";
import { useLocale } from "./LocaleProvider";
import { buildBracket, advance, type Photo, type BracketState } from "@/lib/bracket";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "h2h_bracket";

const ZH_ROUND_LABELS: Record<number, string> = { 1: "决赛", 2: "半决赛", 3: "8强", 4: "16强" };
const EN_ROUND_LABELS: Record<number, string> = { 1: "Final", 2: "Semifinals", 3: "Quarterfinals", 4: "Round of 16" };

function getRoundLabel(round: number, totalRounds: number, locale: Locale): string {
  const roundsFromEnd = totalRounds - round + 1;
  if (locale === "zh") return ZH_ROUND_LABELS[roundsFromEnd] ?? `第 ${round} 轮`;
  return EN_ROUND_LABELS[roundsFromEnd] ?? `Round ${round}`;
}

export default function TournamentView({ photos, locale }: { photos: Photo[]; locale: Locale }) {
  const { t } = useLocale();
  const [bracket, setBracket] = useState<BracketState | null>(null);
  const [voted, setVoted] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) { setBracket(JSON.parse(saved)); return; }
    } catch {}
    const initial = buildBracket(photos);
    setBracket(initial);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, [photos]);

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (!bracket || voted) return;
      const match = bracket.queue[0];
      const winner = match.a.id === winnerId ? match.a : match.b;

      setVoted(winnerId);

      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoAId: match.a.id, photoBId: match.b.id, winnerId }),
      }).catch(() => {});

      await new Promise((r) => setTimeout(r, 700));

      const next = advance(bracket, winner);
      setBracket(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setVoted(null);
    },
    [bracket, voted]
  );

  function restart() {
    sessionStorage.removeItem(STORAGE_KEY);
    setBracket(buildBracket(photos));
  }

  if (!bracket) return null;
  if (bracket.champion) return <Champion photo={bracket.champion} onRestart={restart} />;

  const match = bracket.queue[0];

  /* Progress: how many matches played out of total in this bracket */
  const totalMatches = photos.length - 1;
  const matchesPlayed = totalMatches - bracket.queue.length;
  const progressPct = Math.round((matchesPlayed / totalMatches) * 100);

  return (
    <div className="flex flex-col items-center gap-5 w-full" style={{ animation: "slide-up 0.4s ease-out both" }}>
      {/* Round badge */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs font-black tracking-[0.2em] uppercase">
          <span className="text-[10px]">⚡</span>
          {getRoundLabel(bracket.round, bracket.totalRounds, locale)}
        </span>
        <p className="text-zinc-500 text-xs tracking-widest uppercase">{t("vote.prompt")}</p>
      </div>

      {/* Cards + VS */}
      <div className="flex flex-row items-center gap-2 md:gap-6 w-full max-w-4xl">
        <PhotoCard
          photo={match.a}
          onClick={handleVote}
          disabled={!!voted}
          winner={voted === match.a.id}
          loser={voted !== null && voted !== match.a.id}
        />

        {/* VS */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 select-none">
          <span
            className="text-2xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-rose-400 via-red-500 to-amber-500 bg-clip-text text-transparent leading-none"
            style={{ animation: "vs-pulse 2.5s ease-in-out infinite", filter: "drop-shadow(0 0 12px rgba(244,63,94,0.5))" }}
          >
            VS
          </span>
        </div>

        <PhotoCard
          photo={match.b}
          onClick={handleVote}
          disabled={!!voted}
          winner={voted === match.b.id}
          loser={voted !== null && voted !== match.b.id}
        />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-4xl px-1">
        <div className="flex justify-between text-zinc-600 text-xs mb-1.5">
          <span>{matchesPlayed} / {totalMatches} matches</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
