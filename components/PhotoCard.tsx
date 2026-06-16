"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { flagEmoji, positionAbbr } from "@/lib/playerUtils";
import RefereeCard from "./RefereeCard";

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
  highlight?: "yellow" | "red" | null;
  cardFlash?: "yellow" | "red" | null;
  activeCards?: ("yellow" | "red")[];
  onCardRemove?: (card: "yellow" | "red") => void;
}

export default function PhotoCard({ photo, onClick, disabled, winner, loser, highlight, cardFlash, activeCards, onCardRemove }: PhotoCardProps) {
  const hasStats = photo.nationality || photo.position || photo.heightCm || photo.birthDate;
  const age = photo.birthDate
    ? Math.floor((Date.now() - new Date(photo.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const [pinDrag, setPinDrag] = useState<{ card: "yellow" | "red"; x: number; y: number } | null>(null);
  const pinDragRef = useRef<{ card: "yellow" | "red"; x: number; y: number } | null>(null);
  const pinCloneRef = useRef<HTMLDivElement>(null);
  const onCardRemoveRef = useRef(onCardRemove);
  useEffect(() => { onCardRemoveRef.current = onCardRemove; }, [onCardRemove]);

  function startPinDrag(card: "yellow" | "red", x: number, y: number) {
    const state = { card, x, y };
    pinDragRef.current = state;
    setPinDrag(state);
  }

  useEffect(() => {
    const photoId = photo.id;

    function onMouseMove(e: MouseEvent) {
      if (!pinDragRef.current) return;
      const state = { ...pinDragRef.current, x: e.clientX, y: e.clientY };
      pinDragRef.current = state;
      setPinDrag({ ...state });
    }

    function onMouseUp(e: MouseEvent) {
      if (!pinDragRef.current) return;
      const card = pinDragRef.current.card;
      const clone = pinCloneRef.current;
      if (clone) clone.style.visibility = "hidden";
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (clone) clone.style.visibility = "";
      const hitId = el?.closest("[data-photo-id]")?.getAttribute("data-photo-id") ?? null;
      if (hitId !== photoId) onCardRemoveRef.current?.(card);
      pinDragRef.current = null;
      setPinDrag(null);
    }

    function onTouchMove(e: TouchEvent) {
      if (!pinDragRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const state = { ...pinDragRef.current, x: touch.clientX, y: touch.clientY };
      pinDragRef.current = state;
      setPinDrag({ ...state });
    }

    function onTouchEnd(e: TouchEvent) {
      if (!pinDragRef.current) return;
      const touch = e.changedTouches[0];
      const card = pinDragRef.current.card;
      const clone = pinCloneRef.current;
      if (clone) clone.style.visibility = "hidden";
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      if (clone) clone.style.visibility = "";
      const hitId = el?.closest("[data-photo-id]")?.getAttribute("data-photo-id") ?? null;
      if (hitId !== photoId) onCardRemoveRef.current?.(card);
      pinDragRef.current = null;
      setPinDrag(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [photo.id]);

  return (
    <div className="relative w-full max-w-lg" data-photo-id={photo.id}>
      <button
        onClick={() => onClick(photo.id)}
        disabled={disabled}
        style={
          winner
            ? { animation: "pulse-glow-gold 1.8s ease-in-out infinite" }
            : undefined
        }
        className={[
          "relative w-full rounded-2xl overflow-hidden flex flex-col group",
          "outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
          "border-2 transition-all duration-300",
          disabled && !winner && !loser ? "cursor-default" : "",
          !disabled
            ? "cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl"
            : "",
          winner
            ? "border-amber-400 scale-[1.02] -translate-y-1 shadow-2xl shadow-amber-400/50 z-10"
            : highlight === "yellow"
            ? "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)]"
            : highlight === "red"
            ? "border-red-400 shadow-[0_0_24px_rgba(239,68,68,0.6)]"
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

      {/* Persistent card indicators in top-right corner — draggable to cancel */}
      {activeCards && activeCards.length > 0 && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5 z-20 select-none">
          {activeCards.map((cardColor, i) => (
            <div
              key={`${cardColor}-${i}`}
              className="touch-none"
              style={{
                width: 16,
                height: 22,
                borderRadius: 3,
                cursor: pinDrag ? "grabbing" : "grab",
                background:
                  cardColor === "yellow"
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(135deg, #f87171, #dc2626)",
                boxShadow:
                  cardColor === "yellow"
                    ? "0 2px 6px rgba(245,158,11,0.65)"
                    : "0 2px 6px rgba(220,38,38,0.65)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startPinDrag(cardColor, e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const t = e.touches[0];
                startPinDrag(cardColor, t.clientX, t.clientY);
              }}
            />
          ))}
        </div>
      )}

      {/* Drag clone for pinned card removal */}
      {pinDrag && (
        <div
          ref={pinCloneRef}
          style={{
            position: "fixed",
            left: pinDrag.x - 8,
            top: pinDrag.y - 18,
            width: 16,
            height: 22,
            borderRadius: 3,
            transform: "rotate(-10deg) scale(1.5)",
            background:
              pinDrag.card === "yellow"
                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                : "linear-gradient(135deg, #f87171, #dc2626)",
            boxShadow:
              pinDrag.card === "yellow"
                ? "0 4px 12px rgba(245,158,11,0.7)"
                : "0 4px 12px rgba(220,38,38,0.7)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}

      {/* Card confirmation bounce after a successful drop */}
      {cardFlash && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          style={{ animation: "card-bounce 1.2s ease-out both" }}
        >
          <span
            style={{
              filter: `drop-shadow(0 4px 14px ${cardFlash === "yellow" ? "rgba(245,158,11,0.7)" : "rgba(220,38,38,0.7)"})`,
            }}
          >
            <RefereeCard color={cardFlash} width={52} height={74} />
          </span>
        </div>
      )}
    </div>
  );
}
