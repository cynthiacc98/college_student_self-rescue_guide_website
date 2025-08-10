import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { categorySchema } from "@/lib/validators";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const items = await prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const json = await req.json();
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });
  const { slug } = parsed.data;
  const exists = await prisma.category.findFirst({ where: { slug } });
  if (exists) return NextResponse.json({ error: "slug exists" }, { status: 409 });
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const doc = { ...parsed.data, createdAt: now, updatedAt: now };
  const result = await db.collection("Category").insertOne(doc);
  return NextResponse.json({ id: String(result.insertedId) });
}
