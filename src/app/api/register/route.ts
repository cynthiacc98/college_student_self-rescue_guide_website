import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { registerSchema } from "@/lib/validators";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, name, password } = parsed.data;
    const client = await clientPromise;
    const db = client.db();

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const totalUsers = await db.collection("users").countDocuments();
    const role = totalUsers === 0 ? "ADMIN" : "USER";

    const hashed = await hash(password, 10);
    const result = await db.collection("users").insertOne({
      email,
      name,
      password: hashed,
      role,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: String(result.insertedId), role }, { status: 201 });
  } catch (e: unknown) {
    console.error("REGISTER_ERROR", e);
    const message = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
