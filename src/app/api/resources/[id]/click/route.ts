import { NextRequest, NextResponse } from "next/server";
import clientPromise, { withCache, createCacheKey, queryMonitor } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { globalCache } from "@/lib/cache";
import { createRateLimitMiddleware, getRateLimiterForPath, getClientIP } from "@/lib/rate-limiter";
import { SecurityAuditLog, InputValidation } from "@/lib/security";
import { realtimeManager } from "@/lib/realtime";

// 限流中间件配置
const rateLimitMiddleware = createRateLimitMiddleware(
  getRateLimiterForPath('/api/resources/click')
);

// 防重复点击缓存
const clickCache = new Map<string, number>();

// 防重复点击检查
function isDuplicateClick(ip: string, resourceId: string, timeWindow = 5000): boolean {
  const key = `${ip}:${resourceId}`;
  const lastClick = clickCache.get(key);
  const now = Date.now();
  
  if (lastClick && (now - lastClick) < timeWindow) {
    return true;
  }
  
  clickCache.set(key, now);
  
  // 清理过期缓存
  setTimeout(() => {
    if (clickCache.get(key) === now) {
      clickCache.delete(key);
    }
  }, timeWindow);
  
  return false;
}

// 优化的资源查询
async function getResourceWithCache(id: string) {
  const cacheKey = createCacheKey('resource', { id }, {});
  
  return withCache(
    cacheKey,
    async () => {
      const client = await clientPromise;
      const db = client.db();
      
      const resource = await db.collection("Resource").findOne(
        { _id: new ObjectId(id) },
        { 
          projection: { 
            _id: 1, 
            title: 1, 
            quarkLink: 1, 
            categoryId: 1,
            tags: 1
          } 
        }
      );
      
      return resource;
    },
    300000 // 5分钟缓存
  );
}

// 批量更新统计数据
class ClickStatsBuffer {
  private buffer = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  
  add(resourceId: string): void {
    const current = this.buffer.get(resourceId) || 0;
    this.buffer.set(resourceId, current + 1);
    
    // 延迟批量写入
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, 5000); // 5秒后批量写入
    }
  }
  
  private async flush(): Promise<void> {
    if (this.buffer.size === 0) return;
    
    const updates = Array.from(this.buffer.entries());
    this.buffer.clear();
    this.timer = null;
    
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // 批量更新
      const bulkOps = updates.map(([resourceId, count]) => ({
        updateOne: {
          filter: { resourceId: new ObjectId(resourceId) },
          update: {
            $inc: { clicks: count },
            $setOnInsert: { createdAt: new Date() },
            $set: { updatedAt: new Date() }
          },
          upsert: true
        }
      }));
      
      if (bulkOps.length > 0) {
        await db.collection("ResourceStat").bulkWrite(bulkOps, { ordered: false });
        
        // 更新实时统计
        for (const [resourceId, count] of updates) {
          realtimeManager.recordResourceView(resourceId);
          
          // 更新缓存中的统计数据
          const statsCacheKey = createCacheKey('resource_stats', { resourceId }, {});
          globalCache.delete(statsCacheKey);
        }
      }
      
    } catch (error) {
      console.error('批量更新点击统计失败:', error);
      
      // 重新加入缓冲区
      for (const [resourceId, count] of updates) {
        const current = this.buffer.get(resourceId) || 0;
        this.buffer.set(resourceId, current + count);
      }
    }
  }
  
  // 手动刷新
  async forceFlush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

const clickStatsBuffer = new ClickStatsBuffer();

// 定时刷新缓冲区
setInterval(() => {
  clickStatsBuffer.forceFlush();
}, 30000); // 每30秒强制刷新

// 点击跳转（GET请求）
export async function GET(
  request: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // 获取参数
    const { id } = await ctx.params;
    
    // 输入验证
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的资源ID' },
        { status: 400 }
      );
    }
    
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;
    
    // 获取客户端IP
    const clientIP = getClientIP(request);
    
    // 防重复点击检查
    if (isDuplicateClick(clientIP, id)) {
      SecurityAuditLog.logSecurityEvent(
        'duplicate_click_prevented',
        { resourceId: id, ip: clientIP },
        'low'
      );
      
      // 仍然跳转，但不计数
      const resource = await getResourceWithCache(id);
      if (!resource) {
        return NextResponse.json({ error: '资源不存在' }, { status: 404 });
      }
      
      return NextResponse.redirect(resource.quarkLink as string);
    }
    
    // 获取资源信息
    const resource = await getResourceWithCache(id);
    if (!resource) {
      SecurityAuditLog.logSecurityEvent(
        'resource_not_found',
        { resourceId: id, ip: clientIP },
        'medium'
      );
      
      return NextResponse.json({ error: '资源不存在' }, { status: 404 });
    }
    
    // 异步更新统计数据（使用缓冲区）
    clickStatsBuffer.add(id);
    
    // 记录安全日志
    SecurityAuditLog.logSecurityEvent(
      'resource_clicked',
      { 
        resourceId: id, 
        resourceTitle: resource.title,
        ip: clientIP,
        userAgent: request.headers.get('user-agent')
      },
      'low'
    );
    
    // 记录性能指标
    const duration = Date.now() - startTime;
    queryMonitor.record('resource_click', duration);
    
    // 获取跳转链接
    const redirectUrl = resource.quarkLink as string;
    
    // 验证URL安全性
    if (!InputValidation.validateURL(redirectUrl)) {
      SecurityAuditLog.logSecurityEvent(
        'unsafe_redirect_prevented',
        { resourceId: id, url: redirectUrl, ip: clientIP },
        'high'
      );
      
      return NextResponse.json(
        { error: '不安全的跳转链接' },
        { status: 400 }
      );
    }
    
    // 设置安全头并跳转
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
    
  } catch (error) {
    console.error('资源点击处理失败:', error);
    
    // 记录错误日志
    SecurityAuditLog.logSecurityEvent(
      'resource_click_error',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      },
      'high'
    );
    
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

// 记录点击统计（POST请求）
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // 获取参数
    const { id } = await ctx.params;
    
    // 输入验证
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: '无效的资源ID' },
        { status: 400 }
      );
    }
    
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;
    
    // 获取客户端IP
    const clientIP = getClientIP(request);
    
    // 防重复点击检查
    if (isDuplicateClick(clientIP, id)) {
      return NextResponse.json({
        success: false,
        error: '点击太频繁，请稍后再试'
      }, { status: 429 });
    }
    
    // 检查资源是否存在
    const client = await clientPromise;
    const db = client.db();
    
    const resource = await db.collection("Resource").findOne(
      { 
        _id: new ObjectId(id), 
        status: "ACTIVE", 
        isPublic: true 
      },
      { projection: { _id: 1, title: 1, quarkLink: 1 } }
    );
    
    if (!resource) {
      return NextResponse.json(
        { success: false, error: '资源不存在或不可用' },
        { status: 404 }
      );
    }
    
    // 更新点击统计
    const now = new Date();
    await db.collection("ResourceStat").updateOne(
      { resourceId: new ObjectId(id) },
      {
        $inc: { clicks: 1 },
        $setOnInsert: { 
          resourceId: new ObjectId(id),
          views: 0,
          likes: 0,
          createdAt: now
        },
        $set: { updatedAt: now }
      },
      { upsert: true }
    );
    
    // 记录点击日志
    SecurityAuditLog.logSecurityEvent(
      'resource_click_recorded',
      { 
        resourceId: id, 
        resourceTitle: resource.title,
        ip: clientIP,
        userAgent: request.headers.get('user-agent')
      },
      'low'
    );
    
    // 记录性能指标
    const duration = Date.now() - startTime;
    queryMonitor.record('resource_click_post', duration);
    
    return NextResponse.json({
      success: true,
      message: '点击记录成功',
      data: {
        resourceId: id,
        title: resource.title,
        downloadUrl: resource.quarkLink
      }
    });
    
  } catch (error) {
    console.error('记录点击统计失败:', error);
    
    // 记录错误日志
    SecurityAuditLog.logSecurityEvent(
      'resource_click_record_error',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      },
      'high'
    );
    
    return NextResponse.json(
      { 
        success: false,
        error: '记录点击失败',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
