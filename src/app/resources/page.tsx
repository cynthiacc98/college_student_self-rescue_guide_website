export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";
import { Skeleton } from "@/components/Skeleton";

async function ResourceList() {
  const resources = await prisma.resource.findMany({
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
  });

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">暂无公开资料</p>
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
    <div className="container-fluid py-8">
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
