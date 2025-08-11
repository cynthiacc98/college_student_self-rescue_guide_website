import { MongoClient, MongoClientOptions } from "mongodb";
import { createHash } from "crypto";

const uri = process.env.DATABASE_URL as string | undefined;

if (!uri) {
  throw new Error("DATABASE_URL is not set. Please configure it in .env");
}

// 优化的连接选项 - 高性能生产级配置
const mongoOptions: MongoClientOptions = {
  // 连接池优化
  minPoolSize: 5,
  maxPoolSize: 50,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // 性能优化
  maxStalenessSeconds: 90,
  readPreference: 'secondaryPreferred',
  retryWrites: true,
  retryReads: true,
  
  // 压缩优化 - 仅使用内置的zlib压缩器
  compressors: ['zlib'],
  
  // 监控和日志
  monitorCommands: process.env.NODE_ENV === 'development'
};

let clientPromise: Promise<MongoClient>;

const globalWithMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
};

if (process.env.NODE_ENV !== "production") {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, mongoOptions);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  const client = new MongoClient(uri, mongoOptions);
  clientPromise = client.connect();
}

// 内存缓存系统
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number; hits: number }>();
  private maxSize = 1000;
  private defaultTTL = 300000; // 5分钟
  
  set(key: string, value: any, ttl?: number): void {
    // LRU策略 - 清理超出大小限制的缓存
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      expires: Date.now() + (ttl || this.defaultTTL),
      hits: 0
    });
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    item.hits++;
    return item.data;
  }
  
  del(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  stats() {
    const totalHits = Array.from(this.cache.values()).reduce((sum, item) => sum + item.hits, 0);
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      hitRate: totalHits > 0 ? totalHits / (totalHits + this.cache.size) : 0
    };
  }
}

export const memoryCache = new MemoryCache();

// 查询优化辅助函数
export function createCacheKey(collection: string, query: any, options?: any): string {
  const queryStr = JSON.stringify({ collection, query, options });
  return createHash('md5').update(queryStr).digest('hex');
}

// 性能监控
class QueryPerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();
  
  record(operation: string, duration: number) {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(operation, existing);
    
    // 警告慢查询
    if (duration > 100) {
      console.warn(`慢查询警告: ${operation} 耗时 ${duration}ms`);
    }
  }
  
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

// 优化的数据库操作包装器
export async function withCache<T>(
  key: string,
  operation: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = memoryCache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  // 执行操作并缓存结果
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;
  
  // 记录性能指标
  queryMonitor.record(key, duration);
  
  // 缓存结果
  memoryCache.set(key, result, ttl);
  
  return result;
}

export default clientPromise;
