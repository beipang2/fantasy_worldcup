import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getLeaderboard } from "@/lib/queries";
import Leaderboard from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const photos = await getLeaderboard(locale);

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-4xl font-black tracking-tight">{messages.leaderboard.title}</h1>
      {photos.length === 0 ? (
        <p className="text-zinc-500">{messages.leaderboard.empty}</p>
      ) : (
        <Leaderboard photos={photos} />
      )}
    </div>
  );
}
