import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getLeaderboard } from "@/lib/queries";
import TournamentView from "@/components/TournamentView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const photos = await getLeaderboard(locale);

  if (photos.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-3xl font-black text-zinc-600">{messages.vote.noPhotos}</p>
        <p className="text-zinc-500">{messages.vote.noPhotosDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-4xl font-black tracking-tight text-center">
        &lt;Tagline&gt;
      </h1>
      <TournamentView photos={photos} locale={locale} />
    </div>
  );
}
