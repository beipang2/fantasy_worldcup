import { prisma } from "./db";
import { resolveLabel, type Locale } from "./i18n";

export type Photo = {
  id: string;
  url: string;
  label: string | null;
};

export type RankedPhoto = Photo & {
  rating: number;
  wins: number;
  losses: number;
};

function toPhoto(
  raw: { id: string; url: string; labels: unknown },
  locale: Locale
): Photo {
  return { id: raw.id, url: raw.url, label: resolveLabel(raw.labels, locale) };
}

export async function getPhotoPair(locale: Locale): Promise<[Photo, Photo] | null> {
  const photos = await prisma.photo.findMany({
    where: { hidden: false },
    select: { id: true, url: true, labels: true },
  });
  if (photos.length < 2) return null;
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  return [toPhoto(shuffled[0], locale), toPhoto(shuffled[1], locale)];
}

export async function getLeaderboard(locale: Locale): Promise<RankedPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { hidden: false },
    orderBy: { rating: "desc" },
    select: { id: true, url: true, labels: true, rating: true, wins: true, losses: true },
  });
  return photos.map((p) => ({ ...toPhoto(p, locale), rating: p.rating, wins: p.wins, losses: p.losses }));
}
