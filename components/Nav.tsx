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
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <Link href="/" className="text-xl font-black tracking-tight text-rose-500 hover:text-rose-400 transition-colors">
        {t("site.name")}
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
        <Link href="/" className="hover:text-white transition-colors">{t("nav.vote")}</Link>
        <Link href="/leaderboard" className="hover:text-white transition-colors">{t("nav.leaderboard")}</Link>
        <select
          value={locale}
          onChange={(e) => switchLocale(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-400 text-sm rounded-lg px-2 py-1 outline-none hover:border-zinc-500 focus:border-rose-500 transition-colors cursor-pointer"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
          ))}
        </select>
      </div>
    </nav>
  );
}
