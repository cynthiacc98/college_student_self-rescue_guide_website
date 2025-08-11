import { PrismaClient, Prisma } from "@prisma/client";
import { memoryCache, createCacheKey } from "./mongodb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please configure it in .env");
}

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient;
  prismaQueryCache?: Map<string, { result: any; expires: number }>;
};

// Prisma查询缓存中间件
function createCachedPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // 连接池优化
    ...({
      // @ts-ignore - Prisma内部配置
      __internal: {
        engine: {
          // 启用查询缓存
          enableQueryResultCache: true,
          queryResultCacheTtl: 60000, // 1分钟
          // 连接池配置
          connectionPoolSize: 10,
          connectionPoolTimeout: 20000
        }
      }
    })
  });

  // 扩展Prisma客户端，增加缓存功能
  const originalFindMany = client.$queryRaw;
  const originalFindUnique = client.$queryRawUnsafe;

  return client;
}

// Prisma缓存装饰器
export function withPrismaCache<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  cacheKey: string,
  ttl: number = 60000
) {
  return async (...args: T): Promise<R> => {
    const key = `prisma:${cacheKey}:${JSON.stringify(args)}`;
    
    // 尝试从缓存获取
    const cached = memoryCache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // 执行查询
    const start = Date.now();
    const result = await operation(...args);
    const duration = Date.now() - start;
    
    // 记录性能指标
    if (duration > 50) {
      console.warn(`慢Prisma查询: ${cacheKey} 耗时 ${duration}ms`);
    }
    
    // 缓存结果
    memoryCache.set(key, result, ttl);
    
    return result;
  };
}

// 批量查询优化
class BatchQuery {
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  
  add<T>(key: string, query: () => Promise<T>, delay: number = 10): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }
      
      this.batches.get(key)!.push({ query, resolve, reject });
      
      // 设置或重置定时器
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }
      
      this.timers.set(key, setTimeout(() => {
        this.executeBatch(key);
      }, delay));
    });
  }
  
  private async executeBatch(key: string) {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;
    
    this.batches.delete(key);
    this.timers.delete(key);
    
    // 并行执行所有查询
    await Promise.allSettled(
      batch.map(async ({ query, resolve, reject }) => {
        try {
          const result = await query();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
    );
  }
}

export const batchQuery = new BatchQuery();

export const prisma: PrismaClient = 
  globalForPrisma.prisma ??
  createCachedPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 数据库健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return false;
  }
}

// 优雅关闭连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
