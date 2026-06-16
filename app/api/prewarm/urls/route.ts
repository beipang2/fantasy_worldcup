import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const photos = await prisma.photo.findMany({
    where: { excluded: false },
    select: { url: true },
  });
  return Response.json({ urls: photos.map((p) => p.url) });
}
