import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { categoryUpdateSchema } from "@/lib/validators";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection("Category").updateOne({ _id: new ObjectId(id) }, { $set: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ id });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const { id } = await ctx.params;
  const client = await clientPromise;
  const db = client.db();
  await db.collection("Resource").updateMany({ categoryId: id }, { $set: { categoryId: null } });
  await db.collection("Category").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
