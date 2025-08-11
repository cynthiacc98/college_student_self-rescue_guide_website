import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 并行获取各种统计数据
    const [
      totalResources,
      totalUsers,
      totalCategories,
      totalViews,
      totalClicks,
      totalLikes,
      recentResources,
      recentUsers,
      topCategories,
      recentActivities,
      popularResources,
      systemHealth
    ] = await Promise.all([
      // 资源总数
      db.collection("Resource").countDocuments({
        status: "ACTIVE",
        isPublic: true
      }),
      
      // 用户总数
      db.collection("users").countDocuments({
        status: "ACTIVE"
      }),
      
      // 分类总数
      db.collection("Category").countDocuments({
        isActive: true
      }),
      
      // 总浏览量
      db.collection("ResourceStat").aggregate([
        { $group: { _id: null, total: { $sum: "$views" } } }
      ]).toArray(),
      
      // 总点击量
      db.collection("ResourceStat").aggregate([
        { $group: { _id: null, total: { $sum: "$clicks" } } }
      ]).toArray(),
      
      // 总点赞数
      db.collection("ResourceStat").aggregate([
        { $group: { _id: null, total: { $sum: "$likes" } } }
      ]).toArray(),
      
      // 最近30天新增资源
      db.collection("Resource").countDocuments({
        status: "ACTIVE",
        isPublic: true,
        createdAt: { $gte: thirtyDaysAgo }
      }),
      
      // 最近30天新用户
      db.collection("users").countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),
      
      // 热门分类统计
      db.collection("Category").aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "Resource",
            let: { categoryId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$categoryId", "$$categoryId"] },
                  status: "ACTIVE",
                  isPublic: true
                }
              }
            ],
            as: "resources"
          }
        },
        {
          $addFields: {
            resourceCount: { $size: "$resources" }
          }
        },
        {
          $sort: { resourceCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            name: 1,
            slug: 1,
            resourceCount: 1,
            color: 1,
            iconUrl: 1
          }
        }
      ]).toArray(),
      
      // 最近活动（资源创建、用户注册等）
      db.collection("Resource").find({
        status: "ACTIVE",
        createdAt: { $gte: sevenDaysAgo }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ 
        title: 1, 
        createdAt: 1, 
        authorId: 1,
        categoryId: 1
      })
      .toArray(),
      
      // 热门资源（基于浏览量、点击量、点赞数综合排序）
      db.collection("ResourceStat").aggregate([
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: ["$views", 1] },
                { $multiply: ["$clicks", 3] },
                { $multiply: ["$likes", 5] }
              ]
            }
          }
        },
        { $sort: { score: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "Resource",
            localField: "resourceId",
            foreignField: "_id",
            as: "resource"
          }
        },
        { $unwind: "$resource" },
        {
          $match: {
            "resource.status": "ACTIVE",
            "resource.isPublic": true
          }
        },
        {
          $project: {
            resourceId: 1,
            views: 1,
            clicks: 1,
            likes: 1,
            score: 1,
            "resource.title": 1,
            "resource.slug": 1,
            "resource.coverImageUrl": 1,
            "resource.categoryId": 1
          }
        }
      ]).toArray(),
      
      // 系统健康状态
      Promise.all([
        db.collection("Resource").countDocuments({ status: "PENDING" }),
        db.collection("Resource").countDocuments({ status: "REJECTED" }),
        db.collection("users").countDocuments({ status: "INACTIVE" }),
        db.admin().serverStatus().then(status => ({
          connections: status.connections?.current || 0,
          uptime: status.uptime || 0
        })).catch(() => ({ connections: 0, uptime: 0 }))
      ])
    ]);

    // 计算增长率（与上个月对比）
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const lastMonthResources = await db.collection("Resource").countDocuments({
      status: "ACTIVE",
      isPublic: true,
      createdAt: { $gte: twoMonthsAgo, $lt: thirtyDaysAgo }
    });
    
    const lastMonthUsers = await db.collection("users").countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: thirtyDaysAgo }
    });

    const resourceGrowthRate = lastMonthResources > 0 
      ? ((recentResources - lastMonthResources) / lastMonthResources * 100).toFixed(1)
      : "0";
      
    const userGrowthRate = lastMonthUsers > 0
      ? ((recentUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : "0";

    // 获取每日活跃数据（最近7天）
    const dailyStats = await db.collection("UserActivity").aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            }
          },
          views: { $sum: { $cond: [{ $eq: ["$action", "VIEW"] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$action", "CLICK"] }, 1, 0] } },
          uniqueUsers: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          views: 1,
          clicks: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();

    // 处理系统健康数据
    const [pendingResources, rejectedResources, inactiveUsers, serverStatus] = systemHealth;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalResources,
          totalUsers,
          totalCategories,
          totalViews: totalViews[0]?.total || 0,
          totalClicks: totalClicks[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0
        },
        growth: {
          recentResources,
          recentUsers,
          resourceGrowthRate: parseFloat(resourceGrowthRate),
          userGrowthRate: parseFloat(userGrowthRate)
        },
        topCategories: topCategories.map(category => ({
          ...category,
          percentage: totalResources > 0 
            ? ((category.resourceCount / totalResources) * 100).toFixed(1)
            : "0"
        })),
        popularResources: await Promise.all(
          popularResources.map(async (item) => {
            const category = item.resource.categoryId 
              ? await db.collection("Category").findOne({ _id: new ObjectId(item.resource.categoryId) })
              : null;
            
            return {
              id: item.resourceId,
              title: item.resource.title,
              slug: item.resource.slug,
              coverImageUrl: item.resource.coverImageUrl,
              views: item.views,
              clicks: item.clicks,
              likes: item.likes,
              score: item.score,
              category: category ? {
                name: category.name,
                color: category.color
              } : null
            };
          })
        ),
        recentActivities: await Promise.all(
          recentActivities.map(async (activity) => {
            const [author, category] = await Promise.all([
              activity.authorId 
                ? db.collection("users").findOne({ _id: new ObjectId(activity.authorId) })
                : null,
              activity.categoryId
                ? db.collection("Category").findOne({ _id: new ObjectId(activity.categoryId) })
                : null
            ]);

            return {
              type: "resource_created",
              title: activity.title,
              createdAt: activity.createdAt,
              author: author ? author.name : "Unknown",
              category: category ? category.name : "Uncategorized"
            };
          })
        ),
        dailyStats,
        systemHealth: {
          pendingResources,
          rejectedResources,
          inactiveUsers,
          connections: serverStatus.connections,
          uptime: serverStatus.uptime
        }
      }
    });

  } catch (error) {
    console.error("DASHBOARD_STATS_ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "获取统计数据失败",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}