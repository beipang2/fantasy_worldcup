import { headers } from "next/headers";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  const preferred = accept.split(",")[0].split(";")[0].trim().slice(0, 2).toLowerCase();
  return (LOCALES as readonly string[]).includes(preferred)
    ? (preferred as Locale)
    : DEFAULT_LOCALE;
}
