import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const client = await clientPromise;
  const db = client.db();
  if (email) {
    const user = await db.collection("users").findOne({ email });
    if (!user) return NextResponse.json({ ok: false, found: false });
    return NextResponse.json({ ok: true, found: true, user: { id: String(user._id), email: user.email, role: user.role } });
  }
  const items = await db.collection("users").find({}, { projection: { password: 0 } }).limit(5).toArray();
  return NextResponse.json({ ok: true, items: items.map(u => ({ id: String(u._id), email: u.email, role: u.role })) });
}
