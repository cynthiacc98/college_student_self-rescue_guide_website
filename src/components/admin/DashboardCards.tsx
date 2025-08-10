import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

export default async function DashboardCards() {
  const [resourceCount, categoryCount, userCount, topClicks] = await Promise.all([
    prisma.resource.count(),
    prisma.category.count(),
    (async () => {
      const client = await clientPromise;
      return client.db().collection("users").countDocuments();
    })(),
    (async () => {
      const client = await clientPromise;
      const db = client.db();
      const agg = await db.collection("ResourceStat").aggregate([
        { $sort: { clicks: -1 } },
        { $limit: 5 },
        { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
        { $unwind: "$res" },
        { $project: { _id: 0, title: "$res.title", clicks: 1 } },
      ]).toArray();
      return agg as Array<{ title: string; clicks: number }>;
    })(),
  ]);

  const cards = [
    { title: "学习资料", value: resourceCount, hint: "总数量" },
    { title: "分类", value: categoryCount, hint: "活跃分类" },
    { title: "用户", value: userCount, hint: "注册用户" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border shadow-sm p-5 bg-white/80 backdrop-blur">
            <div className="text-sm text-neutral-500">{c.title}</div>
            <div className="mt-2 text-3xl font-semibold">{c.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5 bg-white/80">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-800">热门资料（点击次数）</h3>
          <span className="text-xs text-neutral-500">Top 5</span>
        </div>
        <div className="mt-4 grid gap-3">
          {topClicks.length === 0 ? (
            <div className="text-sm text-neutral-500">暂无数据</div>
          ) : (
            topClicks.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[70%]">{t.title}</span>
                <span className="text-neutral-500">{t.clicks}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
