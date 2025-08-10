"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b/0 bg-black/20">
      <div className="container-page py-3 flex items-center gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg">
          <span className="inline-block h-5 w-5 rounded-sm bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
          大学生自救指南
        </Link>
        <div className="flex-1" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const usp = new URLSearchParams();
            if (q) usp.set("q", q);
            router.push(`/search?${usp.toString()}`);
          }}
          className="hidden md:flex items-center gap-2 pl-3 pr-2 py-2 rounded-full border bg-white/95 text-black focus-within:ring-2"
        >
          <Search size={18} className="opacity-70" />
          <input
            className="outline-none w-64 bg-transparent"
            placeholder="搜索资料/标签/描述"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="search"
          />
          <button className="btn btn-primary text-xs px-3 py-1.5">搜索</button>
        </form>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="btn btn-ghost">
                  <LayoutDashboard size={16} /> 后台
                </Link>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut size={16} /> 退出
              </button>
            </>
          ) : (
            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`} className="btn btn-ghost">
              <LogIn size={16} /> 登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
