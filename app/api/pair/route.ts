import { NextRequest, NextResponse } from "next/server";
import { getPhotoPair } from "@/lib/queries";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("locale") ?? "";
  const locale: Locale = (LOCALES as readonly string[]).includes(raw)
    ? (raw as Locale)
    : DEFAULT_LOCALE;

  const pair = await getPhotoPair(locale);
  if (!pair) return NextResponse.json({ error: "Not enough photos" }, { status: 404 });

  return NextResponse.json({ a: pair[0], b: pair[1] });
}
