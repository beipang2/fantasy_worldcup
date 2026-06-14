import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_secret")?.value === process.env.ADMIN_SECRET;
}

// GET — all photos including hidden, with optional ?team= filter
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await prisma.photo.findMany({
    orderBy: [{ hidden: "asc" }, { id: "asc" }],
    select: { id: true, url: true, labels: true, hidden: true, rating: true, wins: true, losses: true },
  });

  return NextResponse.json(photos);
}

// PATCH — toggle hidden status for one photo
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, hidden } = await req.json();
  const photo = await prisma.photo.update({ where: { id }, data: { hidden } });
  return NextResponse.json(photo);
}

// DELETE — permanently remove a photo from DB and Blob storage
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const photo = await prisma.photo.findUnique({ where: { id }, select: { url: true } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vote.deleteMany({ where: { OR: [{ photoAId: id }, { photoBId: id }] } });
  await prisma.photo.delete({ where: { id } });

  if (photo.url.includes("blob.vercel-storage.com")) {
    await del(photo.url);
  }

  return NextResponse.json({ ok: true });
}
