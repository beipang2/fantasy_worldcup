import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const photos = await prisma.photo.findMany({ select: { url: true } });
  return Response.json({ urls: photos.map((p) => p.url) });
}
