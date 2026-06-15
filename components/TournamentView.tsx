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

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <p className="text-zinc-500 text-xs tracking-widest uppercase">
        {getRoundLabel(bracket.round, bracket.totalRounds, locale)}
      </p>
      <p className="text-zinc-400 text-sm tracking-widest uppercase">
        {t("vote.prompt")}
      </p>
      <div className="flex flex-row items-center gap-2 md:gap-8 w-full max-w-4xl px-2 md:px-4">
        <PhotoCard photo={match.a} onClick={handleVote} disabled={!!voted} winner={voted === match.a.id} loser={voted !== null && voted !== match.a.id} />
        <div className="flex-shrink-0">
          <span className="text-xl md:text-4xl font-black text-zinc-600 tracking-tighter">VS</span>
        </div>
        <PhotoCard photo={match.b} onClick={handleVote} disabled={!!voted} winner={voted === match.b.id} loser={voted !== null && voted !== match.b.id} />
      </div>
    </div>
  );
}
