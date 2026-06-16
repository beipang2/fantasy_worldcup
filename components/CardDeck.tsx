"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

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

  const cardStyle = (color: "yellow" | "red", active: boolean): React.CSSProperties => ({
    width: 28,
    height: 40,
    borderRadius: 4,
    background:
      color === "yellow"
        ? "linear-gradient(135deg, #fce043 0%, #f5c518 55%, #d4a000 100%)"
        : "linear-gradient(135deg, #f04545 0%, #e02020 55%, #a81010 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.35)",
    border: "none",
    padding: 0,
    cursor: active ? "grabbing" : "grab",
    opacity: active ? 0.35 : 1,
    transition: "opacity 0.15s, transform 0.15s",
    transform: active ? "scale(0.92)" : "scale(1)",
    flexShrink: 0,
  });

  return (
    <>
      <div className="flex items-center justify-center gap-5 my-1 select-none">
        <div className="flex flex-col items-center gap-0.5">
          <button
            className="touch-none"
            style={cardStyle("yellow", dragging?.card === "yellow")}
            onMouseDown={(e) => { e.preventDefault(); startDrag("yellow", e.clientX, e.clientY); }}
            onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("yellow", t.clientX, t.clientY); }}
          />
          <span className="text-[9px] text-zinc-500 font-medium tracking-wide">Yellow</span>
        </div>

        <span className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase pointer-events-none">
          drag to player
        </span>

        <div className="flex flex-col items-center gap-0.5">
          <button
            className="touch-none"
            style={cardStyle("red", dragging?.card === "red")}
            onMouseDown={(e) => { e.preventDefault(); startDrag("red", e.clientX, e.clientY); }}
            onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDrag("red", t.clientX, t.clientY); }}
          />
          <span className="text-[9px] text-zinc-500 font-medium tracking-wide">Red</span>
        </div>
      </div>

      {/* Drag clone — rendered above the pointer so elementFromPoint at touch coords hits the photo */}
      {dragging && (
        <div
          ref={cloneRef}
          style={{
            position: "fixed",
            width: 40,
            height: 56,
            borderRadius: 4,
            background:
              dragging.card === "yellow"
                ? "linear-gradient(135deg, #fce043 0%, #f5c518 55%, #d4a000 100%)"
                : "linear-gradient(135deg, #f04545 0%, #e02020 55%, #a81010 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 14px rgba(0,0,0,0.55)",
            opacity: 0.85,
            left: dragging.x - 20,
            top: dragging.y - 56,
            transform: "rotate(-8deg)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}
    </>
  );
}
