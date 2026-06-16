"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import RefereeCard from "./RefereeCard";
import { useLocale } from "./LocaleProvider";

interface DragState {
  card: "yellow" | "red";
  x: number;
  y: number;
}

interface CardDeckProps {
  onCardDrop: (photoId: string, card: "yellow" | "red") => void;
  onHoverChange: (photoId: string | null, card: "yellow" | "red" | null) => void;
}

export default function CardDeck({ onCardDrop, onHoverChange }: CardDeckProps) {
  const { t } = useLocale();
  const [dragging, setDragging] = useState<DragState | null>(null);
  const draggingRef = useRef<DragState | null>(null);
  const cloneRef = useRef<HTMLDivElement>(null);

  const findPhotoId = useCallback((x: number, y: number): string | null => {
    const clone = cloneRef.current;
    if (clone) clone.style.visibility = "hidden";
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (clone) clone.style.visibility = "";
    if (!el) return null;
    return el.closest("[data-photo-id]")?.getAttribute("data-photo-id") ?? null;
  }, []);

  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const state = { ...draggingRef.current, x: touch.clientX, y: touch.clientY };
      draggingRef.current = state;
      setDragging({ ...state });
      const photoId = findPhotoId(touch.clientX, touch.clientY);
      onHoverChange(photoId, photoId ? state.card : null);
    }

    function onTouchEnd(e: TouchEvent) {
      if (!draggingRef.current) return;
      const touch = e.changedTouches[0];
      const card = draggingRef.current.card;
      const photoId = findPhotoId(touch.clientX, touch.clientY);
      if (photoId) onCardDrop(photoId, card);
      onHoverChange(null, null);
      draggingRef.current = null;
      setDragging(null);
    }

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [findPhotoId, onCardDrop, onHoverChange]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      const state = { ...draggingRef.current, x: e.clientX, y: e.clientY };
      draggingRef.current = state;
      setDragging({ ...state });
      const photoId = findPhotoId(e.clientX, e.clientY);
      onHoverChange(photoId, photoId ? state.card : null);
    }

    function onMouseUp(e: MouseEvent) {
      if (!draggingRef.current) return;
      const card = draggingRef.current.card;
      const photoId = findPhotoId(e.clientX, e.clientY);
      if (photoId) onCardDrop(photoId, card);
      onHoverChange(null, null);
      draggingRef.current = null;
      setDragging(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [findPhotoId, onCardDrop, onHoverChange]);

  function startDrag(card: "yellow" | "red", x: number, y: number) {
    const state = { card, x, y };
    draggingRef.current = state;
    setDragging(state);
  }

  return (
    <>
      <div className="flex items-center justify-center gap-6 my-1 select-none">
        {/* Yellow card button */}
        <button
          className={[
            "touch-none flex flex-col items-center gap-1 group",
            "transition-all duration-150",
            dragging?.card === "yellow" ? "opacity-35 scale-90" : "",
          ].join(" ")}
          style={{ cursor: dragging?.card === "yellow" ? "grabbing" : "grab" }}
          onMouseDown={(e) => { e.preventDefault(); startDrag("yellow", e.clientX, e.clientY); }}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("yellow", t.clientX, t.clientY); }}
          aria-label="Yellow card — drag onto a player"
        >
          <span
            className="block transition-transform duration-150 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 3px 8px rgba(245,158,11,0.5))" }}
          >
            <RefereeCard color="yellow" width={28} height={40} />
          </span>
          <span className="text-[9px] text-zinc-500 font-medium tracking-wide leading-none">Yellow</span>
        </button>

        <span className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase pointer-events-none">
          drag to player
        </span>

        {/* Red card button */}
        <button
          className={[
            "touch-none flex flex-col items-center gap-1 group",
            "transition-all duration-150",
            dragging?.card === "red" ? "opacity-35 scale-90" : "",
          ].join(" ")}
          style={{ cursor: dragging?.card === "red" ? "grabbing" : "grab" }}
          onMouseDown={(e) => { e.preventDefault(); startDrag("red", e.clientX, e.clientY); }}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("red", t.clientX, t.clientY); }}
          aria-label="Red card — drag onto a player"
        >
          <span
            className="block transition-transform duration-150 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 3px 8px rgba(220,38,38,0.5))" }}
          >
            <RefereeCard color="red" width={28} height={40} />
          </span>
          <span className="text-[9px] text-zinc-500 font-medium tracking-wide leading-none">Red</span>
        </button>
      </div>
      <p className="text-xs text-zinc-500 text-center mt-1 select-none pointer-events-none">
        {t("vote.cardHint")}
      </p>

      {/* Drag clone — sits above the fingertip so elementFromPoint(x,y) hits the photo below */}
      {dragging && (
        <div
          ref={cloneRef}
          style={{
            position: "fixed",
            left: dragging.x - 22,
            top: dragging.y - 72,
            transform: "rotate(-10deg)",
            filter: `drop-shadow(0 6px 16px ${dragging.card === "yellow" ? "rgba(245,158,11,0.55)" : "rgba(220,38,38,0.55)"})`,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <RefereeCard color={dragging.card} width={44} height={62} />
        </div>
      )}
    </>
  );
}
