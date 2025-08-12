import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // 检查UserActivity集合中的数据
    const totalActivities = await db.collection('UserActivity').countDocuments();
    const totalViews = await db.collection('UserActivity').countDocuments({ action: 'VIEW' });
    const totalClicks = await db.collection('UserActivity').countDocuments({ action: 'CLICK' });
    const uniqueUsers = await db.collection('UserActivity').distinct('userId');
    const uniqueSessions = await db.collection('UserActivity').distinct('sessionId');
    
    // 获取一些示例数据
    const sampleActivities = await db.collection('UserActivity').find({}).limit(5).toArray();
    
    // 设备统计
    const deviceStats = await db.collection('UserActivity').aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // 国家统计
    const countryStats = await db.collection('UserActivity').aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]).toArray();
    
    // 最近7天的趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTrend = await db.collection('UserActivity').aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          views: {
            $sum: { $cond: [{ $eq: ['$action', 'VIEW'] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$action', 'CLICK'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    return NextResponse.json({
      success: true,
      message: '分析数据检查完成',
      data: {
        summary: {
          totalActivities,
          totalViews,
          totalClicks,
          uniqueUsers: uniqueUsers.length,
          uniqueSessions: uniqueSessions.length,
        },
        deviceStats,
        countryStats,
        recentTrend,
        sampleActivities: sampleActivities.slice(0, 3).map(activity => ({
          userId: activity.userId?.toString(),
          action: activity.action,
          page: activity.page,
          deviceType: activity.deviceType,
          country: activity.country,
          createdAt: activity.createdAt
        }))
      }
    });
    
  } catch (error) {
    console.error('检查分析数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '检查分析数据失败', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}