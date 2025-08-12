import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 添加/更新评分
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "需要登录" },
        { status: 401 }
      );
    }

    const { resourceId, rating } = await request.json();
    
    if (!resourceId || !rating) {
      return NextResponse.json(
        { success: false, error: "缺少必需参数" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, error: "评分必须是1-5的整数" },
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

    // 检查是否已经评分过
    const existingRating = await db.collection('ResourceRating').findOne({
      userId,
      resourceId
    });

    const isUpdate = !!existingRating;
    const oldRating = existingRating?.rating || 0;

    if (existingRating) {
      // 更新现有评分
      await db.collection('ResourceRating').updateOne(
        { userId, resourceId },
        { 
          $set: { 
            rating, 
            updatedAt: new Date() 
          }
        }
      );
    } else {
      // 添加新评分
      await db.collection('ResourceRating').insertOne({
        userId,
        resourceId,
        rating,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 重新计算资源的平均评分和评分总数
    const allRatings = await db.collection('ResourceRating').find({
      resourceId
    }).toArray();

    const avgRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    const reviewCount = allRatings.length;

    // 更新资源的评分信息
    await db.collection('Resource').updateOne(
      { _id: new ObjectId(resourceId) },
      { 
        $set: { 
          rating: Math.round(avgRating * 10) / 10, // 保留一位小数
          reviewCount: reviewCount,
          updatedAt: new Date()
        }
      }
    );

    // 记录用户行为
    const sessionId = request.headers.get('x-session-id') || 'unknown';
    await db.collection('UserActivity').insertOne({
      sessionId,
      userId,
      action: isUpdate ? 'UPDATE_RATING' : 'RATE',
      resourceId,
      page: `/resources/${resourceId}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      metadata: { 
        rating, 
        oldRating: isUpdate ? oldRating : null 
      },
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: isUpdate ? "评分更新成功" : "评分提交成功",
      rating,
      avgRating,
      reviewCount
    });

  } catch (error) {
    console.error("评分操作失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}

// 获取用户评分
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ userRating: null });
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

    // 获取用户评分
    const userRating = await db.collection('ResourceRating').findOne({
      userId,
      resourceId
    });

    // 获取资源的整体评分信息
    const allRatings = await db.collection('ResourceRating').find({
      resourceId
    }).toArray();

    const avgRating = allRatings.length > 0 
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
      : 0;

    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    allRatings.forEach(r => {
      ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
    });

    return NextResponse.json({ 
      userRating: userRating ? userRating.rating : null,
      avgRating,
      reviewCount: allRatings.length,
      ratingDistribution
    });

  } catch (error) {
    console.error("获取评分失败:", error);
    return NextResponse.json({ 
      userRating: null, 
      avgRating: 0, 
      reviewCount: 0 
    });
  }
}