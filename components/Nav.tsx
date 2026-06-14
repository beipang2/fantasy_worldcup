"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export default function Nav() {
  const { t } = useLocale();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <Link href="/" className="text-xl font-black tracking-tight text-rose-500 hover:text-rose-400 transition-colors">
        &lt;Site Name&gt;
      </Link>
      <div className="flex gap-6 text-sm font-medium text-zinc-400">
        <Link href="/" className="hover:text-white transition-colors">{t("nav.vote")}</Link>
        <Link href="/leaderboard" className="hover:text-white transition-colors">{t("nav.leaderboard")}</Link>
      </div>
    </nav>
  );
}
