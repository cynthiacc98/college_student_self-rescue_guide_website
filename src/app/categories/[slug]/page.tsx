export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ResourceCard from "@/components/ResourceCard";

export default async function CategoryDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><p className="text-neutral-600">分类不存在</p></div>;
  }

  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 24;
  const skip = (page - 1) * pageSize;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where: { isPublic: true, categoryId: category.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: { id: true, title: true, description: true, coverImageUrl: true, tags: true, isPublic: true, updatedAt: true },
    }),
    prisma.resource.count({ where: { isPublic: true, categoryId: category.id } }),
  ]);

  // 获取点击统计数据
  const client = await clientPromise;
  const db = client.db();
  const resourceIds = resources.map(r => new ObjectId(r.id));
  const resourceStats = await db.collection("ResourceStat").find({
    resourceId: { $in: resourceIds }
  }).toArray();
  
  // 创建点击统计映射
  const clicksMap = new Map();
  resourceStats.forEach((stat: any) => {
    clicksMap.set(stat.resourceId.toString(), stat.clicks || 0);
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">{category.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[200px]">
        {resources.map((r: { id: string; title: string; description: string | null; coverImageUrl: string | null; tags: string[]; isPublic: boolean; updatedAt: Date }, idx: number) => (
          <ResourceCard 
            key={r.id} 
            resource={{ 
              id: r.id, 
              title: r.title, 
              description: r.description, 
              coverImageUrl: r.coverImageUrl, 
              tags: r.tags ?? [], 
              isPublic: r.isPublic,
              updatedAt: r.updatedAt.toISOString(),
              _count: { clicks: clicksMap.get(r.id) || 0 },
            }} 
            index={idx} 
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a className={`px-3 py-1 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`?page=${page - 1}`}>上一页</a>
        <span className="text-sm text-neutral-600">第 {page} / {totalPages} 页</span>
        <a className={`px-3 py-1 rounded border ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={`?page=${page + 1}`}>下一页</a>
      </div>
    </div>
  );
}
