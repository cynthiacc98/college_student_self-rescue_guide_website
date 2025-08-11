import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// 限流算法接口
interface RateLimiter {
  isAllowed(key: string): Promise<boolean>;
  getRemainingRequests(key: string): Promise<number>;
  getResetTime(key: string): Promise<number>;
}

// 令牌桶算法实现
class TokenBucketLimiter implements RateLimiter {
  private buckets = new Map<string, {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number;
  }>();

  constructor(
    private capacity: number = 100,
    private refillRate: number = 10, // 每秒补充令牌数
    private windowMs: number = 60000  // 时间窗口
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefill: now,
        capacity: this.capacity,
        refillRate: this.refillRate
      };
      this.buckets.set(key, bucket);
    }

    // 计算需要补充的令牌
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // 检查是否有可用令牌
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  async getRemainingRequests(key: string): Promise<number> {
    const bucket = this.buckets.get(key);
    return bucket ? bucket.tokens : this.capacity;
  }

  async getResetTime(key: string): Promise<number> {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    
    const tokensNeeded = this.capacity - bucket.tokens;
    const timeToRefill = tokensNeeded / this.refillRate * 1000;
    
    return bucket.lastRefill + timeToRefill;
  }
}

// 滑动窗口算法实现
class SlidingWindowLimiter implements RateLimiter {
  private windows = new Map<string, number[]>();

  constructor(
    private limit: number = 100,
    private windowMs: number = 60000
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let requests = this.windows.get(key) || [];
    
    // 清理过期请求
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // 检查是否超出限制
    if (requests.length >= this.limit) {
      return false;
    }
    
    // 记录当前请求
    requests.push(now);
    this.windows.set(key, requests);
    
    return true;
  }

  async getRemainingRequests(key: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.windows.get(key) || [];
    
    const activeRequests = requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.limit - activeRequests.length);
  }

  async getResetTime(key: string): Promise<number> {
    const requests = this.windows.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
}

// 分布式限流器（模拟Redis实现）
class DistributedRateLimiter implements RateLimiter {
  private redis = new Map<string, { value: number; expires: number }>();

  constructor(
    private limit: number = 100,
    private windowMs: number = 60000
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / this.windowMs)}`;
    
    let current = this.redis.get(windowKey);
    if (!current || now > current.expires) {
      current = { value: 0, expires: now + this.windowMs };
      this.redis.set(windowKey, current);
    }

    if (current.value >= this.limit) {
      return false;
    }

    current.value++;
    return true;
  }

  async getRemainingRequests(key: string): Promise<number> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const current = this.redis.get(windowKey);
    
    if (!current || now > current.expires) {
      return this.limit;
    }
    
    return Math.max(0, this.limit - current.value);
  }

  async getResetTime(key: string): Promise<number> {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowMs);
    return (currentWindow + 1) * this.windowMs;
  }
}

// 自适应限流器
class AdaptiveRateLimiter implements RateLimiter {
  private limiter: RateLimiter;
  private metrics = new Map<string, {
    successCount: number;
    errorCount: number;
    lastAdjustment: number;
    currentLimit: number;
  }>();

  constructor(
    private baseLimit: number = 100,
    private windowMs: number = 60000
  ) {
    this.limiter = new TokenBucketLimiter(baseLimit, baseLimit / 60, windowMs);
  }

  async isAllowed(key: string): Promise<boolean> {
    const metric = this.getOrCreateMetric(key);
    
    // 根据错误率动态调整限流
    this.adjustLimitBasedOnMetrics(key, metric);
    
    return this.limiter.isAllowed(key);
  }

  async getRemainingRequests(key: string): Promise<number> {
    return this.limiter.getRemainingRequests(key);
  }

  async getResetTime(key: string): Promise<number> {
    return this.limiter.getResetTime(key);
  }

  recordSuccess(key: string): void {
    const metric = this.getOrCreateMetric(key);
    metric.successCount++;
  }

  recordError(key: string): void {
    const metric = this.getOrCreateMetric(key);
    metric.errorCount++;
  }

  private getOrCreateMetric(key: string) {
    let metric = this.metrics.get(key);
    if (!metric) {
      metric = {
        successCount: 0,
        errorCount: 0,
        lastAdjustment: Date.now(),
        currentLimit: this.baseLimit
      };
      this.metrics.set(key, metric);
    }
    return metric;
  }

  private adjustLimitBasedOnMetrics(key: string, metric: any): void {
    const now = Date.now();
    const timeSinceAdjustment = now - metric.lastAdjustment;
    
    // 每分钟调整一次
    if (timeSinceAdjustment < 60000) return;
    
    const totalRequests = metric.successCount + metric.errorCount;
    if (totalRequests < 10) return;
    
    const errorRate = metric.errorCount / totalRequests;
    
    // 根据错误率调整限流
    if (errorRate > 0.1) {
      // 错误率高，降低限制
      metric.currentLimit = Math.max(10, metric.currentLimit * 0.8);
    } else if (errorRate < 0.01) {
      // 错误率低，提高限制
      metric.currentLimit = Math.min(this.baseLimit * 2, metric.currentLimit * 1.2);
    }
    
    // 重置计数器
    metric.successCount = 0;
    metric.errorCount = 0;
    metric.lastAdjustment = now;
    
    // 重新创建限流器
    this.limiter = new TokenBucketLimiter(
      metric.currentLimit,
      metric.currentLimit / 60,
      this.windowMs
    );
  }
}

// 限流器工厂
export class RateLimiterFactory {
  static createTokenBucket(capacity = 100, refillRate = 10): RateLimiter {
    return new TokenBucketLimiter(capacity, refillRate);
  }

  static createSlidingWindow(limit = 100, windowMs = 60000): RateLimiter {
    return new SlidingWindowLimiter(limit, windowMs);
  }

  static createDistributed(limit = 100, windowMs = 60000): RateLimiter {
    return new DistributedRateLimiter(limit, windowMs);
  }

  static createAdaptive(baseLimit = 100, windowMs = 60000): AdaptiveRateLimiter {
    return new AdaptiveRateLimiter(baseLimit, windowMs);
  }
}

// IP地址提取器
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // 开发环境返回固定IP
  return process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'unknown';
}

// 用户标识生成器
export function generateUserKey(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const authorization = request.headers.get('authorization') || '';
  
  // 如果有认证信息，优先使用
  if (authorization) {
    return createHash('sha256').update(authorization).digest('hex');
  }
  
  // 否则使用IP + User-Agent组合
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

// 限流中间件
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  keyGenerator: (request: NextRequest) => string = generateUserKey
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(request);
    const isAllowed = await limiter.isAllowed(key);
    
    if (!isAllowed) {
      const remaining = await limiter.getRemainingRequests(key);
      const resetTime = await limiter.getResetTime(key);
      
      return NextResponse.json(
        { 
          error: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    return null; // 允许请求通过
  };
}

// 不同API端点的限流配置
export const rateLimitConfigs = {
  // 登录API - 严格限流
  auth: RateLimiterFactory.createSlidingWindow(5, 60000), // 每分钟5次
  
  // 注册API - 中等限流
  register: RateLimiterFactory.createSlidingWindow(3, 300000), // 每5分钟3次
  
  // 资源API - 宽松限流
  resources: RateLimiterFactory.createTokenBucket(100, 50), // 令牌桶：100容量，每秒50次
  
  // 管理API - 自适应限流
  admin: RateLimiterFactory.createAdaptive(50, 60000), // 自适应：基础50次/分钟
  
  // 搜索API - 分布式限流
  search: RateLimiterFactory.createDistributed(200, 60000), // 分布式：每分钟200次
  
  // 默认限流
  default: RateLimiterFactory.createTokenBucket(60, 30) // 默认：60容量，每秒30次
};

// 获取API路径对应的限流器
export function getRateLimiterForPath(pathname: string): RateLimiter {
  if (pathname.includes('/api/auth/')) return rateLimitConfigs.auth;
  if (pathname.includes('/api/register')) return rateLimitConfigs.register;
  if (pathname.includes('/api/admin/')) return rateLimitConfigs.admin;
  if (pathname.includes('/api/resources')) return rateLimitConfigs.resources;
  if (pathname.includes('/api/search')) return rateLimitConfigs.search;
  
  return rateLimitConfigs.default;
}