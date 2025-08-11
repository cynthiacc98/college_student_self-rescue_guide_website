import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.ANALYTICS_READ);
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // 计算时间范围
    const now = new Date();
    const daysMap: Record<string, number> = { 
      '7d': 7, 
      '30d': 30, 
      '90d': 90, 
      '1y': 365 
    };
    const days = daysMap[range] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const client = await clientPromise;
    const db = client.db();
    
    // 并行获取所有分析数据
    const [
      overviewData,
      trafficTrend,
      deviceStats,
      locationStats,
      categoryPerformance,
      userBehavior,
      conversionFunnel
    ] = await Promise.all([
      // 概览数据
      getOverviewData(db, startDate, now),
      
      // 流量趋势
      getTrafficTrend(db, startDate, now),
      
      // 设备统计
      getDeviceStats(db, startDate, now),
      
      // 地理位置统计
      getLocationStats(db, startDate, now),
      
      // 分类表现
      getCategoryPerformance(db, startDate, now),
      
      // 用户行为
      getUserBehavior(db, startDate, now),
      
      // 转化漏斗
      getConversionFunnel(db, startDate, now)
    ]);
    
    const analyticsData = {
      overview: overviewData,
      charts: {
        trafficTrend,
        deviceStats,
        locationStats,
        categoryPerformance,
        userBehavior,
        conversionFunnel
      }
    };
    
    return NextResponse.json({ success: true, data: analyticsData });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: '获取分析数据失败' },
      { status: 500 }
    );
  }
}

// 获取概览数据
async function getOverviewData(db: any, startDate: Date, endDate: Date) {
  const [
    totalViews,
    totalClicks,
    uniqueUsers,
    avgSessionDuration,
    bounceRate,
    conversionRate
  ] = await Promise.all([
    // 总浏览量
    db.collection('UserActivity').countDocuments({
      action: 'VIEW',
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    // 总点击量
    db.collection('UserActivity').countDocuments({
      action: 'CLICK',
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    // 独立用户数
    db.collection('UserActivity').distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((users: any[]) => users.length),
    
    // 平均会话时长（模拟数据）
    Promise.resolve(245), // 4分5秒
    
    // 跳出率（模拟数据）
    Promise.resolve(32.5),
    
    // 转化率（模拟数据）
    Promise.resolve(4.2)
  ]);
  
  return {
    totalViews,
    totalClicks,
    uniqueUsers,
    avgSessionDuration,
    bounceRate,
    conversionRate
  };
}

// 获取流量趋势
async function getTrafficTrend(db: any, startDate: Date, endDate: Date) {
  const trend = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const [views, clicks, users] = await Promise.all([
      db.collection('UserActivity').countDocuments({
        action: 'VIEW',
        createdAt: { $gte: currentDate, $lt: nextDate }
      }),
      db.collection('UserActivity').countDocuments({
        action: 'CLICK',
        createdAt: { $gte: currentDate, $lt: nextDate }
      }),
      db.collection('UserActivity').distinct('userId', {
        createdAt: { $gte: currentDate, $lt: nextDate }
      }).then((users: any[]) => users.length)
    ]);
    
    trend.push({
      date: currentDate.toISOString().split('T')[0],
      views,
      clicks,
      users
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trend;
}

// 获取设备统计
async function getDeviceStats(db: any, startDate: Date, endDate: Date) {
  const deviceStats = await db.collection('UserActivity').aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        deviceType: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$deviceType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
  
  return deviceStats.map((stat: any, index: number) => ({
    name: stat._id || '未知设备',
    value: stat.count,
    color: colors[index % colors.length]
  }));
}

// 获取地理位置统计
async function getLocationStats(db: any, startDate: Date, endDate: Date) {
  const locationStats = await db.collection('UserActivity').aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        country: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$country',
        users: { $addToSet: '$userId' },
        sessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        country: '$_id',
        users: { $size: '$users' },
        sessions: { $size: '$sessions' }
      }
    },
    { $sort: { users: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  return locationStats.map((stat: any) => ({
    country: stat.country || '未知',
    users: stat.users,
    sessions: stat.sessions
  }));
}

// 获取分类表现
async function getCategoryPerformance(db: any, startDate: Date, endDate: Date) {
  const categoryPerformance = await db.collection('UserActivity').aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        categoryId: { $exists: true, $ne: null },
        action: { $in: ['VIEW', 'CLICK'] }
      }
    },
    {
      $lookup: {
        from: 'Category',
        let: { categoryId: { $toObjectId: '$categoryId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } },
          { $project: { name: 1 } }
        ],
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: {
          category: '$category.name',
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        views: {
          $sum: { $cond: [{ $eq: ['$_id.action', 'VIEW'] }, '$count', 0] }
        },
        clicks: {
          $sum: { $cond: [{ $eq: ['$_id.action', 'CLICK'] }, '$count', 0] }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        views: 1,
        clicks: 1,
        ctr: {
          $cond: [
            { $gt: ['$views', 0] },
            { $multiply: [{ $divide: ['$clicks', '$views'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { views: -1 } },
    { $limit: 8 }
  ]).toArray();
  
  return categoryPerformance;
}

// 获取用户行为数据
async function getUserBehavior(db: any, startDate: Date, endDate: Date) {
  const userBehavior = await db.collection('UserActivity').aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        page: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$page',
        totalDuration: { $sum: { $ifNull: ['$duration', 60] } },
        sessions: { $addToSet: '$sessionId' },
        bounces: {
          $sum: { $cond: [{ $lt: [{ $ifNull: ['$duration', 60] }, 10] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        page: '$_id',
        avgTime: { $divide: ['$totalDuration', { $size: '$sessions' }] },
        bounceRate: {
          $multiply: [
            { $divide: ['$bounces', { $size: '$sessions' }] },
            100
          ]
        }
      }
    },
    { $sort: { avgTime: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  return userBehavior.map((behavior: any) => ({
    page: behavior.page,
    avgTime: Math.round(behavior.avgTime),
    bounceRate: Math.round(behavior.bounceRate * 100) / 100
  }));
}

// 获取转化漏斗数据
async function getConversionFunnel(db: any, startDate: Date, endDate: Date) {
  const [
    visitors,
    viewers,
    downloaders,
    registrations
  ] = await Promise.all([
    // 访客总数
    db.collection('UserActivity').distinct('sessionId', {
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((sessions: any[]) => sessions.length),
    
    // 浏览资源的用户
    db.collection('UserActivity').distinct('sessionId', {
      action: 'VIEW',
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((sessions: any[]) => sessions.length),
    
    // 下载资源的用户
    db.collection('UserActivity').distinct('sessionId', {
      action: 'CLICK',
      createdAt: { $gte: startDate, $lte: endDate }
    }).then((sessions: any[]) => sessions.length),
    
    // 注册用户
    db.collection('users').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    })
  ]);
  
  return [
    {
      stage: '访问网站',
      users: visitors,
      rate: 100
    },
    {
      stage: '浏览资源',
      users: viewers,
      rate: visitors > 0 ? (viewers / visitors) * 100 : 0
    },
    {
      stage: '点击下载',
      users: downloaders,
      rate: viewers > 0 ? (downloaders / viewers) * 100 : 0
    },
    {
      stage: '注册账号',
      users: registrations,
      rate: downloaders > 0 ? (registrations / downloaders) * 100 : 0
    }
  ];
}