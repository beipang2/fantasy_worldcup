import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeNewRatings } from "@/lib/elo";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const { photoAId, photoBId, winnerId } = body as {
    photoAId: string;
    photoBId: string;
    winnerId: string;
  };

  if (!photoAId || !photoBId || !winnerId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (winnerId !== photoAId && winnerId !== photoBId) {
    return NextResponse.json({ error: "Invalid winner" }, { status: 400 });
  }

  const [photoA, photoB] = await Promise.all([
    prisma.photo.findUnique({ where: { id: photoAId } }),
    prisma.photo.findUnique({ where: { id: photoBId } }),
  ]);

  if (!photoA || !photoB) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const winner: "A" | "B" = winnerId === photoAId ? "A" : "B";
  const { newA, newB } = computeNewRatings(photoA.rating, photoB.rating, winner);

  await prisma.$transaction([
    prisma.vote.create({
      data: { photoAId, photoBId, winnerId, ip },
    }),
    prisma.photo.update({
      where: { id: photoAId },
      data: {
        rating: newA,
        wins: winner === "A" ? { increment: 1 } : undefined,
        losses: winner === "B" ? { increment: 1 } : undefined,
      },
    }),
    prisma.photo.update({
      where: { id: photoBId },
      data: {
        rating: newB,
        wins: winner === "B" ? { increment: 1 } : undefined,
        losses: winner === "A" ? { increment: 1 } : undefined,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
