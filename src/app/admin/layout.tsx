import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const nav = [
    { href: "/admin", label: "仪表盘" },
    { href: "/admin/categories", label: "分类管理" },
    { href: "/admin/resources", label: "资料管理" },
  ];
  return (
    <div>
      <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">管理员后台</h1>
          <p className="text-white/80 mt-1 text-sm">管理分类、学习资料与平台基础数据</p>
          <div className="mt-4 flex gap-2">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-1.5 text-sm">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
