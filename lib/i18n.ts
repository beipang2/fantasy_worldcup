export const LOCALES = ["en", "fr", "es", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  zh: "中文",
  ja: "日本語",
};

export async function getMessages(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default as typeof import("../messages/en.json");
}

export function resolveLabel(labels: unknown, locale: Locale): string | null {
  if (!labels || typeof labels !== "object" || Array.isArray(labels)) return null;
  const map = labels as Record<string, string>;
  return map[locale] ?? map.en ?? null;
}
