import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
