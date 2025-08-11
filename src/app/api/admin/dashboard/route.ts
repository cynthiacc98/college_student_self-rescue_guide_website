import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { requirePermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.ANALYTICS_READ);
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    
    // 计算时间范围
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[range] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const client = await clientPromise;
    const db = client.db();
    
    // 并行获取所有数据
    const [
      resourceCount,
      categoryCount,
      userCount,
      totalViews,
      totalClicks,
      activeUsers,
      todayRegistrations,
      dailyStats,
      categoryStats,
      topResources,
      userGrowth,
      recentActivity
    ] = await Promise.all([
      // 基础指标
      prisma.resource.count(),
      prisma.category.count(),
      db.collection('users').countDocuments(),
      
      // 统计数据
      db.collection('ResourceStat').aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).toArray().then(result => result[0]?.total || 0),
      
      db.collection('ResourceStat').aggregate([
        { $group: { _id: null, total: { $sum: '$clicks' } } }
      ]).toArray().then(result => result[0]?.total || 0),
      
      // 活跃用户（近7天有活动的用户）
      db.collection('UserActivity').distinct('userId', {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).then(users => users.length),
      
      // 今日注册用户
      db.collection('users').countDocuments({
        createdAt: { 
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }),
      
      // 每日统计数据
      generateDailyStats(db, startDate, now),
      
      // 分类统计
      getCategoryStats(db),
      
      // 热门资源
      getTopResources(db),
      
      // 用户增长数据
      getUserGrowthData(db, startDate, now),
      
      // 最近活动
      getRecentActivity(db)
    ]);
    
    // 计算月增长率（模拟数据，实际应基于历史数据计算）
    const monthlyGrowth = 12.5;
    
    const dashboardData = {
      metrics: {
        resourceCount,
        userCount,
        categoryCount,
        totalViews,
        totalClicks,
        activeUsers,
        todayRegistrations,
        monthlyGrowth
      },
      charts: {
        dailyStats,
        categoryStats,
        topResources,
        userGrowth
      },
      recentActivity
    };
    
    return NextResponse.json({ success: true, data: dashboardData });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: '获取仪表板数据失败' },
      { status: 500 }
    );
  }
}

// 生成每日统计数据
async function generateDailyStats(db: any, startDate: Date, endDate: Date) {
  const stats = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 获取当天的访问统计
    const dayStats = await Promise.all([
      // 浏览量
      db.collection('UserActivity').countDocuments({
        action: 'VIEW',
        createdAt: { $gte: currentDate, $lt: nextDate }
      }),
      // 点击量
      db.collection('UserActivity').countDocuments({
        action: 'CLICK',
        createdAt: { $gte: currentDate, $lt: nextDate }
      }),
      // 活跃用户
      db.collection('UserActivity').distinct('userId', {
        createdAt: { $gte: currentDate, $lt: nextDate }
      }).then((users: any[]) => users.length)
    ]);
    
    stats.push({
      date: currentDate.toISOString().split('T')[0],
      views: dayStats[0],
      clicks: dayStats[1],
      users: dayStats[2]
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return stats;
}

// 获取分类统计
async function getCategoryStats(db: any) {
  const stats = await db.collection('Category').aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'Resource',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'resources'
      }
    },
    {
      $project: {
        name: 1,
        resourceCount: { $size: '$resources' },
        color: { $ifNull: ['$color', '#8b5cf6'] }
      }
    },
    { $match: { resourceCount: { $gt: 0 } } },
    { $sort: { resourceCount: -1 } },
    { $limit: 8 }
  ]).toArray();
  
  return stats.map((stat: any) => ({
    name: stat.name,
    value: stat.resourceCount,
    color: stat.color
  }));
}

// 获取热门资源
async function getTopResources(db: any) {
  const resources = await db.collection('ResourceStat').aggregate([
    { $sort: { views: -1, clicks: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'Resource',
        let: { resourceId: { $toObjectId: '$resourceId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$resourceId'] } } },
          { $project: { title: 1 } }
        ],
        as: 'resource'
      }
    },
    { $unwind: '$resource' },
    {
      $project: {
        title: '$resource.title',
        views: 1,
        clicks: 1
      }
    }
  ]).toArray();
  
  return resources;
}

// 获取用户增长数据
async function getUserGrowthData(db: any, startDate: Date, endDate: Date) {
  const growthData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 获取当天数据
    const [newUsers, activeUsers] = await Promise.all([
      db.collection('users').countDocuments({
        createdAt: { $gte: currentDate, $lt: nextDate }
      }),
      db.collection('UserActivity').distinct('userId', {
        createdAt: { $gte: currentDate, $lt: nextDate }
      }).then((users: any[]) => users.length)
    ]);
    
    growthData.push({
      date: currentDate.toISOString().split('T')[0],
      users: newUsers,
      active: activeUsers
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return growthData;
}

// 获取最近活动
async function getRecentActivity(db: any) {
  const activities = await db.collection('AuditLog').aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'users',
        let: { userId: { $toObjectId: '$userId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { name: 1, email: 1 } }
        ],
        as: 'user'
      }
    },
    {
      $project: {
        action: 1,
        resource: 1,
        resourceId: 1,
        createdAt: 1,
        userName: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Unknown'] }
      }
    }
  ]).toArray();
  
  return activities.map((activity: any) => ({
    action: getActionDescription(activity.action),
    resource: activity.resource || 'system',
    user: activity.userName,
    time: formatTimeAgo(activity.createdAt)
  }));
}

// 操作描述映射
function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    'USER_LOGIN': '登录了系统',
    'USER_CREATE': '创建了用户',
    'RESOURCE_CREATE': '创建了资源',
    'RESOURCE_UPDATE': '更新了资源',
    'RESOURCE_DELETE': '删除了资源',
    'CATEGORY_CREATE': '创建了分类',
    'CATEGORY_UPDATE': '更新了分类',
    'SETTING_UPDATE': '更新了设置',
  };
  
  return descriptions[action] || action;
}

// 格式化时间差
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return new Date(date).toLocaleDateString('zh-CN');
}