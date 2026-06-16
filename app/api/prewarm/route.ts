import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const preferredRegion = ["sin1", "hnd1"];

export async function GET() {
  const start = Date.now();
  const region = process.env.VERCEL_REGION ?? "unknown";

  const photos = await prisma.photo.findMany({ select: { url: true } });

  let fetched = 0;
  let errors = 0;

  for (let i = 0; i < photos.length; i += 20) {
    const batch = photos.slice(i, i + 20);
    await Promise.all(
      batch.map(async (p) => {
        try {
          await fetch(p.url, { method: "HEAD" });
          fetched++;
        } catch {
          errors++;
        }
      })
    );
  }

  return Response.json({ region, fetched, errors, durationMs: Date.now() - start });
}
