"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { resourceSchema } from "@/lib/validators";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
}

interface NewResourceFormProps {
  categories: Category[];
}

export default function NewResourceForm({ categories }: NewResourceFormProps) {
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
    const res = await fetch("/api/admin/resources", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(parsed.data) 
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "创建失败");
    toast.success("创建成功");
    router.push(`/admin/resources/${data.id}`);
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">资源标题</label>
            <input 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="输入资源标题"
              {...register("title")} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">URL Slug</label>
            <input 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="url-friendly-name"
              {...register("slug")} 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">资源描述</label>
            <textarea 
              className="w-full border rounded-md px-3 py-2 min-h-32 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="详细描述该学习资源的内容和特点"
              {...register("description")} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">封面图片 URL</label>
            <input 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="https://example.com/image.jpg"
              {...register("coverImageUrl")} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">下载链接</label>
            <input 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="夸克网盘或其他下载链接"
              {...register("quarkLink")} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">标签</label>
            <input 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="标签1, 标签2, 标签3"
              {...register("tags", { 
                setValueAs: (v) => typeof v === 'string' ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : [] 
              })} 
            />
            <p className="text-xs text-muted-foreground mt-1">使用逗号分隔多个标签</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            <select 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("categoryId")}
            >
              <option value="">请选择分类（可选）</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("isPublic")} className="rounded" /> 
              <span className="font-medium">设为公开</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">公开的资源将在前台展示给所有用户</p>
          </div>
          
          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button 
              disabled={isSubmitting} 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "创建中..." : "创建资源"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
