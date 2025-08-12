import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 添加/移除收藏
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "需要登录" },
        { status: 401 }
      );
    }

    const { resourceId, action } = await request.json();
    
    if (!resourceId || !action) {
      return NextResponse.json(
        { success: false, error: "缺少必需参数" },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "无效的操作类型" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();

    // 检查资源是否存在
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "资源不存在" },
        { status: 404 }
      );
    }

    // 检查是否已收藏
    const existingFavorite = await db.collection('UserFavorites').findOne({
      userId,
      resourceId
    });

    if (action === 'add') {
      if (existingFavorite) {
        return NextResponse.json(
          { success: false, error: "已经收藏过该资源" },
          { status: 400 }
        );
      }

      // 添加收藏记录
      await db.collection('UserFavorites').insertOne({
        userId,
        resourceId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 更新资源收藏计数
      await db.collection('Resource').updateOne(
        { _id: new ObjectId(resourceId) },
        { $inc: { favoriteCount: 1 } }
      );

      // 记录用户行为
      const sessionId = request.headers.get('x-session-id') || 'unknown';
      await db.collection('UserActivity').insertOne({
        sessionId,
        userId,
        action: 'FAVORITE',
        resourceId,
        page: `/resources/${resourceId}`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        createdAt: new Date()
      });

      return NextResponse.json({ 
        success: true, 
        message: "收藏成功",
        favorited: true
      });

    } else if (action === 'remove') {
      if (!existingFavorite) {
        return NextResponse.json(
          { success: false, error: "未收藏该资源" },
          { status: 400 }
        );
      }

      // 移除收藏记录
      await db.collection('UserFavorites').deleteOne({
        userId,
        resourceId
      });

      // 更新资源收藏计数
      await db.collection('Resource').updateOne(
        { _id: new ObjectId(resourceId) },
        { $inc: { favoriteCount: -1 } }
      );

      // 记录用户行为
      const sessionId = request.headers.get('x-session-id') || 'unknown';
      await db.collection('UserActivity').insertOne({
        sessionId,
        userId,
        action: 'UNFAVORITE',
        resourceId,
        page: `/resources/${resourceId}`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        createdAt: new Date()
      });

      return NextResponse.json({ 
        success: true, 
        message: "取消收藏成功",
        favorited: false
      });
    }

  } catch (error) {
    console.error("收藏操作失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}

// 获取用户收藏状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ favorited: false });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "缺少资源ID" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();

    // 检查是否已收藏
    const existingFavorite = await db.collection('UserFavorites').findOne({
      userId,
      resourceId
    });

    return NextResponse.json({ 
      favorited: !!existingFavorite
    });

  } catch (error) {
    console.error("获取收藏状态失败:", error);
    return NextResponse.json({ favorited: false });
  }
}