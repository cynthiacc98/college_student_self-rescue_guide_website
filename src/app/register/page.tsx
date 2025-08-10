"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validators";
import { z } from "zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">注册</h1>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          if (res.ok) {
            toast.success("注册成功，请登录");
            router.push("/login");
          } else {
            const data = await res.json().catch(() => ({}));
            toast.error(data.error || "注册失败");
          }
        })}
      >
        <div>
          <label className="block text-sm mb-1">邮箱</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" autoComplete="email" autoFocus {...register("email")}/>
        </div>
        <div>
          <label className="block text-sm mb-1">昵称</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="张三" autoComplete="name" {...register("name")}/>
        </div>
        <div>
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="******" autoComplete="new-password" {...register("password")}/>
        </div>
        <button disabled={isSubmitting} className="w-full px-4 py-2 rounded-md border bg-black text-white disabled:opacity-60">
          {isSubmitting ? "注册中..." : "注册"}
        </button>
      </form>
    </div>
  );
}
