import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { resourceUpdateSchema } from "@/lib/validators";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function patchData(id: string, data: unknown) {
  const parsed = resourceUpdateSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  const updateDoc: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (Object.prototype.hasOwnProperty.call(parsed.data, "categoryId")) {
    const val = (parsed.data as Record<string, unknown>)["categoryId"] as string | null | undefined;
    updateDoc["categoryId"] = val == null ? null : new ObjectId(val);
  }
  await db.collection("Resource").updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
  return NextResponse.json({ id });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const { id } = await ctx.params;
  const body = await req.json();
  return patchData(id, body);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const { id } = await ctx.params;
  const form = await req.formData();
  const method = form.get("_method");
  if (method === "PATCH") {
    const data: Record<string, string | boolean> = {};
    for (const [k, v] of form.entries()) {
      if (k === "_method") continue;
      if (k === "isPublic") data[k] = true;
      else data[k] = String(v);
    }
    const updateData = {
      title: typeof data.title === "string" ? data.title : undefined,
      slug: typeof data.slug === "string" ? data.slug : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      coverImageUrl: typeof data.coverImageUrl === "string" && data.coverImageUrl !== "" ? data.coverImageUrl : null,
      quarkLink: typeof data.quarkLink === "string" ? data.quarkLink : undefined,
      categoryId: typeof data.categoryId === "string" && data.categoryId !== "" ? (data.categoryId as string) : null,
      isPublic: typeof data.isPublic === "boolean" ? data.isPublic : undefined,
      tags: typeof data.tags === "string" ? (data.tags as string).split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };
    await patchData(id, updateData);
    // If form submission, redirect back to edit page with success flag
    return NextResponse.redirect(new URL(`/admin/resources/${id}?saved=1`, req.url));
  }
  if (method === "DELETE") {
    const client = await clientPromise;
    const db = client.db();
    await db.collection("Resource").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.redirect(new URL("/admin/resources", req.url));
  }
  return NextResponse.json({ error: "unsupported" }, { status: 400 });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbid = await requireAdmin();
  if (forbid) return forbid;
  const { id } = await ctx.params;
  const client = await clientPromise;
  const db = client.db();
  await db.collection("Resource").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
