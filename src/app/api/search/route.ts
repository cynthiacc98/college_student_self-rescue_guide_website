import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface SearchQuery {
  q?: string;
  category?: string;
  difficulty?: string;
  fileFormat?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query: SearchQuery = {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      difficulty: searchParams.get('difficulty') || '',
      fileFormat: searchParams.get('fileFormat') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '12'
    };

    const client = await clientPromise;
    const db = client.db();
    
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '12');
    const skip = (page - 1) * limit;

    // 构建搜索条件
    const searchConditions: any = {
      isPublic: true,
      status: "ACTIVE"
    };

    // 文本搜索
    if (query.q) {
      searchConditions.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
        { tags: { $in: [new RegExp(query.q, 'i')] } }
      ];
    }

    // 分类筛选
    if (query.category) {
      const category = await db.collection("Category").findOne({ slug: query.category });
      if (category) {
        searchConditions.categoryId = category._id.toString();
      }
    }

    // 难度筛选
    if (query.difficulty) {
      searchConditions.difficulty = query.difficulty;
    }

    // 文件格式筛选
    if (query.fileFormat) {
      searchConditions.fileFormat = { $regex: query.fileFormat, $options: 'i' };
    }

    // 构建排序条件
    const sortConditions: any = {};
    switch (query.sortBy) {
      case 'rating':
        sortConditions.rating = query.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'downloadCount':
        sortConditions.downloadCount = query.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
        sortConditions.createdAt = query.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'title':
        sortConditions.title = query.sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortConditions.createdAt = -1;
    }

    // 执行搜索
    const [resources, totalCount] = await Promise.all([
      db.collection("Resource")
        .find(searchConditions)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("Resource").countDocuments(searchConditions)
    ]);

    // 获取资源统计信息
    const resourcesWithStats = await Promise.all(
      resources.map(async (resource) => {
        const stats = await db.collection("ResourceStat").findOne({
          resourceId: resource._id
        });
        
        const category = resource.categoryId 
          ? await db.collection("Category").findOne({ _id: new ObjectId(resource.categoryId) })
          : null;

        const author = resource.authorId
          ? await db.collection("users").findOne({ _id: new ObjectId(resource.authorId) })
          : null;

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
        };
      })
    );

    // 获取搜索建议（热门标签）
    const popularTags = await db.collection("Resource")
      .aggregate([
        { $match: { isPublic: true, status: "ACTIVE" } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, tag: "$_id", count: 1 } }
      ])
      .toArray();

    // 获取分类统计
    const categoryStats = await db.collection("Category")
      .aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "Resource",
            let: { categoryId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$categoryId", "$$categoryId"] },
                  isPublic: true,
                  status: "ACTIVE"
                }
              }
            ],
            as: "resources"
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            color: 1,
            iconUrl: 1,
            resourceCount: { $size: "$resources" }
          }
        },
        { $sort: { resourceCount: -1 } }
      ])
      .toArray();

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        resources: resourcesWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          pageSize: limit
        },
        filters: {
          categories: categoryStats,
          popularTags,
          difficulties: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
          fileFormats: ['PDF', 'DOC', 'PPT', 'VIDEO', 'AUDIO', 'ZIP']
        },
        query
      }
    });

  } catch (error) {
    console.error("SEARCH_ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "搜索失败", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// 搜索建议API
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // 搜索标题匹配的资源
    const titleSuggestions = await db.collection("Resource")
      .find({
        title: { $regex: query, $options: 'i' },
        isPublic: true,
        status: "ACTIVE"
      })
      .limit(5)
      .project({ title: 1, slug: 1 })
      .toArray();

    // 搜索标签匹配
    const tagSuggestions = await db.collection("Resource")
      .aggregate([
        { 
          $match: { 
            tags: { $in: [new RegExp(query, 'i')] },
            isPublic: true,
            status: "ACTIVE"
          } 
        },
        { $unwind: "$tags" },
        { 
          $match: { 
            tags: { $regex: query, $options: 'i' } 
          } 
        },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, tag: "$_id", count: 1 } }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        suggestions: {
          titles: titleSuggestions.map(r => ({
            text: r.title,
            type: 'resource',
            slug: r.slug
          })),
          tags: tagSuggestions.map(t => ({
            text: t.tag,
            type: 'tag',
            count: t.count
          }))
        }
      }
    });

  } catch (error) {
    console.error("SEARCH_SUGGESTION_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "搜索建议失败" },
      { status: 500 }
    );
  }
}