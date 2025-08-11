import { prisma } from "@/lib/prisma";
import NewResourceForm from "@/components/admin/NewResourceForm";
import { requireAdminAuth } from "@/lib/admin-auth";

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
}

export default async function NewResourcePage() {
  await requireAdminAuth("/admin/resources/new");

  const categories = await getCategories();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">新建资源</h1>
        <p className="text-muted-foreground">添加新的学习资源</p>
      </div>
      
      <NewResourceForm categories={categories} />
    </div>
  );
}
