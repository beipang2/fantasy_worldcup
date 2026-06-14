"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

type Messages = typeof import("../messages/en.json");

interface LocaleContextValue {
  locale: Locale;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: (key) => key,
});

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  function t(key: string): string {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      if (value == null || typeof value !== "object") return key;
      value = (value as Record<string, unknown>)[k];
    }
    return value != null ? String(value) : key;
  }

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
