/**
 * Upload player headshots from fifa_data/data/photos/ to Vercel Blob,
 * then update the Photo.url in the DB to point to Blob URLs.
 *
 * Run AFTER import_players.ts.
 *
 * Usage:
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/upload_photos.ts
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/upload_photos.ts --team usa
 *
 * Requires in .env.local:
 *   DATABASE_URL=...
 *   BLOB_READ_WRITE_TOKEN=...
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PHOTOS_DIR = path.resolve(__dirname, "../../fifa_data/data/photos");

async function main() {
  const teamFilter = process.argv.includes("--team")
    ? process.argv[process.argv.indexOf("--team") + 1]
    : null;

  const teamDirs = fs
    .readdirSync(PHOTOS_DIR)
    .filter((d) => fs.statSync(path.join(PHOTOS_DIR, d)).isDirectory())
    .filter((d) => !teamFilter || d === teamFilter);

  let uploaded = 0;
  let skipped = 0;

  for (const team of teamDirs) {
    console.log(`\n${team.toUpperCase()}`);
    const teamDir = path.join(PHOTOS_DIR, team);
    const files = fs.readdirSync(teamDir).filter((f) => f.endsWith(".png"));

    for (const file of files) {
      const playerId = path.basename(file, ".png");
      const filePath = path.join(teamDir, file);

      // Check if already pointing to Blob
      const photo = await prisma.photo.findUnique({
        where: { id: playerId },
        select: { id: true, url: true },
      });

      if (!photo) { skipped++; continue; }
      if (photo.url.includes("blob.vercel-storage.com")) {
        console.log(`  ↩ ${playerId} already on Blob`);
        skipped++;
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const blob = await put(`players/${team}/${file}`, fileBuffer, {
        access: "public",
        contentType: "image/png",
      });

      await prisma.photo.update({
        where: { id: playerId },
        data: { url: blob.url },
      });

      console.log(`  ✓ ${playerId} → ${blob.url}`);
      uploaded++;
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${skipped} skipped.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
