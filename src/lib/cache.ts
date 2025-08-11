import { createHash } from 'crypto';

// 多层缓存系统
export interface CacheOptions {
  ttl?: number; // 生存时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  compress?: boolean; // 是否压缩大数据
}

// L1缓存 - 内存缓存（最快）
class L1Cache {
  private cache = new Map<string, {
    data: any;
    expires: number;
    size: number;
    hits: number;
    lastAccessed: number;
  }>();
  
  private maxSize: number;
  private currentSize = 0;
  private maxMemory = 100 * 1024 * 1024; // 100MB

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: any, ttl = 300000): boolean {
    const size = this.calculateSize(value);
    
    // 检查内存限制
    if (this.currentSize + size > this.maxMemory) {
      this.evictLRU();
    }
    
    // LRU驱逐策略
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const expires = Date.now() + ttl;
    this.cache.set(key, {
      data: value,
      expires,
      size,
      hits: 0,
      lastAccessed: Date.now()
    });

    this.currentSize += size;
    return true;
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.delete(key);
      return null;
    }

    item.hits++;
    item.lastAccessed = Date.now();
    return item.data;
  }

  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // 粗略估算字节大小
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }

  getStats() {
    const items = Array.from(this.cache.values());
    const totalHits = items.reduce((sum, item) => sum + item.hits, 0);
    const totalRequests = totalHits + this.cache.size;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this.currentSize,
      maxMemory: this.maxMemory,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalRequests
    };
  }
}

// Redis客户端模拟（用于L2缓存）
class RedisCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  async set(key: string, value: any, ttl = 3600): Promise<boolean> {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttl * 1000
    });
    return true;
  }

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// 多层缓存管理器
class MultiLevelCache {
  private l1: L1Cache;
  private l2: RedisCache;

  constructor() {
    this.l1 = new L1Cache(2000);
    this.l2 = new RedisCache();
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300000 } = options;
    
    // 同时设置L1和L2缓存
    this.l1.set(key, value, ttl);
    await this.l2.set(key, value, ttl / 1000);
  }

  async get(key: string): Promise<any> {
    // 先查L1缓存
    let result = this.l1.get(key);
    if (result !== null) {
      return result;
    }

    // 再查L2缓存
    result = await this.l2.get(key);
    if (result !== null) {
      // 回写到L1缓存
      this.l1.set(key, result);
      return result;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    await this.l2.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.l1.get(key) !== null || await this.l2.exists(key);
  }

  getStats() {
    return {
      l1: this.l1.getStats(),
      // l2统计可以在这里添加
    };
  }
}

// 缓存键生成器
export class CacheKeyBuilder {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  build(parts: (string | number | object)[]): string {
    const keyParts = [this.prefix, ...parts.map(part => 
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    )];
    
    const key = keyParts.join(':');
    
    // 对长键进行哈希处理
    if (key.length > 250) {
      return `${this.prefix}:${createHash('sha256').update(key).digest('hex')}`;
    }
    
    return key;
  }
}

// 智能缓存装饰器
export function cacheable<T extends any[], R>(
  keyBuilder: CacheKeyBuilder,
  options: CacheOptions = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyBuilder.build([propertyKey, ...args]);
      
      // 尝试从缓存获取
      const cached = await globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 缓存结果
      await globalCache.set(cacheKey, result, options);
      
      return result;
    };

    return descriptor;
  };
}

// 全局缓存实例
export const globalCache = new MultiLevelCache();

// 缓存预热策略
export class CacheWarmup {
  private strategies = new Map<string, () => Promise<void>>();

  register(name: string, strategy: () => Promise<void>): void {
    this.strategies.set(name, strategy);
  }

  async warmup(names?: string[]): Promise<void> {
    const toWarmup = names || Array.from(this.strategies.keys());
    
    await Promise.all(
      toWarmup.map(name => {
        const strategy = this.strategies.get(name);
        return strategy ? strategy() : Promise.resolve();
      })
    );
  }
}

export const cacheWarmup = new CacheWarmup();

// 缓存失效策略
export class CacheInvalidation {
  private patterns = new Map<string, RegExp>();

  registerPattern(name: string, pattern: string): void {
    this.patterns.set(name, new RegExp(pattern));
  }

  async invalidateByPattern(patternName: string): Promise<void> {
    const pattern = this.patterns.get(patternName);
    if (!pattern) return;

    // 实际应用中需要实现模式匹配删除
    console.log(`缓存失效模式: ${pattern}`);
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    // 基于标签的缓存失效
    for (const tag of tags) {
      await globalCache.delete(`tag:${tag}`);
    }
  }
}

export const cacheInvalidation = new CacheInvalidation();