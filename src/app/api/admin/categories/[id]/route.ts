import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 获取单个分类详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "无效的分类ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 获取分类详情及其统计信息
    const category = await db.collection("Category").aggregate([
      { $match: { _id: new ObjectId(id) } },
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
        $lookup: {
          from: "Category",
          let: { parentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toObjectId: "$parentId" }, "$$parentId"] }
              }
            }
          ],
          as: "children"
        }
      },
      {
        $addFields: {
          actualResourceCount: { $size: "$resources" },
          childrenCount: { $size: "$children" },
          recentResources: {
            $slice: [
              {
                $sortArray: {
                  input: "$resources",
                  sortBy: { createdAt: -1 }
                }
              },
              5
            ]
          }
        }
      },
      {
        $project: {
          resources: 0, // 不返回所有资源，只要统计和最近资源
          children: {
            $map: {
              input: "$children",
              as: "child",
              in: {
                id: { $toString: "$$child._id" },
                name: "$$child.name",
                slug: "$$child.slug",
                resourceCount: "$$child.resourceCount",
                isActive: "$$child.isActive"
              }
            }
          },
          recentResources: {
            $map: {
              input: "$recentResources",
              as: "resource",
              in: {
                id: { $toString: "$$resource._id" },
                title: "$$resource.title",
                slug: "$$resource.slug",
                createdAt: "$$resource.createdAt",
                status: "$$resource.status"
              }
            }
          }
        }
      }
    ]).toArray();

    if (!category || category.length === 0) {
      return NextResponse.json(
        { success: false, error: "分类不存在" },
        { status: 404 }
      );
    }

    const categoryData = category[0];

    // 获取父分类信息
    let parentCategory = null;
    if (categoryData.parentId) {
      parentCategory = await db.collection("Category").findOne(
        { _id: new ObjectId(categoryData.parentId) },
        { projection: { name: 1, slug: 1 } }
      );
    }

    // 格式化返回数据
    const formattedCategory = {
      ...categoryData,
      id: categoryData._id.toString(),
      _id: undefined,
      parent: parentCategory ? {
        id: parentCategory._id.toString(),
        name: parentCategory.name,
        slug: parentCategory.slug
      } : null
    };

    return NextResponse.json({
      success: true,
      data: formattedCategory
    });

  } catch (error) {
    console.error("GET_CATEGORY_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "获取分类详情失败" },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "无效的分类ID" },
        { status: 400 }
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

    // 检查分类是否存在
    const existingCategory = await db.collection("Category").findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "分类不存在" },
        { status: 404 }
      );
    }

    // 检查slug唯一性（排除自己）
    const duplicateSlug = await db.collection("Category").findOne({ 
      slug, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (duplicateSlug) {
      return NextResponse.json(
        { success: false, error: "slug已存在" },
        { status: 409 }
      );
    }

    // 验证父分类存在性（不能设置自己为父分类）
    if (parentId) {
      if (parentId === id) {
        return NextResponse.json(
          { success: false, error: "不能设置自己为父分类" },
          { status: 400 }
        );
      }
      
      const parentCategory = await db.collection("Category").findOne({ _id: new ObjectId(parentId) });
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: "父分类不存在" },
          { status: 400 }
        );
      }
    }

    // 更新分类文档
    const updateData = {
      name,
      slug,
      description: description || null,
      iconUrl: iconUrl || null,
      color: color || null,
      parentId: parentId || null,
      order: order !== undefined ? order : existingCategory.order,
      isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : existingCategory.isFeatured,
      updatedAt: now
    };

    const result = await db.collection("Category").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "分类不存在" },
        { status: 404 }
      );
    }

    // 记录操作日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "UPDATE",
      resource: "categories",
      resourceId: id,
      oldData: existingCategory,
      newData: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: "分类更新成功",
      data: {
        id,
        name,
        slug,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "更新分类失败" },
      { status: 500 }
    );
  }
}

// 部分更新分类（保持兼容性）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "无效的分类ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 检查分类是否存在
    const existingCategory = await db.collection("Category").findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "分类不存在" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData = {
      ...body,
      updatedAt: now
    };

    // 如果有slug更新，检查唯一性
    if (body.slug && body.slug !== existingCategory.slug) {
      const duplicateSlug = await db.collection("Category").findOne({ 
        slug: body.slug, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, error: "slug已存在" },
          { status: 409 }
        );
      }
    }

    const result = await db.collection("Category").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // 记录操作日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "UPDATE",
      resource: "categories",
      resourceId: id,
      oldData: existingCategory,
      newData: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: "分类更新成功",
      data: {
        id,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error("PATCH_CATEGORY_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "更新分类失败" },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "无效的分类ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 检查分类是否存在
    const existingCategory = await db.collection("Category").findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "分类不存在" },
        { status: 404 }
      );
    }

    // 检查是否有资源关联到此分类
    const resourceCount = await db.collection("Resource").countDocuments({
      categoryId: id,
      status: "ACTIVE"
    });

    if (resourceCount > 0 && !force) {
      return NextResponse.json(
        { 
          success: false, 
          error: `该分类下还有${resourceCount}个资源，请先处理这些资源或使用强制删除`,
          resourceCount,
          canForceDelete: true
        },
        { status: 409 }
      );
    }

    // 检查是否有子分类
    const childrenCount = await db.collection("Category").countDocuments({
      parentId: id
    });

    if (childrenCount > 0 && !force) {
      return NextResponse.json(
        { 
          success: false, 
          error: `该分类下还有${childrenCount}个子分类，请先处理这些子分类或使用强制删除`,
          childrenCount,
          canForceDelete: true
        },
        { status: 409 }
      );
    }

    // 如果是强制删除，处理关联数据
    if (force) {
      // 将关联资源的分类设为null
      if (resourceCount > 0) {
        await db.collection("Resource").updateMany(
          { categoryId: id },
          { 
            $set: { 
              categoryId: null, 
              updatedAt: now 
            } 
          }
        );
      }

      // 将子分类的父分类设为null
      if (childrenCount > 0) {
        await db.collection("Category").updateMany(
          { parentId: id },
          { 
            $set: { 
              parentId: null, 
              updatedAt: now 
            } 
          }
        );
      }
    }

    // 删除分类
    const result = await db.collection("Category").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "删除分类失败" },
        { status: 500 }
      );
    }

    // 记录操作日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "DELETE",
      resource: "categories",
      resourceId: id,
      oldData: existingCategory,
      newData: null,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: force ? "分类及关联数据已强制删除" : "分类删除成功",
      data: {
        id,
        name: existingCategory.name,
        deletedCount: result.deletedCount,
        resourcesUpdated: force ? resourceCount : 0,
        childrenUpdated: force ? childrenCount : 0
      }
    });

  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "删除分类失败" },
      { status: 500 }
    );
  }
}