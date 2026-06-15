"use client";

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
}

export default function PhotoCard({ photo, onClick, disabled, winner, loser }: PhotoCardProps) {
  const hasStats = photo.nationality || photo.position || photo.heightCm || photo.birthDate;
  const age = photo.birthDate
    ? Math.floor((Date.now() - new Date(photo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <button
      onClick={() => onClick(photo.id)}
      disabled={disabled}
      style={
        winner
          ? { animation: "pulse-glow-gold 1.8s ease-in-out infinite" }
          : undefined
      }
      className={[
        "relative group w-full max-w-lg rounded-2xl overflow-hidden flex flex-col",
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

        {/* Overall rating badge — EA FC style, top-left */}
        {photo.overallRating != null && (
          <div className="absolute top-2 left-2 flex flex-col items-center leading-none select-none pointer-events-none">
            <span
              className={[
                "text-xl md:text-2xl font-black drop-shadow-lg",
                photo.overallRating >= 85
                  ? "text-amber-300"
                  : photo.overallRating >= 75
                  ? "text-slate-300"
                  : "text-amber-700",
              ].join(" ")}
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
            >
              {photo.overallRating}
            </span>
            {photo.position && (
              <span
                className={[
                  "text-[9px] font-bold tracking-wider uppercase",
                  photo.overallRating >= 85
                    ? "text-amber-300"
                    : photo.overallRating >= 75
                    ? "text-slate-300"
                    : "text-amber-700",
                ].join(" ")}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
              >
                {positionAbbr(photo.position)}
              </span>
            )}
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
  );
}
