import type { Metadata } from "next";
import { Geist, Noto_Sans_SC, Noto_Sans_JP } from "next/font/google";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { LocaleProvider } from "@/components/LocaleProvider";
import Nav from "@/components/Nav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "700", "900"] });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700", "900"] });

function fontClass(locale: string) {
  if (locale === "zh") return notoSansSC.className;
  if (locale === "ja") return notoSansJP.className;
  return geist.className;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    title: messages.site.title,
    description: messages.site.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className="h-full">
      <body className={`${fontClass(locale)} min-h-full flex flex-col antialiased`}>
        <LocaleProvider locale={locale} messages={messages}>
          <Nav />
          <main className="flex-1 flex flex-col items-center py-10 px-4">{children}</main>
          <footer className="text-center text-zinc-600 text-xs py-5 border-t border-white/5">
            <span className="bg-gradient-to-r from-rose-500/60 to-amber-400/60 bg-clip-text text-transparent font-semibold">
              {messages.site.name}
            </span>
            {" "}&copy; {new Date().getFullYear()}
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
