export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import Link from "next/link";
import Image from "next/image";

type SearchWhere = {
  isPublic: boolean;
  OR?: Array<{ title?: { contains: string }; description?: { contains: string }; tags?: { has: string } }>;
  categoryId?: string;
};

type ResourceListItem = { id: string; title: string; coverImageUrl: string | null };

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
  const items: ResourceListItem[] = await prisma.resource.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, title: true, coverImageUrl: true } });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((r: ResourceListItem) => (
        <Link key={r.id} href={`/resources/${r.id}`} className="group rounded-xl border bg-white overflow-hidden">
          <div className="relative aspect-[4/3]">
            {r.coverImageUrl ? (
              <Image src={r.coverImageUrl} alt={r.title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" />
            ) : (
              <div className="h-full w-full grid place-items-center text-neutral-400">无封面</div>
            )}
          </div>
          <div className="p-3 text-sm font-medium">{r.title}</div>
        </Link>
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
