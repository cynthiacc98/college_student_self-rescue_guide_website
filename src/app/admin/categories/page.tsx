import { prisma } from "@/lib/prisma";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { requireAdminAuth } from "@/lib/admin-auth";

export default async function AdminCategoriesPage() {
  await requireAdminAuth("/admin/categories");
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return <CategoriesManager initialCategories={categories} />;
}
