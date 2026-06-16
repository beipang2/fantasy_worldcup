import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_secret")?.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await prisma.photo.findMany({
    where: { OR: [{ redCards: { gt: 0 } }, { yellowCards: { gt: 0 } }] },
    orderBy: [{ redCards: "desc" }, { yellowCards: "desc" }],
    select: { id: true, url: true, labels: true, redCards: true, yellowCards: true, excluded: true },
  });

  return NextResponse.json(photos);
}
