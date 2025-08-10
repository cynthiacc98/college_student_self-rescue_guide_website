"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validators";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function LoginInner() {
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">登录</h1>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const res = await signIn("credentials", { ...values, callbackUrl, redirect: false });
          if (res?.ok) {
            window.location.href = callbackUrl;
          } else {
            toast.error(res?.error || "登录失败");
          }
        })}
      >
        <div>
          <label className="block text-sm mb-1">邮箱</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" autoComplete="email" autoFocus {...register("email")}/>
        </div>
        <div>
          <label className="block text-sm mb-1">密码</label>
          <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="******" autoComplete="current-password" {...register("password")}/>
        </div>
        <button disabled={isSubmitting} className="w-full px-4 py-2 rounded-md border bg-black text-white disabled:opacity-60">
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="text-sm text-neutral-600 mt-4">没有账号？<a href="/register" className="underline">注册</a></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
