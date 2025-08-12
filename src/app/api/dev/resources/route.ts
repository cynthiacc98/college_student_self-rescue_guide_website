import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  
  const url = new URL(request.url);
  const full = url.searchParams.get('full') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  
  const items = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: full ? {
      id: true,
      title: true,
      slug: true,
      description: true,
      quarkLink: true,
      fileSize: true,
      fileFormat: true,
      rating: true,
      downloadCount: true,
      tags: true,
      difficulty: true,
      createdAt: true
    } : {
      id: true,
      title: true,
      slug: true
    },
  });
  
  return NextResponse.json({ 
    items, 
    total: items.length,
    fullData: full
  });
}
