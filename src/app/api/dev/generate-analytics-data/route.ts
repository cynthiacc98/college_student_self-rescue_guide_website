import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // 获取现有的用户和资源
    const users = await db.collection('users').find({}).toArray();
    const resources = await db.collection('Resource').find({}).toArray();
    const categories = await db.collection('Category').find({}).toArray();
    
    if (users.length === 0 || resources.length === 0) {
      return NextResponse.json(
        { error: '需要先有用户和资源数据才能生成活动记录' },
        { status: 400 }
      );
    }
    
    // 清空现有的用户活动数据
    await db.collection('UserActivity').deleteMany({});
    
    const activities = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // 定义可能的页面路径
    const pages = [
      '/',
      '/categories/学习方法',
      '/categories/时间管理',
      '/categories/心理健康',
      '/categories/职业规划',
      '/categories/技能提升',
      '/categories/人际关系',
      ...resources.map(r => `/resources/${r._id}`)
    ];
    
    // 定义设备类型分布
    const deviceTypes = [
      { type: 'desktop', weight: 60 },
      { type: 'mobile', weight: 35 },
      { type: 'tablet', weight: 5 }
    ];
    
    // 定义国家分布
    const countries = [
      { country: 'CN', weight: 70 },
      { country: 'US', weight: 10 },
      { country: 'CA', weight: 5 },
      { country: 'GB', weight: 5 },
      { country: 'AU', weight: 3 },
      { country: 'JP', weight: 2 },
      { country: 'KR', weight: 2 },
      { country: 'SG', weight: 2 },
      { country: 'OTHER', weight: 1 }
    ];
    
    // 生成1500条活动记录
    for (let i = 0; i < 1500; i++) {
      // 随机选择用户
      const user = users[Math.floor(Math.random() * users.length)];
      
      // 生成随机时间（过去30天内）
      const randomTime = new Date(
        thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
      );
      
      // 生成会话ID（同一用户在短时间内的活动使用相同sessionId）
      const sessionId = `session_${user._id}_${Math.floor(randomTime.getTime() / (1000 * 60 * 30))}`; // 30分钟为一个会话
      
      // 随机选择活动类型（VIEW占80%，CLICK占20%）
      const action = Math.random() < 0.8 ? 'VIEW' : 'CLICK';
      
      // 随机选择页面
      const page = pages[Math.floor(Math.random() * pages.length)];
      
      // 根据页面类型设置resourceId和categoryId
      let resourceId = null;
      let categoryId = null;
      
      if (page.startsWith('/resources/')) {
        const resourceIdStr = page.replace('/resources/', '');
        const resource = resources.find(r => r._id.toString() === resourceIdStr);
        if (resource) {
          resourceId = resource._id;
          categoryId = resource.category;
        }
      } else if (page.startsWith('/categories/')) {
        const categoryName = decodeURIComponent(page.replace('/categories/', ''));
        const category = categories.find(c => c.name === categoryName);
        if (category) {
          categoryId = category._id;
        }
      }
      
      // 根据权重随机选择设备类型
      const deviceRandom = Math.random() * 100;
      let deviceType = 'desktop';
      let cumulative = 0;
      for (const device of deviceTypes) {
        cumulative += device.weight;
        if (deviceRandom <= cumulative) {
          deviceType = device.type;
          break;
        }
      }
      
      // 根据权重随机选择国家
      const countryRandom = Math.random() * 100;
      let country = 'CN';
      cumulative = 0;
      for (const countryData of countries) {
        cumulative += countryData.weight;
        if (countryRandom <= cumulative) {
          country = countryData.country;
          break;
        }
      }
      
      // 生成停留时长（秒）
      let duration;
      if (action === 'VIEW') {
        // 浏览页面：10秒到10分钟
        duration = Math.floor(Math.random() * 590) + 10;
      } else {
        // 点击下载：1-30秒
        duration = Math.floor(Math.random() * 30) + 1;
      }
      
      // 如果是资源页面的CLICK，增加下载计数
      if (action === 'CLICK' && resourceId) {
        await db.collection('Resource').updateOne(
          { _id: resourceId },
          { $inc: { downloadCount: 1 } }
        );
      }
      
      // 生成随机IP地址
      const ipAddress = `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // 生成随机User Agent
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
      ];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      const activity = {
        userId: user._id,
        sessionId,
        action,
        resourceId,
        categoryId,
        page,
        ipAddress,
        userAgent,
        deviceType,
        country,
        duration,
        createdAt: randomTime
      };
      
      activities.push(activity);
    }
    
    // 批量插入活动记录
    await db.collection('UserActivity').insertMany(activities);
    
    // 生成统计摘要
    const totalViews = activities.filter(a => a.action === 'VIEW').length;
    const totalClicks = activities.filter(a => a.action === 'CLICK').length;
    const uniqueUsers = new Set(activities.map(a => a.userId.toString())).size;
    const uniqueSessions = new Set(activities.map(a => a.sessionId)).size;
    
    const deviceStats = deviceTypes.map(device => ({
      type: device.type,
      count: activities.filter(a => a.deviceType === device.type).length
    }));
    
    const countryStats = countries.map(countryData => ({
      country: countryData.country,
      count: activities.filter(a => a.country === countryData.country).length
    }));
    
    return NextResponse.json({
      success: true,
      message: '用户活动数据生成成功',
      data: {
        totalActivities: activities.length,
        totalViews,
        totalClicks,
        uniqueUsers,
        uniqueSessions,
        dateRange: {
          from: thirtyDaysAgo.toISOString(),
          to: now.toISOString()
        },
        deviceStats,
        countryStats: countryStats.filter(c => c.count > 0),
        sampleActivities: activities.slice(0, 5).map(a => ({
          ...a,
          _id: new ObjectId(),
          userId: a.userId.toString(),
          resourceId: a.resourceId?.toString(),
          categoryId: a.categoryId?.toString()
        }))
      }
    });
    
  } catch (error) {
    console.error('生成用户活动数据失败:', error);
    return NextResponse.json(
      { error: '生成用户活动数据失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 获取当前用户活动统计
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const stats = await db.collection('UserActivity').aggregate([
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          totalViews: { $sum: { $cond: [{ $eq: ['$action', 'VIEW'] }, 1, 0] } },
          totalClicks: { $sum: { $cond: [{ $eq: ['$action', 'CLICK'] }, 1, 0] } },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
          earliestActivity: { $min: '$createdAt' },
          latestActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          totalActivities: 1,
          totalViews: 1,
          totalClicks: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueSessions: { $size: '$uniqueSessions' },
          earliestActivity: 1,
          latestActivity: 1
        }
      }
    ]).toArray();
    
    const deviceStats = await db.collection('UserActivity').aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]).toArray();
    
    const countryStats = await db.collection('UserActivity').aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          country: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    return NextResponse.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalActivities: 0,
          totalViews: 0,
          totalClicks: 0,
          uniqueUsers: 0,
          uniqueSessions: 0,
          earliestActivity: null,
          latestActivity: null
        },
        deviceStats,
        countryStats
      }
    });
    
  } catch (error) {
    console.error('获取用户活动统计失败:', error);
    return NextResponse.json(
      { error: '获取用户活动统计失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}