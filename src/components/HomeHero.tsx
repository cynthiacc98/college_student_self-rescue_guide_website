"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-72 w-[120vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 blur-3xl opacity-20" />
      </div>
      <div className="container-page py-16 md:py-24">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
          大学生自救指南
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mt-4 text-muted max-w-2xl text-foreground/80">
          高质量学习资料分享与检索平台：更快找到、更可信、更便捷。
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8 flex gap-3">
          <Link href="/search" className="btn btn-primary">立即搜索</Link>
          <Link href="/categories" className="btn btn-ghost">浏览分类</Link>
          <Link href="/resources" className="btn btn-ghost">所有资料</Link>
        </motion.div>
      </div>
    </section>
  );
}
