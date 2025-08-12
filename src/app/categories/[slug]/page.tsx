export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import ResourceCard from "@/components/ResourceCard";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";

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
      select: { 
        id: true, 
        title: true, 
        description: true, 
        coverImageUrl: true, 
        tags: true, 
        isPublic: true, 
        updatedAt: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
    }),
    prisma.resource.count({ where: { isPublic: true, categoryId: category.id } }),
  ]);

  if (resources.length === 0) {
    return (
      <div className="container-fluid pb-12" style={{ paddingTop: "calc(var(--nav-h, 80px) + 32px)" }}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          <p className="text-foreground-muted">该分类下暂无资料</p>
        </div>
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-4xl">📂</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">该分类暂无资料</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            试试其他分类，或者浏览全部资源
          </p>
          <a
            href="/resources"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            浏览全部资源
          </a>
        </div>
      </div>
    );
  }

  // 获取完整统计数据（与搜索页面和资料库页面保持一致）
  const client = await clientPromise;
  const db = client.db();
  const resourceIds = resources.map(r => r.id);

  // 并行获取所有统计数据
  const [resourceStats, favoriteStats] = await Promise.all([
    // 获取浏览量和下载量统计
    db.collection("ResourceStat").find({
      resourceId: { $in: resourceIds }
    }).toArray(),
    
    // 获取收藏数统计
    db.collection('UserFavorites').aggregate([
      { $match: { resourceId: { $in: resourceIds } } },
      { $group: { _id: "$resourceId", count: { $sum: 1 } } }
    ]).toArray()
  ]);

  // 创建统计映射
  const statsMap = new Map(resourceStats.map(s => [s.resourceId, s]));
  const favoriteMap = new Map(favoriteStats.map(f => [f._id, f.count]));

  // 构建带完整统计数据的资源列表
  const resourcesWithStats = resources.map((resource) => {
    const stats = statsMap.get(resource.id);
    const favoriteCount = favoriteMap.get(resource.id) || 0;
    
    return {
      ...resource,
      updatedAt: resource.updatedAt.toISOString(),
      _count: {
        clicks: stats?.downloads || 0,     // 下载次数
        views: stats?.views || 0,          // 浏览次数  
        favorites: favoriteCount           // 收藏次数
      }
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container-fluid pb-12" style={{ paddingTop: "calc(var(--nav-h, 80px) + 32px)" }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
        <p className="text-foreground-muted">探索 "{category.name}" 分类下的高质量学习资源</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resourcesWithStats.map((resource, index) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource}
            index={index} 
          />
        ))}
      </div>
      
      {/* 分页导航 */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <a 
            className={`px-4 py-2 rounded-lg border transition-all ${
              page <= 1 
                ? "pointer-events-none opacity-50 bg-white/5 border-white/10 text-gray-500" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`} 
            href={page > 1 ? `?page=${page - 1}` : '#'}
          >
            上一页
          </a>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">第</span>
            <span className="px-3 py-1 bg-brand-gradient text-white rounded-lg font-semibold">{page}</span>
            <span className="text-sm text-gray-400">/ {totalPages} 页</span>
          </div>
          <a 
            className={`px-4 py-2 rounded-lg border transition-all ${
              page >= totalPages 
                ? "pointer-events-none opacity-50 bg-white/5 border-white/10 text-gray-500" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`} 
            href={page < totalPages ? `?page=${page + 1}` : '#'}
          >
            下一页
          </a>
        </div>
      )}
    </div>
  );
}
