"use client";

import Image from "next/image";
import { useLocale } from "./LocaleProvider";

interface Photo {
  id: string;
  url: string;
  label: string | null;
}

const SPARKLE_POSITIONS = [
  { top: "8%",  left: "12%",  delay: "0s",    size: 18 },
  { top: "15%", right: "10%", delay: "0.3s",  size: 14 },
  { top: "40%", left: "5%",   delay: "0.6s",  size: 12 },
  { top: "40%", right: "6%",  delay: "0.9s",  size: 16 },
  { top: "72%", left: "14%",  delay: "0.45s", size: 10 },
  { top: "75%", right: "12%", delay: "0.75s", size: 13 },
];

export default function Champion({ photo, onRestart }: { photo: Photo; onRestart: () => void }) {
  const { t } = useLocale();

  return (
    <div className="relative flex flex-col items-center gap-7 py-10 w-full max-w-md mx-auto px-4 text-center overflow-hidden">
      {/* Sparkle decorations */}
      {SPARKLE_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="absolute pointer-events-none text-amber-400 select-none"
          style={{
            top: pos.top,
            left: (pos as { left?: string }).left,
            right: (pos as { right?: string }).right,
            fontSize: pos.size,
            animation: `sparkle 2.2s ease-in-out ${pos.delay} infinite`,
          }}
        >
          ✦
        </span>
      ))}

      {/* Background glow behind card */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Trophy drop-in */}
      <div style={{ animation: "trophy-drop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <span className="text-5xl select-none" role="img" aria-label="trophy">🏆</span>
      </div>

      {/* Champion label */}
      <div className="flex flex-col items-center gap-1" style={{ animation: "slide-up 0.5s 0.2s ease-out both", opacity: 0 }}>
        <p className="text-xs font-black tracking-[0.3em] uppercase text-amber-400/80">
          {t("champion.heading")}
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent leading-tight">
          {photo.label ?? "Winner"}
        </h1>
      </div>

      {/* Floating card */}
      <div
        className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden"
        style={{
          animation: "float 4s ease-in-out infinite, pulse-glow-gold 2s ease-in-out infinite",
          border: "3px solid rgba(251,191,36,0.7)",
        }}
      >
        <Image
          src={photo.url}
          alt={photo.label ?? "Champion"}
          fill
          className="object-cover object-top"
          sizes="288px"
          priority
        />
        {/* Inner shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Play again button */}
      <button
        onClick={onRestart}
        className="relative group px-8 py-3 rounded-full font-black text-sm tracking-widest uppercase overflow-hidden bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-900/40 hover:shadow-rose-500/50 hover:scale-[1.04] active:scale-[0.98] transition-all duration-200"
        style={{ animation: "slide-up 0.5s 0.5s ease-out both", opacity: 0 }}
      >
        <span className="relative z-10">{t("champion.playAgain")}</span>
        {/* Shimmer on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute top-0 bottom-0 w-1/2 -skew-x-12 -translate-x-full group-hover:[animation:card-shimmer_0.6s_ease-in_forwards] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </button>
    </div>
  );
}
