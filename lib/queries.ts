import { prisma } from "./db";
import { resolveLabel, type Locale } from "./i18n";

export type Photo = {
  id: string;
  url: string;
  label: string | null;
  position: string | null;
  nationality: string | null;
  heightCm: number | null;
  birthDate: string | null;
  overallRating: number | null;
};

export type RankedPhoto = Photo & {
  rating: number;
  wins: number;
  losses: number;
};

function toPhoto(
  raw: { id: string; url: string; labels: unknown; position?: string | null; nationality?: string | null; heightCm?: number | null; birthDate?: string | null; overallRating?: number | null },
  locale: Locale
): Photo {
  return {
    id: raw.id,
    url: raw.url,
    label: resolveLabel(raw.labels, locale),
    position: raw.position ?? null,
    nationality: raw.nationality ?? null,
    heightCm: raw.heightCm ?? null,
    birthDate: raw.birthDate ?? null,
    overallRating: raw.overallRating ?? null,
  };
}

export async function getPhotoPair(locale: Locale): Promise<[Photo, Photo] | null> {
  const photos = await prisma.photo.findMany({
    where: { hidden: false, excluded: false },
    select: { id: true, url: true, labels: true, position: true, nationality: true, heightCm: true, birthDate: true, overallRating: true },
  });
  if (photos.length < 2) return null;
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  return [toPhoto(shuffled[0], locale), toPhoto(shuffled[1], locale)];
}

export async function getLeaderboard(locale: Locale): Promise<RankedPhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { hidden: false, excluded: false },
    orderBy: { rating: "desc" },
    select: { id: true, url: true, labels: true, rating: true, wins: true, losses: true, position: true, nationality: true, heightCm: true, birthDate: true, overallRating: true },
  });
  return photos.map((p) => ({ ...toPhoto(p, locale), rating: p.rating, wins: p.wins, losses: p.losses }));
}
