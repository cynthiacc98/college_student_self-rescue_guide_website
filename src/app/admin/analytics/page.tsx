export const dynamic = "force-dynamic";

import AdvancedAnalytics from "@/components/admin/AdvancedAnalytics";
import { requireAdminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { Db } from "mongodb";

interface AnalyticsData {
  resourceStats: {
    total: number;
    public: number;
    private: number;
    totalClicks: number;
    weeklyGrowth: number;
  };
  userStats: {
    total: number;
    admins: number;
    users: number;
    newThisMonth: number;
    monthlyGrowth: number;
  };
  categoryStats: {
    total: number;
    active: number;
  };
  topResources: Array<{
    id: string;
    title: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  trends: {
    dailyClicks: Array<{ date: string; clicks: number }>;
    weeklyUsers: Array<{ week: string; users: number }>;
    categoryGrowth: Array<{ name: string; resourceCount: number; growthRate: number }>;
  };
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const client = await clientPromise;
  const db = client.db();
  
  // 资源统计
  const resourceStats = {
    total: await prisma.resource.count(),
    publicCount: await prisma.resource.count({ where: { isPublic: true } }),
    weeklyGrowth: 0 // 需要历史数据计算增长率
  };

  // 获取总点击次数
  const clickStatsResult = await db.collection("ResourceStat").aggregate([
    {
      $group: {
        _id: null,
        totalClicks: { $sum: "$clicks" }
      }
    }
  ]).toArray();

  const clickStats = {
    total: clickStatsResult[0]?.totalClicks || 0,
    publicResourceCount: resourceStats.publicCount
  };

  // 一周前的资源数量（模拟计算增长率）
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const resourcesLastWeek = await prisma.resource.count({
    where: { createdAt: { lt: oneWeekAgo } }
  });
  const weeklyGrowth = resourcesLastWeek > 0 ? 
    Math.round(((resourceStats.total - resourcesLastWeek) / resourcesLastWeek) * 100) : 0;

  // 用户统计
  const [userTotal, adminCount, userCount] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("users").countDocuments({ role: "ADMIN" }),
    db.collection("users").countDocuments({ role: "USER" })
  ]);

  // 本月新用户
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = await db.collection("users").countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  // 上月用户数量（模拟计算增长率）
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  const usersLastMonth = await db.collection("users").countDocuments({
    createdAt: { $lt: startOfMonth }
  });
  const monthlyGrowth = usersLastMonth > 0 ? 
    Math.round(((newThisMonth) / usersLastMonth) * 100) : 0;

  // 分类统计
  const [categoryTotal, activeCategories] = await Promise.all([
    prisma.category.count(),
    prisma.category.count()
  ]);

  // 热门资源（与仪表盘逻辑一致）
  const topResources = await db.collection("ResourceStat").aggregate([
    { $sort: { clicks: -1 } },
    { $limit: 5 },
    { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
    { $unwind: "$res" },
    { $project: { _id: 0, title: "$res.title", clicks: 1 } },
  ]).toArray() as Array<{ title: string; clicks: number; }>;

  // 最近活动
  const recentResources = await prisma.resource.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { title: true, createdAt: true }
  });

  const recentUsers = await db.collection("users").find({})
    .sort({ createdAt: -1 })
    .limit(2)
    .toArray();

  const recentActivity = [
    ...recentResources.map(r => ({
      type: "resource",
      description: `新增资源：${r.title}`,
      timestamp: r.createdAt
    })),
    ...recentUsers.map(u => ({
      type: "user",
      description: `新用户注册：${u.name || u.email}`,
      timestamp: u.createdAt || new Date()
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  // 分类增长率  
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  
  const categoryGrowth = await Promise.all(
    categories.map(async (cat) => {
      const resourceCount = await prisma.resource.count({
        where: { categoryId: cat.id }
      });
      return {
        name: cat.name,
        resourceCount,
        growthRate: 0 // 实际增长率需要历史数据计算，这里暂时设为0
      };
    })
  );

  // 趋势数据
  const trends = {
    // 真实每日点击趋势（最近7天）
    dailyClicks: await getDailyClicksTrend(db),
    
    // 真实每周用户增长（最近4周）
    weeklyUsers: await getWeeklyUserGrowth(db),
    
    categoryGrowth
  };

  return {
    resourceStats: {
      total: resourceStats.total,
      public: resourceStats.publicCount,
      private: resourceStats.total - resourceStats.publicCount,
      totalClicks: clickStats.total,
      weeklyGrowth
    },
    userStats: {
      total: userTotal,
      admins: adminCount,
      users: userCount,
      newThisMonth,
      monthlyGrowth
    },
    categoryStats: {
      total: categoryTotal,
      active: activeCategories
    },
    topResources: topResources as Array<{
      id: string;
      title: string;
      clicks: number;
    }>,
    recentActivity,
    trends
  };
}

// 获取每日点击趋势
async function getDailyClicksTrend(db: Db) {
  const dailyClicks = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 查询当天的点击统计
    const result = await db.collection("ResourceStat").aggregate([
      {
        $match: {
          updatedAt: {
            $gte: date,
            $lt: nextDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" }
        }
      }
    ]).toArray();
    
    dailyClicks.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      clicks: result[0]?.totalClicks || 0
    });
  }
  return dailyClicks;
}

// 获取每周用户增长
async function getWeeklyUserGrowth(db: Db) {
  const weeklyUsers = [];
  for (let i = 3; i >= 0; i--) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (i * 7));
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    // 查询当周新注册用户数
    const userCount = await db.collection("users").countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    weeklyUsers.push({
      week: `第${4-i}周`,
      users: userCount
    });
  }
  return weeklyUsers;
}

export default async function AnalyticsPage() {
  await requireAdminAuth("/admin/analytics");
    
  return <AdvancedAnalytics />;
}
