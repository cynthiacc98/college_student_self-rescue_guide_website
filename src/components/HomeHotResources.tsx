import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";
import clientPromise from "@/lib/mongodb";

type HotResource = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  isPublic: boolean;
  categoryId: string | null;
  quarkUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    name: string;
    slug: string;
  } | null;
  _count: {
    clicks: number;
  };
};

interface ResourceStat {
  resourceId: string;
  clicks: number;
}

export default async function HomeHotResources() {
  let resources: HotResource[] = [];

  try {
    // Try to get resources sorted by clicks
    const client = await clientPromise;
    const db = client.db();
    const stats = (await db
      .collection("ResourceStat")
      .find({ clicks: { $gt: 0 } })
      .sort({ clicks: -1 })
      .limit(8)
      .toArray()) as unknown as ResourceStat[];

    if (stats.length > 0) {
      const resourceIds = stats.map((s) => s.resourceId);
      const clicksMap = new Map(stats.map((s) => [s.resourceId, s.clicks]));
      
      const dbResources = await prisma.resource.findMany({
        where: {
          id: { in: resourceIds },
          isPublic: true,
        },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      resources = dbResources
        .map((r): HotResource => ({
          ...r,
          _count: { clicks: clicksMap.get(r.id) || 0 },
        }))
        .sort((a, b) => b._count.clicks - a._count.clicks);
    }
  } catch (error) {
    console.error("Failed to fetch hot resources:", error);
  }

  // Fallback to latest resources if no click data
  if (resources.length === 0) {
    const latestResources = await prisma.resource.findMany({
      where: { isPublic: true },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    
    resources = latestResources.map((r): HotResource => ({
      ...r,
      _count: { clicks: 0 },
    }));
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">暂无热门资料</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resources.map((resource, index) => (
        <ResourceCard key={resource.id} resource={resource} index={index} />
      ))}
    </div>
  );
}
