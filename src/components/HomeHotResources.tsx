import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import ResourceCard from "@/components/ResourceCard";

export default async function HomeHotResources() {
  const client = await clientPromise;
  const db = client.db();
  const top = await db
    .collection("ResourceStat")
    .aggregate([
      { $sort: { clicks: -1 } },
      { $limit: 8 },
      { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
      { $unwind: "$res" },
      { $match: { "res.isPublic": true } },
      { $project: { _id: 0, id: "$res._id", title: "$res.title", coverImageUrl: "$res.coverImageUrl" } },
    ])
    .toArray();

  let items: Array<{ id: string; title: string; coverImageUrl: string | null }>;
  if (top.length > 0) {
    items = top.map((t) => ({ id: String((t as any).id), title: (t as any).title, coverImageUrl: ((t as any).coverImageUrl as string | null) ?? null }));
  } else {
    items = await prisma.resource.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, coverImageUrl: true } });
  }

  if (items.length === 0) {
    return <p className="text-neutral-600">暂无公开资料</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((r) => (
        <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl} />
      ))}
    </div>
  );
}
