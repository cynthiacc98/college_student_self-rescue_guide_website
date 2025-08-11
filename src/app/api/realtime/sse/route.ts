import { NextRequest } from 'next/server';
import { SSEConnection, realtimeManager, getRealtimeData } from '@/lib/realtime';
import { createRateLimitMiddleware, getRateLimiterForPath } from '@/lib/rate-limiter';
import { SecurityAuditLog } from '@/lib/security';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// 限流配置 - SSE连接限制
const rateLimitMiddleware = createRateLimitMiddleware(
  getRateLimiterForPath('/api/realtime/sse')
);

export async function GET(request: NextRequest) {
  try {
    // 限流检查
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;

    // 获取用户会话
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 创建SSE连接
    const sseConnection = new SSEConnection(userId);
    const response = sseConnection.createResponse();

    // 记录连接建立
    SecurityAuditLog.logSecurityEvent(
      'sse_connection_established',
      { userId, userAgent: request.headers.get('user-agent') },
      'low'
    );

    // 如果用户已登录，添加到用户会话
    if (userId) {
      realtimeManager.addUserSession({
        userId,
        socketId: `sse_${Date.now()}_${Math.random().toString(36)}`,
        lastSeen: Date.now(),
        metadata: {
          connectionType: 'sse',
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });
    }

    // 发送初始数据
    const initialData = await getRealtimeData();
    sseConnection.send({
      type: 'initial_data',
      data: initialData,
      timestamp: Date.now()
    });

    // 设置事件监听器
    const handleResourceView = (data: any) => {
      sseConnection.send({
        type: 'resource:view',
        data,
        timestamp: Date.now()
      });
    };

    const handleUserActivity = (data: any) => {
      sseConnection.send({
        type: 'user:activity',
        data,
        timestamp: Date.now()
      });
    };

    const handleStatsUpdate = (data: any) => {
      sseConnection.send({
        type: 'stats:update',
        data,
        timestamp: Date.now()
      });
    };

    // 监听实时事件
    realtimeManager.on('resource:view', handleResourceView);
    realtimeManager.on('user:online', handleUserActivity);
    realtimeManager.on('user:offline', handleUserActivity);
    realtimeManager.on('stats:update', handleStatsUpdate);

    // 连接关闭时清理
    request.signal.addEventListener('abort', () => {
      // 移除事件监听器
      realtimeManager.off('resource:view', handleResourceView);
      realtimeManager.off('user:online', handleUserActivity);
      realtimeManager.off('user:offline', handleUserActivity);
      realtimeManager.off('stats:update', handleStatsUpdate);

      // 移除用户会话
      if (userId) {
        realtimeManager.removeUserSession(userId);
      }

      // 关闭SSE连接
      sseConnection.close();

      // 记录连接关闭
      SecurityAuditLog.logSecurityEvent(
        'sse_connection_closed',
        { userId },
        'low'
      );
    });

    return response;

  } catch (error) {
    console.error('SSE连接失败:', error);
    
    SecurityAuditLog.logSecurityEvent(
      'sse_connection_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );

    return new Response(
      JSON.stringify({ error: 'SSE连接失败' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}