import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { photoId, card } = body as { photoId: string; card: "yellow" | "red" };

  if (!photoId || (card !== "yellow" && card !== "red")) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  await prisma.photo.update({
    where: { id: photoId },
    data: card === "yellow" ? { yellowCards: { increment: 1 } } : { redCards: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
