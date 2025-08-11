import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 导入性能和安全模块（注释掉避免循环依赖，实际项目中需要处理）
// import { createRateLimitMiddleware, getRateLimiterForPath } from '@/lib/rate-limiter';
// import { SecurityAuditLog, securityMiddleware } from '@/lib/security';

// 基础限流实现（简化版）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const key = ip;
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// 安全检查函数
function performBasicSecurityChecks(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // 恶意User-Agent检测
  const suspiciousAgents = ['sqlmap', 'nmap', 'nikto', 'scanner'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`可疑请求被阻止: ${pathname}, UA: ${userAgent}`);
    return false;
  }
  
  // SQL注入基础检测
  const urlParams = request.nextUrl.searchParams.toString();
  const sqlPatterns = [
    /('|(\-\-)|(;))/i,
    /(union|select|insert|delete|update|drop)/i,
    /(script|javascript|vbscript)/i
  ];
  
  if (sqlPatterns.some(pattern => pattern.test(urlParams) || pattern.test(pathname))) {
    console.warn(`SQL注入尝试被阻止: ${pathname}`);
    return false;
  }
  
  // 路径遍历攻击检测
  if (pathname.includes('../') || pathname.includes('..\\')) {
    console.warn(`路径遍历攻击被阻止: ${pathname}`);
    return false;
  }
  
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();
  
  try {
    // 跳过静态文件
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('/static/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg')
    ) {
      return NextResponse.next();
    }

    // 获取客户端IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    
    // 基础安全检查
    if (!performBasicSecurityChecks(req)) {
      return NextResponse.json(
        { error: '请求被安全系统拒绝' },
        { status: 403 }
      );
    }
    
    // API路由限流
    if (pathname.startsWith('/api/')) {
      // 不同API端点不同的限流策略
      let limit = 60; // 默认每分钟60次
      
      if (pathname.includes('/auth/')) {
        limit = 5; // 认证API限制更严格
      } else if (pathname.includes('/admin/')) {
        limit = 30; // 管理API中等限制
      } else if (pathname.includes('/search/')) {
        limit = 100; // 搜索API更宽松
      }
      
      if (!checkRateLimit(ip, limit)) {
        console.warn(`API限流触发: ${pathname}, IP: ${ip}`);
        return NextResponse.json(
          { error: '请求过于频繁，请稍后再试' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }
    
    // 管理页面权限检查
    if (pathname.startsWith("/admin")) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token || token.role !== "ADMIN") {
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
    }

    // 创建响应
    const response = NextResponse.next();
    
    // 添加安全头
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API响应添加性能头
    if (pathname.startsWith('/api/')) {
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      response.headers.set('Cache-Control', 'public, max-age=60');
    }
    
    return response;
    
  } catch (error) {
    console.error('中间件执行失败:', error);
    return NextResponse.json(
      { error: '服务暂时不可用' },
      { status: 503 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的:
     * - _next/static (静态文件)
     * - _next/image (图像优化文件) 
     * - favicon.ico (网站图标)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
