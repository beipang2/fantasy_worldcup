"use client";

import Image from "next/image";
import { useLocale } from "./LocaleProvider";

interface Photo {
  id: string;
  url: string;
  label: string | null;
}

export default function Champion({ photo, onRestart }: { photo: Photo; onRestart: () => void }) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center gap-8 py-8 w-full max-w-lg mx-auto px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black tracking-tight">{photo.label ?? "Winner"}</h1>
      </div>

      <div className="relative w-72 h-72 rounded-3xl overflow-hidden ring-4 ring-yellow-400 shadow-2xl shadow-yellow-900/40">
        <Image src={photo.url} alt={photo.label ?? "Champion"} fill className="object-cover" sizes="288px" priority />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-4 py-1 rounded-full tracking-widest uppercase shadow">
          🏆 {t("champion.heading")}
        </div>
      </div>

      <button onClick={onRestart} className="px-8 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors">
        {t("champion.playAgain")}
      </button>
    </div>
  );
}
