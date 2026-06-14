/**
 * Upload player headshots from fifa_data/data/photos/ to Vercel Blob,
 * then update the Photo.url in the DB to point to Blob URLs.
 *
 * Run AFTER import_players.ts.
 *
 * Before uploading, compares local photos against fifa_data/blob_snapshot.json
 * and deletes any blobs that no longer have a local file (freeing quota).
 * The snapshot is updated automatically after each run.
 *
 * Usage:
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/upload_photos.ts
 *   node node_modules/ts-node/dist/bin.js --project tsconfig.seed.json deployment/upload_photos.ts --team usa
 *
 * Requires in .env.local:
 *   DATABASE_URL=...
 *   BLOB_READ_WRITE_TOKEN=...
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put, del, list } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PHOTOS_DIR = path.resolve(__dirname, "../../fifa_data/data/photos");
const SNAPSHOT_PATH = path.resolve(__dirname, "../../fifa_data/blob_snapshot.json");

async function listAllBlobs(): Promise<{ url: string; pathname: string }[]> {
  const blobs: { url: string; pathname: string }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ cursor, limit: 1000 });
    blobs.push(...res.blobs.map((b) => ({ url: b.url, pathname: b.pathname })));
    cursor = res.cursor;
  } while (cursor);
  return blobs;
}

async function pruneDeletedLocally(teamFilter: string | null) {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.log("No blob snapshot found — skipping prune step.");
    return;
  }

  const snapshot: { url: string; pathname: string }[] = JSON.parse(
    fs.readFileSync(SNAPSHOT_PATH, "utf8")
  );

  const toDelete = snapshot.filter((b) => {
    if (!b.pathname.startsWith("players/")) return false;
    const parts = b.pathname.split("/"); // ["players", team, file]
    if (parts.length !== 3) return false;
    const [, team, file] = parts;
    if (teamFilter && team !== teamFilter) return false;
    return !fs.existsSync(path.join(PHOTOS_DIR, team, file));
  });

  if (toDelete.length === 0) {
    console.log("Nothing to prune.");
    return;
  }

  console.log(`\nPruning ${toDelete.length} blobs removed locally…`);
  for (const b of toDelete) {
    await del(b.url);
    console.log(`  🗑 ${b.pathname}`);
  }
}

async function main() {
  const teamFilter = process.argv.includes("--team")
    ? process.argv[process.argv.indexOf("--team") + 1]
    : null;

  await pruneDeletedLocally(teamFilter);

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
        allowOverwrite: true,
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

  // Refresh snapshot
  console.log("\nUpdating blob snapshot…");
  const allBlobs = await listAllBlobs();
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(allBlobs, null, 2));
  console.log(`Snapshot updated: ${allBlobs.length} blobs.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
