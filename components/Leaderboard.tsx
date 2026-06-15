"use client";

import Image from "next/image";
import { useLocale } from "./LocaleProvider";

interface Photo {
  id: string;
  url: string;
  label?: string | null;
  rating: number;
  wins: number;
  losses: number;
}

const RANK_META = [
  { medal: "🥇", color: "text-amber-400",  border: "border-amber-400/40",  bg: "bg-amber-400/8",  shadow: "shadow-amber-400/15" },
  { medal: "🥈", color: "text-zinc-300",   border: "border-zinc-400/25",   bg: "bg-zinc-400/5",   shadow: "shadow-zinc-400/10" },
  { medal: "🥉", color: "text-orange-400", border: "border-orange-400/30", bg: "bg-orange-400/6", shadow: "shadow-orange-400/10" },
];

export default function Leaderboard({ photos }: { photos: Photo[] }) {
  const { t } = useLocale();

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="grid gap-2.5">
        {photos.map((photo, i) => {
          const total = photo.wins + photo.losses;
          const winPct = total > 0 ? Math.round((photo.wins / total) * 100) : 0;
          const meta = RANK_META[i] ?? null;
          const isTop3 = i < 3;

          return (
            <div
              key={photo.id}
              className={[
                "flex items-center gap-4 rounded-xl px-4 py-3 border transition-all duration-200 shadow-sm",
                "hover:bg-white/5 hover:border-white/15",
                isTop3
                  ? `${meta!.bg} ${meta!.border} shadow-md ${meta!.shadow}`
                  : "bg-white/3 border-white/5",
              ].join(" ")}
              style={{ animation: `slide-up 0.4s ${i * 0.06}s ease-out both`, opacity: 0 }}
            >
              {/* Rank */}
              <div className="w-9 text-center flex-shrink-0">
                {isTop3 ? (
                  <span className="text-2xl leading-none select-none">{meta!.medal}</span>
                ) : (
                  <span className="text-sm font-black text-zinc-600">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={[
                  "relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0",
                  isTop3 ? `ring-2 ${meta!.border.replace("border-", "ring-")}` : "ring-1 ring-white/10",
                ].join(" ")}
              >
                <Image
                  src={photo.url}
                  alt={photo.label ?? "Photo"}
                  fill
                  className="object-cover object-top"
                  sizes="48px"
                />
              </div>

              {/* Name + win bar */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate text-sm ${isTop3 ? "text-white" : "text-zinc-200"}`}>
                  {photo.label ?? `Player ${i + 1}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-600 to-amber-400 transition-all duration-700"
                      style={{ width: `${winPct}%` }}
                    />
                  </div>
                  <span className="text-zinc-500 text-xs whitespace-nowrap tabular-nums">
                    {photo.wins}W {photo.losses}L
                  </span>
                </div>
              </div>

              {/* ELO */}
              <div className="text-right flex-shrink-0">
                <p className={`font-black text-base tabular-nums ${isTop3 ? meta!.color : "text-zinc-400"}`}>
                  {Math.round(photo.rating)}
                </p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">{t("leaderboard.elo")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
