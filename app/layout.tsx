import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { LocaleProvider } from "@/components/LocaleProvider";
import Nav from "@/components/Nav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "<Site Name>",
  description: "<Site description>",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className="h-full">
      <body className={`${geist.className} min-h-full flex flex-col bg-zinc-950 text-white antialiased`}>
        <LocaleProvider locale={locale} messages={messages}>
          <Nav />
          <main className="flex-1 flex flex-col items-center py-10">{children}</main>
          <footer className="text-center text-zinc-700 text-xs py-4 border-t border-zinc-900">
            &copy; {new Date().getFullYear()} &lt;Site Name&gt;
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
