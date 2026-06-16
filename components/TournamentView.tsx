"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import PhotoCard from "./PhotoCard";
import Champion from "./Champion";
import { useLocale } from "./LocaleProvider";
import { buildBracket, advance, advanceWithBye, type Photo, type BracketState } from "@/lib/bracket";
import BracketView from "./BracketView";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "h2h_bracket";
const CARDED_KEY = "cardedPlayerIds";

function getCardedPlayerIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(CARDED_KEY) ?? "";
    return new Set(raw ? raw.split(",") : []);
  } catch {
    return new Set();
  }
}

function filterEligible<T extends { id: string }>(photos: T[], excluded: Set<string>): T[] {
  return excluded.size > 0 ? photos.filter((p) => !excluded.has(p.id)) : photos;
}

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

// Color scheme per stage (roundsFromEnd: 4=R16, 3=QF, 2=SF, 1=Final)
const ROUND_STYLES: Record<number, { gradient: string; glow: string; line: string }> = {
  4: { gradient: "from-cyan-300 via-blue-200 to-cyan-400",        glow: "rgba(34,211,238,0.5)",   line: "rgba(34,211,238,0.65)"  },
  3: { gradient: "from-emerald-300 via-green-200 to-emerald-400", glow: "rgba(52,211,153,0.5)",   line: "rgba(52,211,153,0.65)"  },
  2: { gradient: "from-orange-300 via-rose-300 to-orange-400",    glow: "rgba(251,113,133,0.55)", line: "rgba(251,113,133,0.65)" },
  1: { gradient: "from-amber-300 via-yellow-200 to-amber-400",    glow: "rgba(251,191,36,0.5)",   line: "rgba(251,191,36,0.65)"  },
};

export default function TournamentView({ photos, locale }: { photos: RankedPhoto[]; locale: Locale }) {
  const { t } = useLocale();
  const [bracket, setBracket] = useState<BracketState | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const autoAdvancingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: BracketState = JSON.parse(saved);
        // Back-fill history for sessions saved before this field existed
        if (!parsed.history) {
          parsed.history = Array.from({ length: parsed.totalRounds }, () => []);
        }
        setBracket(parsed);
        return;
      }
    } catch {}
    const initial = buildBracket(filterEligible(photos, getCardedPlayerIds()));
    setBracket(initial);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, [photos]);

  const handleCard = useCallback((photoId: string, card: "yellow" | "red") => {
    fetch("/api/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, card }),
    }).catch(() => {});
  }, []);

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (!bracket || voted) return;
      const match = bracket.queue[0];
      const winner = match.a?.id === winnerId ? match.a : match.b;
      if (!winner) return;

      setVoted(winnerId);

      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoAId: match.a?.id ?? null, photoBId: match.b?.id ?? null, winnerId }),
      }).catch(() => {});

      await new Promise((r) => setTimeout(r, 700));

      const next = advance(bracket, winner);
      setBracket(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setVoted(null);
    },
    [bracket, voted]
  );

  // Auto-advance for bye situations
  useEffect(() => {
    if (!bracket || bracket.champion || voted || autoAdvancingRef.current) return;
    const match = bracket.queue[0];
    if (!match) return;

    // Case 1: one slot is a null bye — the real player auto-wins
    if (match.a === null || match.b === null) {
      const realPlayer = (match.a ?? match.b) as Photo;
      autoAdvancingRef.current = true;
      setAutoAdvancing(true);
      const timer = setTimeout(() => {
        autoAdvancingRef.current = false;
        setAutoAdvancing(false);
        fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoAId: match.a?.id ?? null, photoBId: match.b?.id ?? null, winnerId: realPlayer.id }),
        }).catch(() => {});
        const next = advance(bracket, realPlayer);
        setBracket(next);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }, 400);
      return () => {
        clearTimeout(timer);
        autoAdvancingRef.current = false;
        setAutoAdvancing(false);
      };
    }

    // Case 2: both players are carded — push a null bye, no winner
    const carded = getCardedPlayerIds();
    if (!carded.has(match.a.id) || !carded.has(match.b.id)) return;

    autoAdvancingRef.current = true;
    setAutoAdvancing(true);
    const timer = setTimeout(() => {
      autoAdvancingRef.current = false;
      setAutoAdvancing(false);
      const next = advanceWithBye(bracket);
      setBracket(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, 400);
    return () => {
      clearTimeout(timer);
      autoAdvancingRef.current = false;
      setAutoAdvancing(false);
    };
  }, [bracket, voted, handleVote]);

  function restart() {
    const fresh = buildBracket(filterEligible(photos, getCardedPlayerIds()));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setBracket(fresh);
  }

  if (!bracket) return null;

  if (bracket.champion) {
    return <Champion photo={bracket.champion} onRestart={restart} />;
  }

  const match = bracket.queue[0];
  const roundsFromEnd = bracket.totalRounds - bracket.round + 1;
  const roundStyle = ROUND_STYLES[roundsFromEnd] ?? ROUND_STYLES[1];

  const totalMatches = (1 << bracket.totalRounds) - 1;
  const progressPct = Math.round((bracket.matchesPlayed / totalMatches) * 100);

  return (
    <div className="flex flex-col items-center gap-5 w-full" style={{ animation: "slide-up 0.4s ease-out both" }}>
      {/* Round announcement */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-zinc-600 text-[10px] font-semibold tracking-[0.3em] uppercase">
          ⚡ Now Playing
        </p>

        {/* key=round remounts this element each round → CSS animation replays */}
        <div
          key={bracket.round}
          className="relative flex flex-col items-center"
          style={{ animation: "round-reveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <h2
            className={`text-3xl md:text-5xl font-black tracking-tight text-center bg-gradient-to-r ${roundStyle.gradient} bg-clip-text text-transparent leading-none pb-1`}
            style={{ filter: `drop-shadow(0 0 20px ${roundStyle.glow})` }}
          >
            {getRoundLabel(bracket.round, bracket.totalRounds, locale)}
          </h2>
          <span
            className="mt-1.5 block h-px w-3/4 rounded-full"
            style={{ background: `linear-gradient(to right, transparent, ${roundStyle.line}, transparent)` }}
          />
        </div>

        <p className="text-zinc-300 text-sm font-semibold tracking-wide">{t("vote.prompt")}</p>
      </div>

      {/* Cards + VS */}
      <div className="flex flex-row items-center gap-2 md:gap-6 w-full max-w-4xl">
        {match.a ? (
          <PhotoCard
            photo={match.a}
            onClick={handleVote}
            disabled={!!voted || autoAdvancing}
            winner={voted === match.a.id}
            loser={voted !== null && voted !== match.a.id}
            onCard={handleCard}
          />
        ) : (
          <div className="relative w-full max-w-lg flex items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]">
            <p className="text-zinc-600 text-sm font-bold tracking-widest uppercase">BYE</p>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col items-center gap-1 select-none">
          {autoAdvancing ? (
            <span
              className="text-xs font-bold tracking-widest text-amber-400 uppercase animate-pulse"
              style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.7))" }}
            >
              {match.a === null || match.b === null ? "⚡ Auto Win" : "⚡ Bye"}
            </span>
          ) : (
            <span
              className="text-2xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-rose-400 via-red-500 to-amber-500 bg-clip-text text-transparent leading-none"
              style={{ animation: "vs-pulse 2.5s ease-in-out infinite", filter: "drop-shadow(0 0 12px rgba(244,63,94,0.5))" }}
            >
              VS
            </span>
          )}
        </div>

        {match.b ? (
          <PhotoCard
            photo={match.b}
            onClick={handleVote}
            disabled={!!voted || autoAdvancing}
            winner={voted === match.b.id}
            loser={voted !== null && voted !== match.b.id}
            onCard={handleCard}
          />
        ) : (
          <div className="relative w-full max-w-lg flex items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]">
            <p className="text-zinc-600 text-sm font-bold tracking-widest uppercase">BYE</p>
          </div>
        )}
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

      {/* Bracket tree */}
      <BracketView bracket={bracket} locale={locale} />

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
