import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ResourcesManager, { AdminResource } from "@/components/admin/ResourcesManager";

export default async function AdminResourcesPage() {
  const resources = await prisma.resource.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, isPublic: true, createdAt: true } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">资料管理</h2>
        <Link href="/admin/resources/new" className="rounded-md border px-3 py-1.5 hover:bg-neutral-100">新建资料</Link>
      </div>
      <ResourcesManager initialResources={resources as unknown as AdminResource[]} />
    </div>
  );
}
