import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

// 记录资源浏览行为
export async function POST(request: NextRequest) {
  try {
    const { resourceId, sessionId } = await request.json();
    
    if (!resourceId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "缺少必需参数" },
        { status: 400 }
      );
    }

    // 获取客户端信息
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      '127.0.0.1';
    
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || '';
    
    // 判断设备类型
    const deviceType = userAgent.includes('Mobile') ? 'mobile' : 
                      userAgent.includes('Tablet') ? 'tablet' : 'desktop';

    // 检查是否为重复访问（同一会话5分钟内不重复计数）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const client = await clientPromise;
    const db = client.db();
    
    const existingActivity = await db.collection('UserActivity').findOne({
      sessionId,
      resourceId,
      action: 'VIEW',
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingActivity) {
      return NextResponse.json({ 
        success: true, 
        message: "重复访问，不计入统计" 
      });
    }

    // 记录用户行为
    await db.collection('UserActivity').insertOne({
      sessionId,
      action: 'VIEW',
      resourceId,
      page: `/resources/${resourceId}`,
      referrer,
      ipAddress,
      userAgent,
      deviceType,
      createdAt: new Date()
    });

    // 更新或创建ResourceStat记录
    const existingStat = await db.collection('ResourceStat').findOne({ 
      resourceId 
    });

    if (existingStat) {
      await db.collection('ResourceStat').updateOne(
        { resourceId },
        { 
          $inc: { views: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      await db.collection('ResourceStat').insertOne({
        resourceId,
        views: 1,
        downloads: 0,
        favorites: 0,
        avgRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "浏览记录已统计" 
    });

  } catch (error) {
    console.error("记录浏览行为失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}