import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";

export default async function EditResourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdminAuth("/admin/resources");
  const { id } = await params;
  const sp = await searchParams;
  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!resource) return <div>不存在</div>;
  const action = `/api/admin/resources/${resource.id}`;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">编辑资料</h2>
      {sp.saved === "1" && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700">已保存</div>}
      <form action={action} method="post" className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="_method" value="PATCH" />
        <div>
          <label className="block text-sm mb-1">标题</label>
          <input className="w-full border rounded-md px-3 py-2" name="title" defaultValue={resource.title} />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input className="w-full border rounded-md px-3 py-2" name="slug" defaultValue={resource.slug} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">描述</label>
          <textarea className="w-full border rounded-md px-3 py-2 min-h-32" name="description" defaultValue={resource.description || ""} />
        </div>
        <div>
          <label className="block text-sm mb-1">封面 URL</label>
          <input className="w-full border rounded-md px-3 py-2" name="coverImageUrl" defaultValue={resource.coverImageUrl || ""} />
        </div>
        <div>
          <label className="block text-sm mb-1">夸克链接</label>
          <input className="w-full border rounded-md px-3 py-2" name="quarkLink" defaultValue={resource.quarkLink} />
        </div>
        <div>
          <label className="block text-sm mb-1">标签（逗号分隔）</label>
          <input className="w-full border rounded-md px-3 py-2" name="tags" defaultValue={(resource.tags || []).join(",")} />
        </div>
        <div>
          <label className="block text-sm mb-1">分类（可选）</label>
          <select className="w-full border rounded-md px-3 py-2" name="categoryId" defaultValue={resource.categoryId || ""}>
            <option value="">无分类</option>
            {categories.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" defaultChecked={resource.isPublic} /> 公开
          </label>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Link href="/admin/resources" className="rounded-md border px-4 py-2">返回</Link>
          <button className="rounded-md border bg-black text-white px-4 py-2">保存</button>
        </div>
      </form>
    </div>
  );
}
