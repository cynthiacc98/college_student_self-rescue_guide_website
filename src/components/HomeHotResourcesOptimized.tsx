import { memo } from 'react';
import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";
import IntersectionRevealOptimized, { RevealStaggerChildOptimized } from "@/components/IntersectionRevealOptimized";

type HotResource = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  isPublic: boolean;
  updatedAt: string;
  rating?: number;      // 评分
  category?: {
    name: string;
    slug: string;
  } | null;
  _count?: {
    clicks?: number;    // 下载次数
    views?: number;     // 浏览次数
    favorites?: number; // 收藏次数
  };
};

// 性能优化：缓存查询结果
let cachedResources: HotResource[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function getHotResourcesOptimized(): Promise<HotResource[]> {
  // 检查缓存
  if (cachedResources && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedResources;
  }

  let resources: HotResource[] = [];

  try {
    // 使用MongoDB直接查询真实统计数据
    const client = await (await import("@/lib/mongodb")).default;
    const db = client.db();
    
    // 获取有真实浏览量的资源统计
    const statsWithResources = await db.collection('ResourceStat').find({
      $or: [
        { views: { $gt: 0 } },
        { downloads: { $gt: 0 } }
      ]
    })
    .sort({ views: -1, downloads: -1 }) // 优先按浏览量排序
    .limit(6)
    .toArray();

    if (statsWithResources.length > 0) {
      const resourceIds = statsWithResources.map(s => s.resourceId);
      const statsMap = new Map(statsWithResources.map(s => [s.resourceId, s]));
      
      // 获取对应的资源信息
      const dbResources = await prisma.resource.findMany({
        where: {
          id: { in: resourceIds },
          isPublic: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          tags: true,
          isPublic: true,
          rating: true,      // 包含评分
          updatedAt: true,
        },
      });

      // 获取收藏数统计
      const favoriteStats = await db.collection('UserFavorites').aggregate([
        { $match: { resourceId: { $in: resourceIds } } },
        { $group: { _id: "$resourceId", count: { $sum: 1 } } }
      ]).toArray();
      
      const favoriteMap = new Map(favoriteStats.map(f => [f._id, f.count]));

      resources = dbResources
        .map((r): HotResource => {
          const stats = statsMap.get(r.id);
          const favoriteCount = favoriteMap.get(r.id) || 0;
          return {
            ...r,
            updatedAt: r.updatedAt.toISOString(),
            _count: { 
              clicks: stats?.downloads || 0,  // 显示下载次数
              views: stats?.views || 0,       // 添加浏览次数
              favorites: favoriteCount        // 添加收藏次数
            },
          };
        })
        .sort((a, b) => {
          // 综合排序：浏览量 + 下载量*2 + 收藏*3
          const scoreA = (a._count?.views ?? 0) + (a._count?.clicks ?? 0) * 2 + (a._count?.favorites ?? 0) * 3;
          const scoreB = (b._count?.views ?? 0) + (b._count?.clicks ?? 0) * 2 + (b._count?.favorites ?? 0) * 3;
          return scoreB - scoreA;
        });
    }
  } catch (error) {
    console.error("获取热门资源失败:", error);
  }

  // 如果没有热门数据，回退到最新资源
  if (resources.length === 0) {
    try {
      const latestResources = await prisma.resource.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          tags: true,
          isPublic: true,
          rating: true,      // 包含评分
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      
      resources = latestResources.map((r): HotResource => ({
        ...r,
        updatedAt: r.updatedAt.toISOString(),
        _count: { clicks: 0, views: 0, favorites: 0 },
      }));
    } catch (error) {
      console.error("获取最新资源失败:", error);
    }
  }

  // 更新缓存
  cachedResources = resources;
  cacheTime = Date.now();
  
  return resources;
}

// 使用 memo 优化组件渲染
const HomeHotResourcesOptimized = memo(async function HomeHotResourcesOptimized() {
  const resources = await getHotResourcesOptimized();

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <p className="text-white/70 text-sm">暂无热门资料</p>
        </div>
      </div>
    );
  }

  return (
    <IntersectionRevealOptimized
      direction="up"
      timing="fast"
      enableStagger={true}
      staggerChildren={0.05}
      threshold={0.2}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <RevealStaggerChildOptimized 
            key={resource.id}
            direction="up"
            distance={20}
          >
            <ResourceCard resource={resource} index={index} />
          </RevealStaggerChildOptimized>
        ))}
      </div>
    </IntersectionRevealOptimized>
  );
});

export default HomeHotResourcesOptimized;