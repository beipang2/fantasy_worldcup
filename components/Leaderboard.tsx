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

export default function Leaderboard({ photos }: { photos: Photo[] }) {
  const { t } = useLocale();

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="grid gap-3">
        {photos.map((photo, i) => {
          const total = photo.wins + photo.losses;
          const winPct = total > 0 ? Math.round((photo.wins / total) * 100) : 0;
          return (
            <div key={photo.id} className="flex items-center gap-4 bg-zinc-900 rounded-xl p-3 hover:bg-zinc-800 transition-colors">
              <span className={`text-xl font-black w-8 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-600"}`}>
                {i + 1}
              </span>
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={photo.url} alt={photo.label ?? "Photo"} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{photo.label ?? `Photo ${i + 1}`}</p>
                <p className="text-zinc-500 text-xs">
                  {photo.wins}W – {photo.losses}L &middot; {winPct}% {t("leaderboard.winRate")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-rose-400 font-bold text-lg">{Math.round(photo.rating)}</p>
                <p className="text-zinc-600 text-xs">{t("leaderboard.elo")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
