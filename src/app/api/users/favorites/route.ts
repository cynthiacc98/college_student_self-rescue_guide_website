import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();

    // 获取用户收藏的资源ID列表
    const favorites = await db.collection("UserFavorites")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const resourceIds = favorites.map(f => new ObjectId(f.resourceId));

    if (resourceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          resources: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            pageSize: limit
          }
        }
      });
    }

    // 获取收藏的资源详情
    const resources = await db.collection("Resource")
      .find({ _id: { $in: resourceIds }, isPublic: true, status: "ACTIVE" })
      .toArray();

    // 获取资源统计和分类信息
    const resourcesWithDetails = await Promise.all(
      resources.map(async (resource) => {
        const [stats, category, author] = await Promise.all([
          db.collection("ResourceStat").findOne({ resourceId: resource._id }),
          resource.categoryId 
            ? db.collection("Category").findOne({ _id: new ObjectId(resource.categoryId) })
            : null,
          resource.authorId
            ? db.collection("users").findOne({ _id: new ObjectId(resource.authorId) })
            : null
        ]);

        const favoriteInfo = favorites.find(f => f.resourceId === resource._id.toString());

        return {
          ...resource,
          stats: stats || { views: 0, clicks: 0, likes: 0 },
          category: category ? {
            name: category.name,
            slug: category.slug,
            color: category.color
          } : null,
          author: author ? {
            name: author.name,
            email: author.email
          } : null,
          favoriteAt: favoriteInfo?.createdAt
        };
      })
    );

    const totalCount = await db.collection("UserFavorites")
      .countDocuments({ userId: session.user.id });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        resources: resourcesWithDetails,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          pageSize: limit
        }
      }
    });

  } catch (error) {
    console.error("GET_FAVORITES_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "获取收藏列表失败" },
      { status: 500 }
    );
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "资源ID不能为空" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 验证资源是否存在
    const resource = await db.collection("Resource").findOne({
      _id: new ObjectId(resourceId),
      isPublic: true,
      status: "ACTIVE"
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "资源不存在或不可用" },
        { status: 404 }
      );
    }

    // 检查是否已经收藏
    const existingFavorite = await db.collection("UserFavorites").findOne({
      userId: session.user.id,
      resourceId: resourceId
    });

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, error: "已经收藏过该资源" },
        { status: 409 }
      );
    }

    // 添加收藏记录
    await db.collection("UserFavorites").insertOne({
      userId: session.user.id,
      resourceId: resourceId,
      createdAt: now,
      updatedAt: now
    });

    // 更新资源喜欢数
    await db.collection("ResourceStat").updateOne(
      { resourceId: new ObjectId(resourceId) },
      { 
        $inc: { likes: 1 },
        $set: { updatedAt: now }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "收藏成功",
      data: { resourceId }
    });

  } catch (error) {
    console.error("ADD_FAVORITE_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "添加收藏失败" },
      { status: 500 }
    );
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "资源ID不能为空" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 删除收藏记录
    const result = await db.collection("UserFavorites").deleteOne({
      userId: session.user.id,
      resourceId: resourceId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "收藏记录不存在" },
        { status: 404 }
      );
    }

    // 更新资源喜欢数
    await db.collection("ResourceStat").updateOne(
      { resourceId: new ObjectId(resourceId) },
      { 
        $inc: { likes: -1 },
        $set: { updatedAt: now }
      }
    );

    return NextResponse.json({
      success: true,
      message: "取消收藏成功",
      data: { resourceId }
    });

  } catch (error) {
    console.error("REMOVE_FAVORITE_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "取消收藏失败" },
      { status: 500 }
    );
  }
}