export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import ResourceCard from "@/components/ResourceCard";
import clientPromise from "@/lib/mongodb";

type SearchWhere = {
  isPublic: boolean;
  OR?: Array<{ title?: { contains: string }; description?: { contains: string }; tags?: { has: string } }>;
  categoryId?: string;
};

interface ResourceWithStats {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  isPublic: boolean;
  updatedAt: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  _count?: {
    clicks?: number;    // 下载次数
    views?: number;     // 浏览次数
    favorites?: number; // 收藏次数
  };
}

async function SearchResult({ q, category, page }: { q?: string; category?: string; page: number; }) {
  const where: SearchWhere = { isPublic: true };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { has: q } },
    ];
  }
  if (category) where.categoryId = category;

  const take = 12;
  const skip = (page - 1) * take;

  // 获取搜索结果（包含分类信息）
  const resources = await prisma.resource.findMany({
    where, 
    orderBy: { createdAt: "desc" }, 
    skip, 
    take,
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
    }
  });

  if (resources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">没有找到相关资源</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          试试其他关键词，或者浏览我们的资料库
        </p>
        <a
          href="/resources"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          浏览全部资源
        </a>
      </div>
    );
  }

  // 获取完整统计数据（与资料库页面保持一致）
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

  // 构建带统计数据的资源列表
  const resourcesWithStats: ResourceWithStats[] = resources.map((resource) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resourcesWithStats.map((resource, index) => (
        <ResourceCard 
          key={resource.id} 
          resource={resource}
          index={index} 
        />
      ))}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3"><Skeleton className="h-4 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; page?: string }> }) {
  const { q, category, page } = await searchParams;
  const pageNum = Math.max(1, Number(page || 1));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-4">
      <h1 className="text-xl font-semibold">搜索结果</h1>
      <Suspense fallback={<SearchSkeleton />}> 
        {/* Async Server Component */}
        <SearchResult q={q} category={category} page={pageNum} />
      </Suspense>
    </div>
  );
}
