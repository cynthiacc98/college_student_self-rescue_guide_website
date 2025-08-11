import { NextRequest, NextResponse } from "next/server";
import { prisma, withPrismaCache, batchQuery } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { resourceSchema } from "@/lib/validators";
import clientPromise, { withCache, createCacheKey, queryMonitor } from "@/lib/mongodb";
import { globalCache, CacheKeyBuilder } from "@/lib/cache";
import { createRateLimitMiddleware, getRateLimiterForPath } from "@/lib/rate-limiter";
import { InputValidation, SecurityAuditLog, securityMiddleware } from "@/lib/security";
import { realtimeManager } from "@/lib/realtime";

// 缓存键构建器
const cacheKeyBuilder = new CacheKeyBuilder('admin:resources');

// 限流中间件
const rateLimitMiddleware = createRateLimitMiddleware(
  getRateLimiterForPath('/api/admin/resources')
);

// 高性能分页查询
async function getPaginatedResources({
  page = 1,
  limit = 20,
  search,
  category,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const offset = (page - 1) * limit;
  const cacheKey = cacheKeyBuilder.build([
    'paginated', page, limit, search || '', category || '', sortBy, sortOrder
  ]);

  return withCache(
    cacheKey,
    async () => {
      // 构建查询条件
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ];
      }
      
      if (category) {
        where.categoryId = category;
      }

      // 并行查询数据和总数
      const [items, total] = await Promise.all([
        prisma.resource.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }),
        prisma.resource.count({ where })
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    },
    300000 // 5分钟缓存
  );
}

export async function GET(request: NextRequest) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;

    // 权限检查
    const forbid = await requireAdmin();
    if (forbid) return forbid;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // 最大100条
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // 输入验证
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: '无效的分页参数' },
        { status: 400 }
      );
    }

    // 获取分页数据
    const result = await getPaginatedResources({
      page,
      limit,
      search: search ? InputValidation.sanitizeHTML(search) : undefined,
      category,
      sortBy,
      sortOrder
    });

    // 记录审计日志
    SecurityAuditLog.logSecurityEvent(
      'admin_resources_accessed',
      { page, limit, search, category, sortBy, sortOrder },
      'low'
    );

    // 应用安全头
    const response = NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now()
    });

    return securityMiddleware.securityHeaders(response);
    
  } catch (error) {
    console.error('获取资源列表失败:', error);
    
    // 记录错误日志
    SecurityAuditLog.logSecurityEvent(
      'admin_resources_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'high'
    );
    
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let startTime = Date.now();
  
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;

    // 权限检查
    const forbid = await requireAdmin();
    if (forbid) return forbid;

    // 解析请求体
    const body = await request.text();
    const json = JSON.parse(body);
    
    // 输入验证和净化
    const sanitizedData = InputValidation.sanitizeNoSQL(json);
    const parsed = resourceSchema.safeParse(sanitizedData);
    
    if (!parsed.success) {
      SecurityAuditLog.logSecurityEvent(
        'admin_resource_validation_failed',
        { errors: parsed.error.errors, input: sanitizedData },
        'medium'
      );
      
      return NextResponse.json(
        { 
          error: '输入数据无效',
          details: parsed.error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // 检查slug唯一性（使用缓存）
    const slugCacheKey = cacheKeyBuilder.build(['slug_exists', parsed.data.slug]);
    const exists = await withCache(
      slugCacheKey,
      async () => {
        return await prisma.resource.findFirst({ 
          where: { slug: parsed.data.slug },
          select: { id: true }
        });
      },
      60000 // 1分钟缓存
    );
    
    if (exists) {
      return NextResponse.json(
        { 
          error: 'slug已存在',
          code: 'SLUG_EXISTS'
        },
        { status: 409 }
      );
    }

    // 使用事务创建资源
    const result = await prisma.$transaction(async (tx) => {
      // 创建资源记录
      const resource = await tx.resource.create({
        data: {
          ...parsed.data,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      return resource;
    });

    // 在MongoDB中创建统计记录
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('ResourceStat').insertOne({
      resourceId: result.id,
      views: 0,
      clicks: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 清除相关缓存
    await globalCache.delete(slugCacheKey);
    
    // 实时通知资源创建
    realtimeManager.emit('resource:created', {
      type: 'resource:created',
      data: {
        id: result.id,
        title: result.title,
        category: result.category?.name
      },
      timestamp: Date.now()
    });

    // 记录成功审计日志
    SecurityAuditLog.logSecurityEvent(
      'admin_resource_created',
      { resourceId: result.id, title: result.title },
      'low'
    );

    // 记录性能指标
    const duration = Date.now() - startTime;
    queryMonitor.record('create_resource', duration);

    const response = NextResponse.json({
      success: true,
      data: {
        id: result.id,
        slug: result.slug,
        title: result.title
      },
      timestamp: Date.now()
    }, { status: 201 });

    return securityMiddleware.securityHeaders(response);
    
  } catch (error) {
    console.error('创建资源失败:', error);
    
    // 记录错误日志
    SecurityAuditLog.logSecurityEvent(
      'admin_resource_creation_failed',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      },
      'high'
    );
    
    return NextResponse.json(
      { 
        error: '创建资源失败',
        code: 'CREATION_FAILED',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
