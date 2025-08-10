"use client";

import { useState, type DragEvent, useCallback } from "react";
import { z } from "zod";
import { categorySchema, categoryUpdateSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const reorder = useCallback((fromId: string, toId: string) => {
    setCategories((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((c) => c.id === fromId);
      const toIndex = next.findIndex((c) => c.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  type CategoryInput = z.input<typeof categorySchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) });

  async function refresh() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (res.ok) setCategories(data.items);
  }

  async function create(values: CategoryInput) {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "创建失败");
    toast.success("创建成功");
    reset();
    setIsCreating(false);
    refresh();
  }

  async function update(id: string, values: Partial<Pick<Category, 'name'|'slug'|'description'> & { order?: number; isActive?: boolean }>) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "更新失败");
    toast.success("已更新");
    refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    return update(id, { isActive: !isActive });
  }

  async function remove(id: string) {
    if (!confirm("确定删除该分类？")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "删除失败");
    toast.success("已删除");
    refresh();
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }
  function handleDragOver(e: DragEvent<HTMLTableRowElement>, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    reorder(dragId, overId);
  }
  async function handleDragEnd() {
    if (!dragId) return;
    const ordered = categories.map((c, idx) => ({ id: c.id, order: idx }));
    setDragId(null);
    for (const { id, order } of ordered) {
      await update(id, { order });
    }
  }

  async function handleKeyReorder(id: string, direction: -1 | 1) {
    const idx = categories.findIndex((c) => c.id === id);
    const to = idx + direction;
    if (idx < 0 || to < 0 || to >= categories.length) return;
    const targetId = categories[to].id;
    reorder(id, targetId);
    const ordered = categories.map((c, i) => ({ id: c.id, order: i }));
    for (const { id: cid, order } of ordered) {
      await update(cid, { order });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">分类管理</h2>
        <button className="rounded-md border px-3 py-1.5 hover:bg-neutral-100" onClick={() => setIsCreating(true)}>
          新建分类
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-lg border p-4 bg-white">
            <form onSubmit={handleSubmit(create)} className="grid gap-3 md:grid-cols-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm mb-1">名称</label>
                <input className="w-full border rounded-md px-3 py-2" {...register("name")} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm mb-1">Slug</label>
                <input className="w-full border rounded-md px-3 py-2" {...register("slug")} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">描述</label>
                <input className="w-full border rounded-md px-3 py-2" {...register("description")} />
              </div>
              <div className="md:col-span-4 flex items-center gap-2">
                <button disabled={isSubmitting} className="px-4 py-2 rounded-md border bg-black text-white disabled:opacity-60">保存</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-md border">取消</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left p-3">名称</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">排序</th>
              <th className="text-left p-3">状态</th>
              <th className="text-right p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr
                key={c.id}
                className="border-t"
                draggable
                onDragStart={() => handleDragStart(c.id)}
                onDragOver={(e) => handleDragOver(e, c.id)}
                onDragEnd={handleDragEnd}
              >
                <td className="p-3">
                  <button
                    type="button"
                    aria-label="拖拽排序"
                    className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-neutral-100"
                    onKeyDown={async (e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        await handleKeyReorder(c.id, -1);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        await handleKeyReorder(c.id, 1);
                      }
                    }}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-neutral-600">{c.slug}</td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={c.order ?? 0}
                    className="w-20 border rounded px-2 py-1"
                    onBlur={ async (e) => {
                      const val = Number(e.currentTarget.value || 0);
                      await update(c.id, { order: val });
                    }}
                  />
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActive(c.id, c.isActive)} className="rounded-full px-3 py-1 border hover:bg-neutral-100">
                    {c.isActive ? "启用" : "停用"}
                  </button>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditingId(c.id)} className="rounded-md border px-3 py-1 hover:bg-neutral-100">编辑</button>
                  <button onClick={() => remove(c.id)} className="rounded-md border px-3 py-1 hover:bg-neutral-100">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingId && (
          <motion.div className="fixed inset-0 bg-black/30 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h3 className="text-lg font-semibold mb-4">编辑分类</h3>
              <CategoryEdit id={editingId} onClose={() => { setEditingId(null); refresh(); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryEdit({ id, onClose }: { id: string; onClose: () => void }) {
  type CategoryPatch = z.input<typeof categoryUpdateSchema>;
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CategoryPatch>({ resolver: zodResolver(categoryUpdateSchema) });
  async function submit(values: CategoryPatch) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "更新失败");
    toast.success("已更新");
    onClose();
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">名称</label>
        <input className="w-full border rounded-md px-3 py-2" {...register("name")} />
      </div>
      <div>
        <label className="block text-sm mb-1">Slug</label>
        <input className="w-full border rounded-md px-3 py-2" {...register("slug")} />
      </div>
      <div>
        <label className="block text-sm mb-1">描述</label>
        <input className="w-full border rounded-md px-3 py-2" {...register("description")} />
      </div>
      <div className="flex items-center gap-2 justify-end pt-2">
        <button type="button" onClick={onClose} className="rounded-md border px-3 py-2">取消</button>
        <button disabled={isSubmitting} className="rounded-md border bg-black text-white px-4 py-2 disabled:opacity-60">保存</button>
      </div>
    </form>
  );
}
