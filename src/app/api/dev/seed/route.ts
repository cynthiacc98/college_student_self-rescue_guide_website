import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    const categories = [
      { name: "高数", slug: "math", description: "高等数学" },
      { name: "英语四级", slug: "cet4", description: "CET-4" },
      { name: "计算机基础", slug: "cs-basics", description: "CS 基础" },
    ];

    for (const c of categories) {
      await db.collection("Category").updateOne(
        { slug: c.slug },
        {
          $set: {
            name: c.name,
            slug: c.slug,
            description: c.description,
            isActive: true,
            order: 0,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }

    const sampleResources = Array.from({ length: 8 }).map((_, i) => ({
      title: `示例资料 ${i + 1}`,
      slug: `sample-${i + 1}`,
      description: "这是一个用于演示的学习资料，包含示例描述与标签。",
      coverImageUrl: null as string | null,
      quarkLink: "https://pan.quark.cn/",
      tags: ["示例", "学习"],
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    }));

    for (const r of sampleResources) {
      await db.collection("Resource").updateOne(
        { slug: r.slug },
        {
          $set: {
            title: r.title,
            slug: r.slug,
            description: r.description,
            coverImageUrl: r.coverImageUrl,
            quarkLink: r.quarkLink,
            tags: r.tags,
            isPublic: true,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }

    const count = await db.collection("Resource").countDocuments();
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    console.error("SEED_ERROR", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
