"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";

export interface ResourceCardProps {
  id: string;
  title: string;
  coverImageUrl?: string | null;
}

export default function ResourceCard({ id, title, coverImageUrl }: ResourceCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={prefersReduced ? undefined : { y: -2, boxShadow: "0 6px 24px rgba(0,0,0,0.08)" }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      className="group cursor-pointer select-none overflow-hidden rounded-xl border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      onClick={() => {
        if (!session?.user) {
          toast("请先登录", { icon: "🔒" });
          const callback = encodeURIComponent(`/resources/${id}`);
          router.push(`/login?callbackUrl=${callback}`);
          return;
        }
        router.push(`/resources/${id}`);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLDivElement).click();
      }}
    >
      <div className="aspect-[4/3] w-full bg-neutral-100 relative">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
            priority={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-neutral-400">无封面</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 group-hover:text-black">{title}</h3>
      </div>
    </motion.div>
  );
}
