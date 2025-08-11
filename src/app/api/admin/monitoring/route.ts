import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { queryMonitor, memoryCache } from '@/lib/mongodb';
import { globalCache } from '@/lib/cache';
import { rateLimitConfigs } from '@/lib/rate-limiter';
import { SecurityAuditLog } from '@/lib/security';
import { realtimeManager } from '@/lib/realtime';
import { prisma, checkDatabaseHealth } from '@/lib/prisma';
import clientPromise from '@/lib/mongodb';
import { promisify } from 'util';

// 系统性能监控器
class SystemMonitor {
  // 获取数据库性能指标
  async getDatabaseMetrics() {
    const startTime = Date.now();
    
    try {
      // 检查数据库健康状态
      const [prismaHealth, mongoHealth] = await Promise.all([
        checkDatabaseHealth(),
        this.checkMongoHealth()
      ]);

      // 获取查询性能指标
      const queryMetrics = queryMonitor.getMetrics();
      
      // 获取数据库连接池状态
      const connectionMetrics = await this.getConnectionMetrics();
      
      return {
        health: {
          prisma: prismaHealth,
          mongodb: mongoHealth,
          overall: prismaHealth && mongoHealth
        },
        performance: {
          queryMetrics,
          connectionMetrics,
          responseTime: Date.now() - startTime
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        health: {
          prisma: false,
          mongodb: false,
          overall: false
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  // 检查MongoDB健康状态
  private async checkMongoHealth(): Promise<boolean> {
    try {
      const client = await clientPromise;
      await client.db().admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB健康检查失败:', error);
      return false;
    }
  }

  // 获取连接池指标
  private async getConnectionMetrics() {
    try {
      const client = await clientPromise;
      const serverStatus = await client.db().admin().serverStatus();
      
      return {
        mongodb: {
          connections: serverStatus.connections,
          network: serverStatus.network,
          opcounters: serverStatus.opcounters
        }
      };
    } catch (error) {
      return {
        mongodb: {
          error: 'Failed to get connection metrics'
        }
      };
    }
  }

  // 获取缓存性能指标
  getCacheMetrics() {
    const memStats = memoryCache.stats();
    const globalStats = globalCache.getStats();
    
    return {
      memory: memStats,
      multilevel: globalStats,
      timestamp: Date.now()
    };
  }

  // 获取限流状态
  async getRateLimitMetrics() {
    const metrics: any = {};
    
    for (const [name, limiter] of Object.entries(rateLimitConfigs)) {
      try {
        metrics[name] = {
          remaining: await limiter.getRemainingRequests('test_key'),
          resetTime: await limiter.getResetTime('test_key')
        };
      } catch (error) {
        metrics[name] = {
          error: 'Failed to get rate limit metrics'
        };
      }
    }
    
    return {
      configs: metrics,
      timestamp: Date.now()
    };
  }

  // 获取实时数据指标
  getRealtimeMetrics() {
    const stats = realtimeManager.getRealtimeStats();
    
    return {
      realtime: stats,
      timestamp: Date.now()
    };
  }

  // 获取系统资源使用情况
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memUsage.rss / 1024 / 1024, // MB
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        external: memUsage.external / 1024 / 1024,
        arrayBuffers: memUsage.arrayBuffers / 1024 / 1024
      },
      cpu: {
        user: cpuUsage.user / 1000, // ms
        system: cpuUsage.system / 1000
      },
      uptime: process.uptime(), // seconds
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: Date.now()
    };
  }

  // 获取安全指标
  getSecurityMetrics() {
    // 获取最近的安全事件
    const securityEvents = SecurityAuditLog.getAuditLogs({
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
    });

    // 按严重级别统计
    const eventsByLevel = securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 按事件类型统计
    const eventsByType = securityEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      eventCount: securityEvents.length,
      eventsByLevel,
      eventsByType,
      recentEvents: securityEvents.slice(0, 10), // 最近10个事件
      timestamp: Date.now()
    };
  }

  // 运行完整的健康检查
  async runHealthCheck() {
    const startTime = Date.now();
    
    const [
      database,
      cache,
      rateLimit,
      realtime,
      system,
      security
    ] = await Promise.all([
      this.getDatabaseMetrics(),
      Promise.resolve(this.getCacheMetrics()),
      this.getRateLimitMetrics(),
      Promise.resolve(this.getRealtimeMetrics()),
      Promise.resolve(this.getSystemMetrics()),
      Promise.resolve(this.getSecurityMetrics())
    ]);

    const totalTime = Date.now() - startTime;
    
    // 计算整体健康分数
    const healthScore = this.calculateHealthScore({
      database,
      cache,
      system,
      security
    });

    return {
      health: {
        score: healthScore,
        status: healthScore >= 0.8 ? 'healthy' : healthScore >= 0.6 ? 'warning' : 'critical'
      },
      metrics: {
        database,
        cache,
        rateLimit,
        realtime,
        system,
        security
      },
      performance: {
        checkDuration: totalTime,
        timestamp: Date.now()
      }
    };
  }

  // 计算健康分数
  private calculateHealthScore(metrics: any): number {
    let score = 0;
    let factors = 0;

    // 数据库健康 (30% 权重)
    if (metrics.database.health?.overall) {
      score += 0.3;
    }
    factors += 0.3;

    // 缓存命中率 (20% 权重)
    const cacheHitRate = metrics.cache.memory?.hitRate || 0;
    score += 0.2 * cacheHitRate;
    factors += 0.2;

    // 内存使用 (20% 权重)
    const memUsage = metrics.system.memory.heapUsed / metrics.system.memory.heapTotal;
    score += 0.2 * (1 - Math.min(memUsage, 1)); // 内存使用越少分数越高
    factors += 0.2;

    // 安全事件 (15% 权重)
    const criticalEvents = metrics.security.eventsByLevel?.critical || 0;
    const highEvents = metrics.security.eventsByLevel?.high || 0;
    const securityPenalty = Math.min((criticalEvents * 0.1 + highEvents * 0.05), 0.15);
    score += 0.15 - securityPenalty;
    factors += 0.15;

    // 响应时间 (15% 权重)
    const responseTime = metrics.database.performance?.responseTime || 1000;
    const responseScore = Math.max(0, 1 - responseTime / 1000); // 1秒以内满分
    score += 0.15 * responseScore;
    factors += 0.15;

    return Math.max(0, Math.min(1, score / factors));
  }
}

const systemMonitor = new SystemMonitor();

export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const forbid = await requireAdmin();
    if (forbid) return forbid;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const detailed = searchParams.get('detailed') === 'true';

    let result: any = {};

    switch (type) {
      case 'database':
        result = await systemMonitor.getDatabaseMetrics();
        break;
        
      case 'cache':
        result = systemMonitor.getCacheMetrics();
        break;
        
      case 'ratelimit':
        result = await systemMonitor.getRateLimitMetrics();
        break;
        
      case 'realtime':
        result = systemMonitor.getRealtimeMetrics();
        break;
        
      case 'system':
        result = systemMonitor.getSystemMetrics();
        break;
        
      case 'security':
        result = systemMonitor.getSecurityMetrics();
        break;
        
      case 'health':
        result = await systemMonitor.runHealthCheck();
        break;
        
      default: // 'all'
        if (detailed) {
          result = await systemMonitor.runHealthCheck();
        } else {
          // 简化的监控数据
          const [database, cache, system] = await Promise.all([
            systemMonitor.getDatabaseMetrics(),
            Promise.resolve(systemMonitor.getCacheMetrics()),
            Promise.resolve(systemMonitor.getSystemMetrics())
          ]);
          
          result = {
            summary: {
              database: database.health?.overall || false,
              cache: cache.memory?.hitRate || 0,
              memory: system.memory.heapUsed / system.memory.heapTotal,
              uptime: system.uptime
            },
            timestamp: Date.now()
          };
        }
        break;
    }

    // 记录监控访问
    SecurityAuditLog.logSecurityEvent(
      'monitoring_accessed',
      { type, detailed },
      'low'
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取监控数据失败:', error);
    
    SecurityAuditLog.logSecurityEvent(
      'monitoring_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'medium'
    );
    
    return NextResponse.json(
      { 
        error: '获取监控数据失败',
        code: 'MONITORING_ERROR'
      },
      { status: 500 }
    );
  }
}

// 性能警报检查
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const forbid = await requireAdmin();
    if (forbid) return forbid;

    const body = await request.json();
    const { action, thresholds } = body;

    if (action === 'check_alerts') {
      const healthCheck = await systemMonitor.runHealthCheck();
      const alerts: any[] = [];

      // 检查各种性能指标
      const { metrics, health } = healthCheck;

      // 数据库健康告警
      if (!metrics.database.health?.overall) {
        alerts.push({
          type: 'critical',
          component: 'database',
          message: '数据库连接异常',
          timestamp: Date.now()
        });
      }

      // 内存使用告警
      const memUsage = metrics.system.memory.heapUsed / metrics.system.memory.heapTotal;
      if (memUsage > (thresholds?.memory || 0.8)) {
        alerts.push({
          type: 'warning',
          component: 'memory',
          message: `内存使用率过高: ${(memUsage * 100).toFixed(1)}%`,
          value: memUsage,
          timestamp: Date.now()
        });
      }

      // 缓存命中率告警
      const cacheHitRate = metrics.cache.memory?.hitRate || 0;
      if (cacheHitRate < (thresholds?.cacheHitRate || 0.6)) {
        alerts.push({
          type: 'warning',
          component: 'cache',
          message: `缓存命中率偏低: ${(cacheHitRate * 100).toFixed(1)}%`,
          value: cacheHitRate,
          timestamp: Date.now()
        });
      }

      // 安全事件告警
      const criticalEvents = metrics.security.eventsByLevel?.critical || 0;
      if (criticalEvents > 0) {
        alerts.push({
          type: 'critical',
          component: 'security',
          message: `检测到${criticalEvents}个严重安全事件`,
          value: criticalEvents,
          timestamp: Date.now()
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          healthScore: health.score,
          status: health.status,
          alerts,
          timestamp: Date.now()
        }
      });
    }

    return NextResponse.json(
      { error: '不支持的操作' },
      { status: 400 }
    );

  } catch (error) {
    console.error('性能告警检查失败:', error);
    
    return NextResponse.json(
      { 
        error: '性能告警检查失败',
        code: 'ALERT_CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}