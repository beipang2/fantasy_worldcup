"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
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

interface RankedPhoto extends Photo {
  rating?: number;
  wins?: number;
  losses?: number;
}

export default function TournamentView({ photos, locale }: { photos: RankedPhoto[]; locale: Locale }) {
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

  if (bracket.champion) {
    const dbPhoto = photos.find((p) => p.id === bracket.champion!.id);
    const stats =
      dbPhoto?.wins !== undefined
        ? {
            wins: dbPhoto.wins,
            losses: dbPhoto.losses ?? 0,
            rating: dbPhoto.rating ?? 1000,
            sessionWins: bracket.totalRounds,
          }
        : undefined;
    return <Champion photo={bracket.champion} onRestart={restart} stats={stats} />;
  }

  const match = bracket.queue[0];

  const totalMatches = (1 << bracket.totalRounds) - 1;
  const progressPct = Math.round((bracket.matchesPlayed / totalMatches) * 100);

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
          <span>{bracket.matchesPlayed} / {totalMatches} matches</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* This round's picks — resets each round */}
      {bracket.advancedPhotos.length > 0 && (
        <div className="w-full max-w-4xl px-1">
          <p className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase mb-2">
            Your picks
          </p>
          <div className="flex flex-wrap gap-2.5">
            {bracket.advancedPhotos.map((photo, i) => (
              <div
                key={`${photo.id}-${i}`}
                className="flex flex-col items-center gap-1 w-14"
                style={{ animation: "slide-up 0.3s ease-out both" }}
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-amber-400/40 bg-zinc-900">
                  <Image
                    src={photo.url}
                    alt={photo.label ?? "Pick"}
                    fill
                    className="object-cover object-top scale-[2.2] md:scale-100 origin-top"
                    sizes="48px"
                  />
                </div>
                <p className="text-zinc-500 text-[9px] leading-tight text-center line-clamp-2 w-full">
                  {photo.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
