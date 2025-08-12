import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 获取资源评论
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "缺少资源ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 计算跳过的文档数量
    const skip = (page - 1) * limit;

    // 获取评论总数
    const totalComments = await db.collection('ResourceComment').countDocuments({
      resourceId,
      status: 'ACTIVE'
    });

    // 获取评论列表 (只获取顶级评论)
    const comments = await db.collection('ResourceComment').find({
      resourceId,
      status: 'ACTIVE',
      parentId: null // 只获取顶级评论
    })
    .sort({ createdAt: -1 }) // 按时间倒序
    .skip(skip)
    .limit(limit)
    .toArray();

    // 获取用户信息
    const userIds = [...new Set(comments.map(c => c.userId))];
    const users = await db.collection('users').find({
      _id: { $in: userIds.map(id => new ObjectId(id)) }
    }).toArray();

    const userMap = new Map(users.map(user => [user._id.toString(), user]));

    // 为每个评论获取回复
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await db.collection('ResourceComment').find({
          resourceId,
          parentId: comment._id.toString(),
          status: 'ACTIVE'
        })
        .sort({ createdAt: 1 }) // 回复按时间正序
        .toArray();

        // 获取回复用户信息
        const replyUserIds = [...new Set(replies.map(r => r.userId))];
        const replyUsers = await db.collection('users').find({
          _id: { $in: replyUserIds.map(id => new ObjectId(id)) }
        }).toArray();

        const replyUserMap = new Map(replyUsers.map(user => [user._id.toString(), user]));

        return {
          ...comment,
          id: comment._id.toString(),
          user: userMap.get(comment.userId) || { name: '未知用户', email: '' },
          replies: replies.map(reply => ({
            ...reply,
            id: reply._id.toString(),
            user: replyUserMap.get(reply.userId) || { name: '未知用户', email: '' }
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total: totalComments,
        totalPages: Math.ceil(totalComments / limit),
        hasNext: page * limit < totalComments,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}

// 添加评论
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "需要登录" },
        { status: 401 }
      );
    }

    const { resourceId, content, parentId, rating } = await request.json();
    
    if (!resourceId || !content) {
      return NextResponse.json(
        { success: false, error: "缺少必需参数" },
        { status: 400 }
      );
    }

    if (content.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "评论内容至少5个字符" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "评论内容不能超过1000字符" },
        { status: 400 }
      );
    }

    // 验证评分（可选）
    if (rating && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
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

    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const parentComment = await db.collection('ResourceComment').findOne({
        _id: new ObjectId(parentId),
        resourceId,
        status: 'ACTIVE'
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "父评论不存在" },
          { status: 404 }
        );
      }
    }

    // 创建评论
    const commentData = {
      resourceId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      rating: (!parentId && rating) ? rating : null, // 只有顶级评论可以有评分
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('ResourceComment').insertOne(commentData);
    const commentId = result.insertedId.toString();

    // 更新资源的评论计数
    await db.collection('Resource').updateOne(
      { _id: new ObjectId(resourceId) },
      { $inc: { reviewCount: 1 } }
    );

    // 记录用户行为
    const sessionId = request.headers.get('x-session-id') || 'unknown';
    await db.collection('UserActivity').insertOne({
      sessionId,
      userId,
      action: parentId ? 'REPLY_COMMENT' : 'COMMENT',
      resourceId,
      page: `/resources/${resourceId}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      metadata: { 
        commentId,
        parentId: parentId || null,
        rating: rating || null
      },
      createdAt: new Date()
    });

    // 获取用户信息用于返回
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    return NextResponse.json({
      success: true,
      message: parentId ? "回复成功" : "评论成功",
      comment: {
        ...commentData,
        id: commentId,
        user: user || { name: '未知用户', email: '' },
        replies: []
      }
    });

  } catch (error) {
    console.error("添加评论失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}

// 删除评论 (软删除)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "需要登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json(
        { success: false, error: "缺少评论ID" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();

    // 查找评论
    const comment = await db.collection('ResourceComment').findOne({
      _id: new ObjectId(commentId),
      status: 'ACTIVE'
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "评论不存在" },
        { status: 404 }
      );
    }

    // 检查权限：只能删除自己的评论或管理员可以删除任意评论
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (comment.userId !== userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: "无权限删除此评论" },
        { status: 403 }
      );
    }

    // 软删除评论
    await db.collection('ResourceComment').updateOne(
      { _id: new ObjectId(commentId) },
      { 
        $set: { 
          status: 'DELETED',
          updatedAt: new Date()
        }
      }
    );

    // 如果删除的是顶级评论，也要删除其所有回复
    if (!comment.parentId) {
      await db.collection('ResourceComment').updateMany(
        { parentId: commentId },
        { 
          $set: { 
            status: 'DELETED',
            updatedAt: new Date()
          }
        }
      );
    }

    // 更新资源的评论计数
    await db.collection('Resource').updateOne(
      { _id: new ObjectId(comment.resourceId) },
      { $inc: { reviewCount: -1 } }
    );

    return NextResponse.json({
      success: true,
      message: "删除成功"
    });

  } catch (error) {
    console.error("删除评论失败:", error);
    return NextResponse.json(
      { success: false, error: "内部服务器错误" },
      { status: 500 }
    );
  }
}