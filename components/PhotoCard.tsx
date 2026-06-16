"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { flagEmoji, positionAbbr } from "@/lib/playerUtils";

interface Photo {
  id: string;
  url: string;
  label?: string | null;
  position?: string | null;
  nationality?: string | null;
  heightCm?: number | null;
  birthDate?: string | null;
  overallRating?: number | null;
}

interface PhotoCardProps {
  photo: Photo;
  onClick: (id: string) => void;
  disabled?: boolean;
  winner?: boolean;
  loser?: boolean;
  onCard?: (id: string, card: "yellow" | "red") => void;
}

export default function PhotoCard({ photo, onClick, disabled, winner, loser, onCard }: PhotoCardProps) {
  const hasStats = photo.nationality || photo.position || photo.heightCm || photo.birthDate;
  const age = photo.birthDate
    ? Math.floor((Date.now() - new Date(photo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const [showOverlay, setShowOverlay] = useState(false);
  const [cardGiven, setCardGiven] = useState<"yellow" | "red" | null>(null);
  const [hovered, setHovered] = useState(false);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -40 && onCard && !showOverlay) {
      setShowOverlay(true);
    }
  }

  function handleCard(card: "yellow" | "red") {
    setShowOverlay(false);
    setCardGiven(card);
    onCard?.(photo.id, card);

    try {
      const raw = sessionStorage.getItem("cardedPlayerIds") ?? "";
      const ids = new Set(raw ? raw.split(",") : []);
      ids.add(photo.id);
      sessionStorage.setItem("cardedPlayerIds", Array.from(ids).join(","));
    } catch {}

    setTimeout(() => setCardGiven(null), 1200);
  }

  return (
    <div
      className="relative group w-full max-w-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowOverlay(false); }}
    >
      <button
        onClick={() => !showOverlay && onClick(photo.id)}
        disabled={disabled}
        style={
          winner
            ? { animation: "pulse-glow-gold 1.8s ease-in-out infinite" }
            : undefined
        }
        className={[
          "relative w-full rounded-2xl overflow-hidden flex flex-col",
          "outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
          "border-2 transition-all duration-300",
          disabled && !winner && !loser ? "cursor-default" : "",
          !disabled
            ? "cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl"
            : "",
          winner
            ? "border-amber-400 scale-[1.02] -translate-y-1 shadow-2xl shadow-amber-400/50 z-10"
            : "border-white/10 hover:border-rose-500/50 hover:shadow-rose-500/25",
          loser ? "opacity-25 grayscale scale-[0.97] saturate-0" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Portrait image section */}
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          <Image
            src={photo.url}
            alt={photo.label ?? "Photo"}
            fill
            className="object-cover object-top scale-[1.6] md:scale-100 origin-top"
            sizes="(max-width: 768px) 50vw, 50vw"
          />

          {/* Hover shimmer sweep */}
          {!loser && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 bottom-0 w-1/3 -skew-x-12 -translate-x-full group-hover:[animation:card-shimmer_0.75s_ease-in_forwards] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          )}

          {/* Bottom gradient overlay — always on mobile, hover on desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          {/* Label */}
          {photo.label && (
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 md:px-4 md:py-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-white font-bold text-xs md:text-base leading-tight drop-shadow-lg">
                {photo.label}
              </p>
            </div>
          )}

          {/* Winner badge */}
          {winner && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg tracking-widest uppercase whitespace-nowrap">
              ✓ Winner
            </div>
          )}

          {/* Corner accent on hover (non-loser) */}
          {!loser && !winner && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          )}
        </div>

        {/* Stats strip — below the image, never overlaps the face */}
        {hasStats && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-t border-white/5">
            {photo.nationality && (
              <span className="text-base leading-none">{flagEmoji(photo.nationality)}</span>
            )}
            {photo.position && (
              <span className="text-amber-400 font-bold text-[10px] tracking-widest leading-none uppercase">
                {positionAbbr(photo.position)}
              </span>
            )}
            {(photo.heightCm || age) && (
              <span className="text-zinc-400 text-[10px] leading-none ml-auto flex gap-1.5">
                {age && <span>{age}y</span>}
                {photo.heightCm && <span>{photo.heightCm} cm</span>}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Desktop card trigger — appears on hover */}
      {onCard && !loser && !showOverlay && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowOverlay(true); }}
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 rounded-lg px-2 py-1 text-sm transition-colors select-none"
          title="Give a card"
        >
          🃏
        </button>
      )}

      {/* Card overlay */}
      {showOverlay && onCard && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/80 backdrop-blur-sm"
          style={{ animation: "slide-up 0.2s ease-out both" }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-sm font-bold tracking-wide">Give a card</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleCard("yellow")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-white text-sm font-semibold transition-colors"
            >
              🟨 Yellow
            </button>
            <button
              onClick={() => handleCard("red")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-400/50 text-white text-sm font-semibold transition-colors"
            >
              🟥 Red
            </button>
          </div>
          <button
            onClick={() => setShowOverlay(false)}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Card confirmation bounce */}
      {cardGiven && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          style={{ animation: "card-bounce 1.2s ease-out both" }}
        >
          <span className="text-6xl drop-shadow-lg">
            {cardGiven === "yellow" ? "🟨" : "🟥"}
          </span>
        </div>
      )}
    </div>
  );
}
