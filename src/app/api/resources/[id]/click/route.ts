import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const client = await clientPromise;
  const db = client.db();
  try {
    await db.collection("ResourceStat").updateOne(
      { resourceId: new ObjectId(id) },
      { $inc: { clicks: 1 }, $setOnInsert: { createdAt: new Date() }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    const resource = await db.collection("Resource").findOne({ _id: new ObjectId(id) });
    if (!resource) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.redirect(resource.quarkLink as string);
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
