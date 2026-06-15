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
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl select-none" role="img" aria-label="trophy">🏆</span>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
          {messages.leaderboard.title}
        </h1>
      </div>
      {photos.length === 0 ? (
        <p className="text-zinc-600 text-sm">{messages.leaderboard.empty}</p>
      ) : (
        <Leaderboard photos={photos} />
      )}
    </div>
  );
}
