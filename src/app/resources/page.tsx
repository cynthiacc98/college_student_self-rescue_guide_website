export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";

async function ResourcesList() {
  const items = await prisma.resource.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 24 });
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((r) => (
        <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl || undefined} />)
      )}
    </div>
  );
}

function ResourcesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3"><Skeleton className="h-4 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-4">
      <h1 className="text-xl font-semibold">所有资料</h1>
      <Suspense fallback={<ResourcesSkeleton />}> 
        {/* @ts-expect-error Async Server Component */}
        <ResourcesList />
      </Suspense>
    </div>
  );
}
