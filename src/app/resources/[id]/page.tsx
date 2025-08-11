export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const resource = await prisma.resource.findUnique({
    where: { id },
  });
  
  if (!resource) {
    return notFound();
  }

  // If resource is private and user is not admin, show not found
  if (!resource.isPublic && (!session || session.user.role !== "ADMIN")) {
    return notFound();
  }

  // If user is not logged in for a public resource, show login prompt
  if (!session) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">需要登录</h1>
          <p className="text-muted-foreground mb-6">请登录后查看资源详情</p>
          <Link 
            href={`/login?callbackUrl=/resources/${id}`}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 grid md:grid-cols-2 gap-8">
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
        <h1 className="text-2xl font-semibold">{resource.title}</h1>
        <p className="mt-3 text-neutral-700 whitespace-pre-line">{resource.description}</p>
        {resource.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {resource.tags.map((t: string) => (
              <span key={t} className="text-xs rounded-full border px-2 py-1 text-neutral-600">#{t}</span>
            ))}
          </div>
        ) : null}
        {resource.quarkLink && (
          <div className="mt-6">
            <Link
              href={`/api/resources/${resource.id}/click`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              打开夸克网盘链接（计次）
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
