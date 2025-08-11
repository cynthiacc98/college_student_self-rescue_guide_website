import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 获取分类列表
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
    const includeStats = searchParams.get('includeStats') === 'true';
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const client = await clientPromise;
    const db = client.db();

    // 构建查询条件
    const matchCondition: any = {};
    if (onlyActive) {
      matchCondition.isActive = true;
    }

    let pipeline: any[] = [
      { $match: matchCondition },
      { $sort: { order: 1, name: 1 } }
    ];

    // 如果需要统计信息，添加资源关联
    if (includeStats) {
      pipeline.push(
        {
          $lookup: {
            from: "Resource",
            let: { categoryId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$categoryId", "$$categoryId"] },
                  status: "ACTIVE",
                  isPublic: true
                }
              }
            ],
            as: "resources"
          }
        },
        {
          $addFields: {
            actualResourceCount: { $size: "$resources" }
          }
        },
        {
          $project: {
            resources: 0 // 不返回具体资源，只要计数
          }
        }
      );
    }

    const categories = await db.collection("Category")
      .aggregate(pipeline)
      .toArray();

    // 格式化返回数据
    const formattedCategories = categories.map(category => ({
      ...category,
      id: category._id.toString(),
      _id: undefined
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories: formattedCategories,
        total: formattedCategories.length
      }
    });

  } catch (error) {
    console.error("GET_CATEGORIES_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "获取分类失败" },
      { status: 500 }
    );
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      iconUrl, 
      color, 
      parentId, 
      order, 
      isActive, 
      isFeatured 
    } = body;

    // 验证必填字段
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "名称和slug不能为空" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 检查slug唯一性
    const existingCategory = await db.collection("Category").findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "slug已存在" },
        { status: 409 }
      );
    }

    // 验证父分类存在性
    if (parentId) {
      const parentCategory = await db.collection("Category").findOne({ _id: new ObjectId(parentId) });
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: "父分类不存在" },
          { status: 400 }
        );
      }
    }

    // 创建分类文档
    const categoryDoc = {
      name,
      slug,
      description: description || null,
      iconUrl: iconUrl || null,
      color: color || null,
      parentId: parentId || null,
      order: order || 0,
      resourceCount: 0,
      viewCount: 0,
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection("Category").insertOne(categoryDoc);

    // 记录操作日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "CREATE",
      resource: "categories",
      resourceId: result.insertedId.toString(),
      oldData: null,
      newData: categoryDoc,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: "分类创建成功",
      data: {
        id: result.insertedId.toString(),
        name,
        slug
      }
    }, { status: 201 });

  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "创建分类失败" },
      { status: 500 }
    );
  }
}

// 批量操作
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, categoryIds } = body;

    if (!action || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "操作类型和分类ID不能为空" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    let updateData: any = { updatedAt: now };
    let successMessage = "";

    switch (action) {
      case 'activate':
        updateData.isActive = true;
        successMessage = "分类激活成功";
        break;
      case 'deactivate':
        updateData.isActive = false;
        successMessage = "分类停用成功";
        break;
      case 'feature':
        updateData.isFeatured = true;
        successMessage = "设为推荐成功";
        break;
      case 'unfeature':
        updateData.isFeatured = false;
        successMessage = "取消推荐成功";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 }
        );
    }

    // 转换为ObjectId
    const objectIds = categoryIds.map(id => new ObjectId(id));

    // 执行批量更新
    const result = await db.collection("Category").updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    // 记录操作日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "BATCH_UPDATE",
      resource: "categories",
      resourceId: null,
      oldData: { categoryIds },
      newData: { action, updateData },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error("BATCH_UPDATE_CATEGORIES_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "批量操作失败" },
      { status: 500 }
    );
  }
}