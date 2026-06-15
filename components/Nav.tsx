"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";

export default function Nav() {
  const { t, locale } = useLocale();

  function switchLocale(next: string) {
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      {/* Logo */}
      <Link
        href="/"
        className="text-lg font-black tracking-tight bg-gradient-to-r from-rose-500 via-red-400 to-amber-400 bg-clip-text text-transparent hover:from-rose-400 hover:to-amber-300 transition-all duration-300 select-none"
      >
        {t("site.name")}
      </Link>

      {/* Right side links */}
      <div className="flex items-center gap-5 text-sm font-medium">
        <Link href="/" className="relative group text-zinc-400 hover:text-white transition-colors duration-200">
          {t("nav.vote")}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300" />
        </Link>
        <Link href="/leaderboard" className="relative group text-zinc-400 hover:text-white transition-colors duration-200">
          {t("nav.leaderboard")}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300" />
        </Link>
        <select
          value={locale}
          onChange={(e) => switchLocale(e.target.value)}
          className="bg-white/5 border border-white/10 text-zinc-400 text-xs rounded-lg px-2.5 py-1.5 outline-none hover:text-white hover:border-white/25 transition-all cursor-pointer"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l} className="bg-zinc-900">
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
