import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/queries";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("locale") ?? "";
  const locale: Locale = (LOCALES as readonly string[]).includes(raw)
    ? (raw as Locale)
    : DEFAULT_LOCALE;

  const photos = await getLeaderboard(locale);
  return NextResponse.json(photos);
}
