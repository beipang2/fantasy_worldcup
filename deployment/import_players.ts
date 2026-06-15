/**
 * Import FIFA 2026 World Cup players into the Photo table.
 * Reads from fifa_data/data/players.json — run extract_players.py first.
 *
 * Usage:
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/import_players.ts
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/import_players.ts --team usa
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PLAYERS_JSON =
  process.env.PLAYERS_JSON ||
  path.resolve(__dirname, "../../fifa_data/data/players.json");

interface Player {
  player_id: string;
  name: string;
  short_name: string;
  jersey: number;
  position: string;
  position_detail: string;
  birth_date: string;
  height_cm: number;
  weight_kg: number;
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

    const stats = {
      position: p.position || null,
      nationality: p.nationality || null,
      teamName: p.team_name || null,
      heightCm: p.height_cm ? Math.round(p.height_cm) : null,
      weightKg: p.weight_kg ? Math.round(p.weight_kg) : null,
      birthDate: p.birth_date || null,
      jersey: p.jersey ?? null,
    };

    await prisma.photo.upsert({
      where: { id: p.player_id },
      update: { url: p.photo_url, labels, ...stats },
      create: { id: p.player_id, url: p.photo_url, labels, ...stats },
    });

    inserted++;
    console.log(`  ✓ ${p.name} (${p.team_name})`);
  }

  console.log(`\nDone. ${inserted} inserted/updated, ${skipped} skipped (no photo).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
