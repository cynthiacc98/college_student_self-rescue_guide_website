export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Types } from "mongoose";
import ResourceViewTracker from "@/components/ResourceViewTracker";
import ResourceActions from "@/components/ResourceActions";
import ResourceRating from "@/components/ResourceRating";
import ResourceComments from "@/components/ResourceComments";

// 检查字符串是否为有效的 MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // 根据 id 格式决定查询方式
  let resource;
  try {
    if (isValidObjectId(id)) {
      // 如果是有效的 ObjectId，按 id 查询
      resource = await prisma.resource.findUnique({
        where: { id },
      });
    } else {
      // 否则按 slug 查询
      resource = await prisma.resource.findUnique({
        where: { slug: id },
      });
    }
  } catch (error) {
    console.error("Resource query error:", error);
    return notFound();
  }
  
  if (!resource) {
    return notFound();
  }

  // If resource is private and user is not admin, show not found
  if (!resource.isPublic && (!session || session.user.role !== "ADMIN")) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* 浏览量统计组件 */}
      <ResourceViewTracker resourceId={resource.id} />
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden relative">
            {resource.coverImageUrl ? (
              <Image
                src={resource.coverImageUrl}
                alt={resource.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-neutral-400">无封面</div>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">{resource.title}</h1>
          <p className="mt-3 text-gray-300 whitespace-pre-line">{resource.description}</p>
          
          {/* 资源统计信息 */}
          <div className="mt-4 flex gap-4 text-sm text-gray-400">
            <span>📊 下载次数: {resource.downloadCount || 0}</span>
            <span>⭐ 评分: {resource.rating ? resource.rating.toFixed(1) : '暂无评分'}</span>
            <span>💬 评论: {resource.reviewCount || 0}</span>
            <span>❤️ 收藏: {resource.favoriteCount || 0}</span>
          </div>
          
          {/* 标签 */}
          {resource.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((t: string) => (
                <span key={t} className="text-xs rounded-full border border-white/20 px-2 py-1 text-gray-300 bg-white/5">#{t}</span>
              ))}
            </div>
          ) : null}
          
          {/* 资源操作按钮 */}
          <ResourceActions 
            resource={resource} 
            session={session}
            resourceId={resource.id}
          />
        </div>
      </div>

      {/* 评分组件 */}
      <div className="mt-8">
        <ResourceRating
          resourceId={resource.id}
          session={session}
          initialRating={resource.rating || 0}
          initialReviewCount={resource.reviewCount || 0}
        />
      </div>

      {/* 评论组件 */}
      <div className="mt-8">
        <ResourceComments
          resourceId={resource.id}
          session={session}
        />
      </div>
    </div>
  );
}
