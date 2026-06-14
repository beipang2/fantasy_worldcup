import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get("admin_secret")?.value === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const labelsRaw = form.get("labels") as string | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const labels = labelsRaw ? JSON.parse(labelsRaw) : null;
  const blob = await put(file.name, file, { access: "public" });
  const photo = await prisma.photo.create({ data: { url: blob.url, labels } });

  return NextResponse.json(photo);
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.photo.update({ where: { id }, data: { hidden: true } });
  return NextResponse.json({ ok: true });
}
