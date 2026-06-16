import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_secret")?.value === process.env.ADMIN_SECRET;
}

// POST — toggle excluded status for one photo
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoId, excluded } = await req.json();
  await prisma.photo.update({ where: { id: photoId }, data: { excluded } });
  return NextResponse.json({ ok: true });
}
