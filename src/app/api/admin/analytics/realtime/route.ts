import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.ANALYTICS_READ);
    
    const client = await clientPromise;
    const db = client.db();
    
    // 获取实时数据（最近30分钟）
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const now = new Date();
    
    // 今天开始时间
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [
      activeUsers,
      currentSessions, 
      todayPageViews,
      topPages
    ] = await Promise.all([
      // 活跃用户（最近30分钟有活动的用户）
      db.collection('UserActivity').distinct('userId', {
        createdAt: { $gte: thirtyMinutesAgo, $lte: now }
      }).then((users: any[]) => users.length),
      
      // 当前会话数（最近30分钟的会话）
      db.collection('UserActivity').distinct('sessionId', {
        createdAt: { $gte: thirtyMinutesAgo, $lte: now }
      }).then((sessions: any[]) => sessions.length),
      
      // 今日页面浏览量
      db.collection('UserActivity').countDocuments({
        action: 'VIEW',
        createdAt: { $gte: todayStart, $lte: now }
      }),
      
      // 热门页面（今日）
      db.collection('UserActivity').aggregate([
        {
          $match: {
            action: 'VIEW',
            createdAt: { $gte: todayStart, $lte: now },
            page: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$page',
            views: { $sum: 1 }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 5 },
        {
          $project: {
            page: '$_id',
            views: 1,
            _id: 0
          }
        }
      ]).toArray()
    ]);
    
    const realtimeData = {
      activeUsers,
      currentSessions,
      pageViews: todayPageViews,
      topPages
    };
    
    return NextResponse.json({ success: true, data: realtimeData });
    
  } catch (error) {
    console.error('Realtime analytics API error:', error);
    return NextResponse.json(
      { success: false, error: '获取实时数据失败' },
      { status: 500 }
    );
  }
}