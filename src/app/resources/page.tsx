export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ResourceCard from "@/components/ResourceCard";
import { Skeleton } from "@/components/Skeleton";

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

async function ResourceList() {
  // 获取资源数据（包含分类信息）
  const resources = await prisma.resource.findMany({
    where: { isPublic: true },
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
    orderBy: { createdAt: "desc" },
  });

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">暂无公开资料</p>
      </div>
    );
  }

  // 获取完整统计数据（与首页保持一致）
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

function ResourceListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[320px] rounded-2xl" />
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="container-fluid pb-12" style={{ paddingTop: "calc(var(--nav-h, 80px) + 32px)" }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">学习资料库</h1>
        <p className="text-foreground-muted">探索高质量的学习资源</p>
      </div>
      
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList />
      </Suspense>
    </div>
  );
}
