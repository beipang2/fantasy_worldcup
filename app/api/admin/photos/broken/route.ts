import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_secret")?.value === process.env.ADMIN_SECRET;
}

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

// GET — returns IDs of active photos whose URL is unreachable
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await prisma.photo.findMany({
    where: { hidden: false },
    select: { id: true, url: true },
  });

  const BATCH = 20;
  const broken: string[] = [];

  for (let i = 0; i < photos.length; i += BATCH) {
    const batch = photos.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (p) => ({ id: p.id, ok: await isReachable(p.url) }))
    );
    for (const r of results) {
      if (!r.ok) broken.push(r.id);
    }
  }

  return NextResponse.json({ broken, total: photos.length });
}
