"use client";

import { useRef, useState, useEffect, useCallback } from "react";

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
      <div className="flex items-center justify-center gap-4 my-1 select-none">
        <button
          className={[
            "touch-none cursor-grab active:cursor-grabbing",
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-amber-500/10 border border-amber-400/30 text-white text-sm font-semibold",
            "shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all duration-200",
            dragging?.card === "yellow"
              ? "opacity-40 scale-95"
              : "hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)]",
          ].join(" ")}
          onMouseDown={(e) => { e.preventDefault(); startDrag("yellow", e.clientX, e.clientY); }}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("yellow", t.clientX, t.clientY); }}
        >
          🟨 <span className="hidden sm:inline">Yellow Card</span>
        </button>

        <span className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase pointer-events-none">
          drag to player
        </span>

        <button
          className={[
            "touch-none cursor-grab active:cursor-grabbing",
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-red-500/10 border border-red-400/30 text-white text-sm font-semibold",
            "shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all duration-200",
            dragging?.card === "red"
              ? "opacity-40 scale-95"
              : "hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.45)]",
          ].join(" ")}
          onMouseDown={(e) => { e.preventDefault(); startDrag("red", e.clientX, e.clientY); }}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("red", t.clientX, t.clientY); }}
        >
          🟥 <span className="hidden sm:inline">Red Card</span>
        </button>
      </div>

      {/* Drag clone — rendered above the pointer so elementFromPoint at touch coords hits the photo */}
      {dragging && (
        <div
          ref={cloneRef}
          className="fixed pointer-events-none z-50 text-4xl"
          style={{
            left: dragging.x - 22,
            top: dragging.y - 64,
            transform: "rotate(-8deg)",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
          }}
        >
          {dragging.card === "yellow" ? "🟨" : "🟥"}
        </div>
      )}
    </>
  );
}
