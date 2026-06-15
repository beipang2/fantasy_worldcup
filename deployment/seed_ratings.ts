/**
 * Assign deterministic overall ratings to all players.
 * Uses a hash of the player ID to produce consistent values in the 72–88 range.
 *
 * Usage:
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/seed_ratings.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/** Deterministic djb2 hash → 72–88 rating (World Cup players are elite). */
function hashRating(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h) ^ id.charCodeAt(i);
    h = h >>> 0;
  }
  return 72 + (h % 17); // range [72, 88]
}

async function main() {
  const photos = await prisma.photo.findMany({
    where: { overallRating: null },
    select: { id: true },
  });

  console.log(`Setting ratings for ${photos.length} players…`);

  for (const p of photos) {
    await prisma.photo.update({
      where: { id: p.id },
      data: { overallRating: hashRating(p.id) },
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
