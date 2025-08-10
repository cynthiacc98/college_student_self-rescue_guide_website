"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { resourceSchema } from "@/lib/validators";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NewResourcePage() {
  const router = useRouter();
  type FormValues = z.input<typeof resourceSchema>;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { tags: [], isPublic: true },
  });

  const submit: SubmitHandler<FormValues> = async (values) => {
    const parsed = resourceSchema.safeParse(values);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "表单校验失败";
      toast.error(firstError);
      return;
    }
    const res = await fetch("/api/admin/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "创建失败");
    toast.success("创建成功");
    router.push(`/admin/resources/${data.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-xl font-semibold mb-4">新建资料</h2>
      <form onSubmit={handleSubmit(submit)} className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm mb-1">标题</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("title")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("slug")} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">描述</label>
          <textarea className="w-full border rounded-md px-3 py-2 min-h-32" {...register("description")} />
        </div>
        <div>
          <label className="block text-sm mb-1">封面 URL</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("coverImageUrl")} />
        </div>
        <div>
          <label className="block text-sm mb-1">夸克链接</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("quarkLink")} />
        </div>
        <div>
          <label className="block text-sm mb-1">标签（逗号分隔）</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("tags", { setValueAs: (v) => typeof v === 'string' ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} />
        </div>
        <div>
          <label className="block text-sm mb-1">分类ID（可选）</label>
          <input className="w-full border rounded-md px-3 py-2" {...register("categoryId")} />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" {...register("isPublic")} /> 公开</label>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => history.back()} className="rounded-md border px-4 py-2">返回</button>
          <button disabled={isSubmitting} className="rounded-md border bg-black text-white px-4 py-2 disabled:opacity-60">保存</button>
        </div>
      </form>
    </motion.div>
  );
}
