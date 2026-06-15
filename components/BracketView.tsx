"use client";

import Image from "next/image";
import type { BracketState, Photo } from "@/lib/bracket";

// roundsFromEnd: 4=16强, 3=8强, 2=半决赛, 1=决赛
const ROUND_CONFIG: Record<number, { zh: string; en: string; color: string; borderColor: string; glowColor: string }> = {
  4: { zh: "16强",  en: "R16",   color: "#22d3ee", borderColor: "rgba(34,211,238,0.35)",  glowColor: "rgba(34,211,238,0.25)"  },
  3: { zh: "8强",   en: "QF",    color: "#34d399", borderColor: "rgba(52,211,153,0.35)",  glowColor: "rgba(52,211,153,0.25)"  },
  2: { zh: "半决赛", en: "SF",   color: "#fb923c", borderColor: "rgba(251,146,60,0.35)",  glowColor: "rgba(251,146,60,0.25)"  },
  1: { zh: "决赛",  en: "Final", color: "#fbbf24", borderColor: "rgba(251,191,36,0.35)",  glowColor: "rgba(251,191,36,0.25)"  },
};

// Height in px allocated per round-1 slot (used to compute container height for space-around alignment)
const SLOT_UNIT = 52;
// Diameter of the player circle thumbnail
const CIRCLE_SIZE = 32;

interface SlotProps {
  photo?: Photo;
  color: string;
  borderColor: string;
  glowColor: string;
}

function Slot({ photo, color, borderColor, glowColor }: SlotProps) {
  if (!photo) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: "50%",
            border: "1.5px dashed rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            flexShrink: 0,
          }}
        />
        <p style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", width: 56, textAlign: "center" }}>—</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      style={{ animation: "bracket-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div
        style={{
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: "50%",
          border: `1.5px solid ${borderColor}`,
          boxShadow: `0 0 8px ${glowColor}`,
          background: "#0f0f1a",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Image
          src={photo.url}
          alt={photo.label ?? ""}
          fill
          className="object-cover object-top"
          style={{ transform: "scale(2.2) translateY(10%)", transformOrigin: "top center" }}
          sizes={`${CIRCLE_SIZE}px`}
        />
      </div>
      <p
        style={{
          fontSize: 8,
          color,
          width: 56,
          textAlign: "center",
          lineHeight: 1.2,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          opacity: 0.85,
        }}
      >
        {photo.label}
      </p>
    </div>
  );
}

interface Props {
  bracket: BracketState;
  locale?: string;
}

export default function BracketView({ bracket, locale = "zh" }: Props) {
  const history: Photo[][] = bracket.history ?? Array.from({ length: bracket.totalRounds }, () => []);

  // slotsInRound1 = half the bracket size = 2^(totalRounds-1)
  const slotsInRound1 = 1 << (bracket.totalRounds - 1);
  const containerH = slotsInRound1 * SLOT_UNIT;

  return (
    <div className="w-full max-w-4xl px-1">
      <p className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase mb-3">
        Bracket
      </p>

      <div className="overflow-x-auto scrollbar-none">
        <div className="flex flex-row gap-px min-w-max pb-1">
          {Array.from({ length: bracket.totalRounds }, (_, i) => {
            const round = i + 1; // 1-indexed
            const roundsFromEnd = bracket.totalRounds - round + 1;
            const cfg = ROUND_CONFIG[roundsFromEnd] ?? ROUND_CONFIG[1];
            const label = locale === "zh" ? cfg.zh : cfg.en;
            const slotsCount = 1 << (bracket.totalRounds - round);
            const picks = history[round - 1] ?? [];
            const isCurrentRound = round === bracket.round;

            return (
              <div key={round} className="flex flex-col items-center" style={{ width: 72 }}>
                {/* Round label */}
                <p
                  className="text-[9px] font-bold tracking-[0.12em] uppercase mb-2 text-center"
                  style={{
                    color: cfg.color,
                    textShadow: `0 0 10px ${cfg.glowColor}`,
                    opacity: round <= bracket.round ? 1 : 0.35,
                  }}
                >
                  {label}
                </p>

                {/* Slots — space-around distributes items so round r slots align between pairs of round r-1 slots */}
                <div
                  style={{
                    height: containerH,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {Array.from({ length: slotsCount }, (_, slotIdx) => (
                    <Slot
                      key={picks[slotIdx]?.id ?? `empty-${round}-${slotIdx}`}
                      photo={picks[slotIdx]}
                      color={cfg.color}
                      borderColor={isCurrentRound && picks[slotIdx] ? cfg.borderColor.replace("0.35", "0.7") : cfg.borderColor}
                      glowColor={isCurrentRound && picks[slotIdx] ? cfg.glowColor.replace("0.25", "0.5") : cfg.glowColor}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
