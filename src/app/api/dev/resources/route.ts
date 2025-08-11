import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const items = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, title: true, slug: true },
  });
  return NextResponse.json({ items });
}
