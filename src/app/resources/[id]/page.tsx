export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=/resources/${id}`);
  }

  const resource = await prisma.resource.findUnique({
    where: { id },
  });
  if (!resource || (!resource.isPublic && session.user.role !== "ADMIN")) {
    return notFound();
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
        <div className="mt-6">
          <a
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-black text-white hover:bg-neutral-800"
            href={`/api/resources/${id}/click`}
            target="_blank"
            rel="noopener noreferrer"
          >
            打开夸克网盘链接（计次）
          </a>
        </div>
      </div>
    </div>
  );
}
