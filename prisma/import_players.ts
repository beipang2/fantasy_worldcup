/**
 * Import FIFA 2026 World Cup players into the Photo table.
 * Reads from fifa_data/data/players.json — run extract_players.py first.
 *
 * Usage:
 *   npx ts-node --project tsconfig.seed.json prisma/import_players.ts
 *   npx ts-node --project tsconfig.seed.json prisma/import_players.ts --team usa
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PLAYERS_JSON = path.resolve(__dirname, "../../fifa_data/data/players.json");

interface Player {
  player_id: string;
  name: string;
  short_name: string;
  jersey: number;
  position: string;
  birth_date: string;
  team_slug: string;
  team_name: string;
  nationality: string;
  photo_url: string;
}

async function main() {
  const teamFilter = process.argv.includes("--team")
    ? process.argv[process.argv.indexOf("--team") + 1]
    : null;

  const players: Player[] = JSON.parse(fs.readFileSync(PLAYERS_JSON, "utf8"));
  const filtered = teamFilter ? players.filter((p) => p.team_slug === teamFilter) : players;

  console.log(`Importing ${filtered.length} players${teamFilter ? ` (${teamFilter})` : ""}…`);

  let inserted = 0;
  let skipped = 0;

  for (const p of filtered) {
    if (!p.photo_url) { skipped++; continue; }

    // Player names are proper nouns — same across all locales
    const labels = {
      en: p.name,
      fr: p.name,
      es: p.name,
      zh: p.name,
      ja: p.name,
    };

    await prisma.photo.upsert({
      where: { id: p.player_id },
      update: { url: p.photo_url, labels },
      create: { id: p.player_id, url: p.photo_url, labels },
    });

    inserted++;
    console.log(`  ✓ ${p.name} (${p.team_name})`);
  }

  console.log(`\nDone. ${inserted} inserted/updated, ${skipped} skipped (no photo).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
