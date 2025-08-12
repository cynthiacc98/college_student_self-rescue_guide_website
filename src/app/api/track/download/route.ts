import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

// 记录资源下载行为
export async function POST(request: NextRequest) {
  try {
    const { resourceId, userId, sessionId } = await request.json();
    
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

    const client = await clientPromise;
    const db = client.db();

    // 记录下载记录（不去重，每次点击都记录）
    await db.collection('DownloadRecord').insertOne({
      resourceId,
      userId: userId || null,
      ipAddress,
      userAgent,
      downloadAt: new Date()
    });

    // 记录用户行为
    await db.collection('UserActivity').insertOne({
      sessionId,
      userId: userId || null,
      action: 'DOWNLOAD',
      resourceId,
      page: `/resources/${resourceId}`,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });

    // 更新ResourceStat下载计数
    const existingStat = await db.collection('ResourceStat').findOne({ 
      resourceId 
    });

    if (existingStat) {
      await db.collection('ResourceStat').updateOne(
        { resourceId },
        { 
          $inc: { downloads: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      await db.collection('ResourceStat').insertOne({
        resourceId,
        views: 0,
        downloads: 1,
        favorites: 0,
        avgRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 更新Resource表的downloadCount
    await db.collection('Resource').updateOne(
      { _id: { $oid: resourceId } },
      { $inc: { downloadCount: 1 } }
    );

    return NextResponse.json({ 
      success: true, 
      message: "下载记录已统计" 
    });

  } catch (error) {
    console.error("记录下载行为失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}