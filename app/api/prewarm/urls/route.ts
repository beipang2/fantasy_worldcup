import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const photos = await prisma.photo.findMany({
    where: { redCards: 0 },
    select: { url: true },
  });
  return Response.json({ urls: photos.map((p) => p.url) });
}
