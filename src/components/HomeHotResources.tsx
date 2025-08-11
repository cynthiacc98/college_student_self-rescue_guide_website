import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";
import IntersectionReveal, { RevealStaggerChild } from "@/components/IntersectionReveal";

type HotResource = {
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
    clicks?: number;
  };
};


export default async function HomeHotResources() {
  let resources: HotResource[] = [];

  try {
    // 首先尝试获取有统计数据的热门资源
    const statsWithResources = await prisma.resourceStat.findMany({
      where: {
        clicks: { gt: 0 }
      },
      orderBy: { clicks: 'desc' },
      take: 8,
      select: {
        resourceId: true,
        clicks: true
      }
    });

    if (statsWithResources.length > 0) {
      const resourceIds = statsWithResources.map(s => s.resourceId);
      const clicksMap = new Map(statsWithResources.map(s => [s.resourceId, s.clicks]));
      
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
          updatedAt: true,
        },
      });

      resources = dbResources
        .map((r): HotResource => ({
          ...r,
          updatedAt: r.updatedAt.toISOString(),
          _count: { clicks: clicksMap.get(r.id) || 0 },
        }))
        .sort((a, b) => (b._count?.clicks ?? 0) - (a._count?.clicks ?? 0));
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
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });
      
      resources = latestResources.map((r): HotResource => ({
        ...r,
        updatedAt: r.updatedAt.toISOString(),
        _count: { clicks: 0 },
      }));
    } catch (error) {
      console.error("获取最新资源失败:", error);
    }
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">暂无热门资料</p>
      </div>
    );
  }

  return (
    <IntersectionReveal
      direction="up"
      timing="medium"
      enableStagger={true}
      staggerChildren={0.1}
      threshold={0.1}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resources.map((resource, index) => (
          <RevealStaggerChild 
            key={resource.id}
            direction="up"
            distance={50}
          >
            <ResourceCard resource={resource} index={index} />
          </RevealStaggerChild>
        ))}
      </div>
    </IntersectionReveal>
  );
}
