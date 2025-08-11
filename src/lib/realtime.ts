import { EventEmitter } from 'events';
import { globalCache } from './cache';

// 实时事件类型定义
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

// 用户会话管理
export interface UserSession {
  userId: string;
  socketId: string;
  lastSeen: number;
  metadata: Record<string, any>;
}

// 实时统计数据结构
export interface RealtimeStats {
  resourceViews: Map<string, number>;
  activeUsers: Map<string, UserSession>;
  searchQueries: Array<{ query: string; timestamp: number; userId?: string }>;
  hotResources: Array<{ id: string; score: number; timestamp: number }>;
}

// 实时数据管理器
class RealtimeManager extends EventEmitter {
  private stats: RealtimeStats;
  private connections = new Map<string, any>();
  private rooms = new Map<string, Set<string>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.stats = {
      resourceViews: new Map(),
      activeUsers: new Map(),
      searchQueries: [],
      hotResources: []
    };

    this.startHeartbeat();
    this.setupEventHandlers();
  }

  // 启动心跳检测
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveSessions();
      this.updateHotResources();
      this.broadcastStats();
    }, 30000); // 每30秒执行一次
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    this.on('resource:view', this.handleResourceView.bind(this));
    this.on('user:online', this.handleUserOnline.bind(this));
    this.on('user:offline', this.handleUserOffline.bind(this));
    this.on('search:query', this.handleSearchQuery.bind(this));
  }

  // 用户上线
  addUserSession(session: UserSession): void {
    this.stats.activeUsers.set(session.userId, session);
    this.emit('user:online', session);
    
    // 缓存用户会话
    globalCache.set(`session:${session.userId}`, session, { ttl: 3600000 }); // 1小时
  }

  // 用户下线
  removeUserSession(userId: string): void {
    const session = this.stats.activeUsers.get(userId);
    if (session) {
      this.stats.activeUsers.delete(userId);
      this.emit('user:offline', session);
      globalCache.delete(`session:${userId}`);
    }
  }

  // 记录资源浏览
  recordResourceView(resourceId: string, userId?: string): void {
    const currentViews = this.stats.resourceViews.get(resourceId) || 0;
    this.stats.resourceViews.set(resourceId, currentViews + 1);
    
    this.emit('resource:view', { 
      resourceId, 
      userId, 
      views: currentViews + 1,
      timestamp: Date.now() 
    });

    // 缓存热门资源数据
    this.updateResourceHotScore(resourceId);
  }

  // 记录搜索查询
  recordSearchQuery(query: string, userId?: string): void {
    const searchEvent = {
      query,
      timestamp: Date.now(),
      userId
    };

    this.stats.searchQueries.push(searchEvent);
    
    // 保持最近1000条搜索记录
    if (this.stats.searchQueries.length > 1000) {
      this.stats.searchQueries = this.stats.searchQueries.slice(-1000);
    }

    this.emit('search:query', searchEvent);
  }

  // 获取实时统计
  getRealtimeStats(): {
    activeUsersCount: number;
    totalResourceViews: number;
    recentSearches: number;
    hotResources: Array<{ id: string; score: number; views: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    return {
      activeUsersCount: this.stats.activeUsers.size,
      totalResourceViews: Array.from(this.stats.resourceViews.values())
        .reduce((sum, views) => sum + views, 0),
      recentSearches: this.stats.searchQueries
        .filter(search => search.timestamp > oneHourAgo).length,
      hotResources: this.stats.hotResources
        .slice(0, 10)
        .map(item => ({
          id: item.id,
          score: item.score,
          views: this.stats.resourceViews.get(item.id) || 0
        }))
    };
  }

  // 获取搜索建议
  getSearchSuggestions(query: string, limit = 5): string[] {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 3600000;
    
    // 基于最近搜索历史生成建议
    const recentSearches = this.stats.searchQueries
      .filter(search => 
        search.timestamp > oneWeekAgo && 
        search.query.toLowerCase().includes(query.toLowerCase())
      )
      .map(search => search.query);

    // 去重并计算频率
    const suggestions = new Map<string, number>();
    recentSearches.forEach(search => {
      suggestions.set(search, (suggestions.get(search) || 0) + 1);
    });

    // 按频率排序并返回前N个
    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }

  // 处理资源浏览事件
  private handleResourceView(event: any): void {
    // 广播到相关房间
    this.broadcastToRoom(`resource:${event.resourceId}`, {
      type: 'resource:view',
      data: event
    });

    // 更新缓存中的统计数据
    globalCache.set(
      `resource:views:${event.resourceId}`, 
      event.views,
      { ttl: 3600000 }
    );
  }

  // 处理用户上线事件
  private handleUserOnline(session: UserSession): void {
    this.broadcastToRoom('global', {
      type: 'user:online',
      data: {
        userId: session.userId,
        activeUsersCount: this.stats.activeUsers.size
      }
    });
  }

  // 处理用户下线事件
  private handleUserOffline(session: UserSession): void {
    this.broadcastToRoom('global', {
      type: 'user:offline',
      data: {
        userId: session.userId,
        activeUsersCount: this.stats.activeUsers.size
      }
    });
  }

  // 处理搜索查询事件
  private handleSearchQuery(event: any): void {
    // 实时更新搜索趋势
    const suggestions = this.getSearchSuggestions(event.query);
    
    this.broadcastToRoom('search', {
      type: 'search:suggestions',
      data: {
        query: event.query,
        suggestions
      }
    });
  }

  // 更新资源热度评分
  private updateResourceHotScore(resourceId: string): void {
    const now = Date.now();
    const views = this.stats.resourceViews.get(resourceId) || 0;
    const timeDecay = 0.9; // 时间衰减因子
    
    // 计算热度评分（结合浏览量和时间因子）
    const score = views * Math.pow(timeDecay, (now - Date.now()) / 3600000);
    
    // 更新热门资源列表
    const existingIndex = this.stats.hotResources.findIndex(item => item.id === resourceId);
    const hotResource = { id: resourceId, score, timestamp: now };
    
    if (existingIndex >= 0) {
      this.stats.hotResources[existingIndex] = hotResource;
    } else {
      this.stats.hotResources.push(hotResource);
    }
    
    // 按分数排序
    this.stats.hotResources.sort((a, b) => b.score - a.score);
    
    // 保持前50个热门资源
    this.stats.hotResources = this.stats.hotResources.slice(0, 50);
  }

  // 清理非活跃会话
  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveThreshold = 10 * 60 * 1000; // 10分钟

    for (const [userId, session] of this.stats.activeUsers.entries()) {
      if (now - session.lastSeen > inactiveThreshold) {
        this.removeUserSession(userId);
      }
    }
  }

  // 更新热门资源
  private updateHotResources(): void {
    const now = Date.now();
    const timeDecay = 0.95;

    // 应用时间衰减
    this.stats.hotResources = this.stats.hotResources.map(item => ({
      ...item,
      score: item.score * Math.pow(timeDecay, (now - item.timestamp) / 3600000)
    })).filter(item => item.score > 0.1); // 移除分数过低的项目

    // 重新排序
    this.stats.hotResources.sort((a, b) => b.score - a.score);
  }

  // 广播统计数据
  private broadcastStats(): void {
    const stats = this.getRealtimeStats();
    
    this.broadcastToRoom('global', {
      type: 'stats:update',
      data: stats
    });

    // 缓存统计数据
    globalCache.set('realtime:stats', stats, { ttl: 30000 }); // 30秒TTL
  }

  // 房间管理
  joinRoom(socketId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(socketId);
  }

  leaveRoom(socketId: string, room: string): void {
    const roomSet = this.rooms.get(room);
    if (roomSet) {
      roomSet.delete(socketId);
      if (roomSet.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  // 向房间广播消息
  private broadcastToRoom(room: string, event: RealtimeEvent): void {
    const roomSet = this.rooms.get(room);
    if (!roomSet) return;

    for (const socketId of roomSet) {
      const connection = this.connections.get(socketId);
      if (connection && connection.readyState === 1) { // WebSocket.OPEN
        connection.send(JSON.stringify(event));
      }
    }
  }

  // 添加WebSocket连接
  addConnection(socketId: string, connection: any): void {
    this.connections.set(socketId, connection);
    
    // 自动加入全局房间
    this.joinRoom(socketId, 'global');
  }

  // 移除WebSocket连接
  removeConnection(socketId: string): void {
    this.connections.delete(socketId);
    
    // 从所有房间移除
    for (const [room] of this.rooms.entries()) {
      this.leaveRoom(socketId, room);
    }
  }

  // 销毁管理器
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.removeAllListeners();
    this.stats = {
      resourceViews: new Map(),
      activeUsers: new Map(),
      searchQueries: [],
      hotResources: []
    };
  }
}

// 全局实时数据管理器实例
export const realtimeManager = new RealtimeManager();

// Server-Sent Events (SSE) 实现
export class SSEConnection {
  private response: Response | null = null;
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController | null = null;

  constructor(private userId?: string) {}

  // 创建SSE响应
  createResponse(): Response {
    const stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
        
        // 发送初始数据
        this.send({
          type: 'connection',
          data: { status: 'connected', userId: this.userId }
        });

        // 定期发送心跳
        const heartbeat = setInterval(() => {
          this.send({ type: 'heartbeat', data: { timestamp: Date.now() } });
        }, 30000);

        // 清理函数
        return () => {
          clearInterval(heartbeat);
          this.controller = null;
        };
      }
    });

    this.response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

    return this.response;
  }

  // 发送SSE消息
  send(event: RealtimeEvent): boolean {
    if (!this.controller) return false;

    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      this.controller.enqueue(this.encoder.encode(data));
      return true;
    } catch (error) {
      console.error('SSE发送失败:', error);
      return false;
    }
  }

  // 关闭连接
  close(): void {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }
}

// 实时数据API辅助函数
export async function getRealtimeData(): Promise<any> {
  const stats = realtimeManager.getRealtimeStats();
  
  // 从缓存获取更多数据
  const cachedData = await Promise.all([
    globalCache.get('trending:searches'),
    globalCache.get('popular:categories'),
    globalCache.get('user:activity')
  ]);

  return {
    ...stats,
    trendingSearches: cachedData[0] || [],
    popularCategories: cachedData[1] || [],
    userActivity: cachedData[2] || {}
  };
}

// 实时通知系统
export class NotificationSystem {
  private subscribers = new Map<string, Set<(notification: any) => void>>();

  // 订阅通知
  subscribe(userId: string, callback: (notification: any) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    
    this.subscribers.get(userId)!.add(callback);
    
    // 返回取消订阅函数
    return () => {
      const userSubscribers = this.subscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  // 发送通知
  notify(userId: string, notification: any): void {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('通知发送失败:', error);
        }
      });
    }
  }

  // 广播通知
  broadcast(notification: any, filter?: (userId: string) => boolean): void {
    for (const [userId, callbacks] of this.subscribers.entries()) {
      if (!filter || filter(userId)) {
        callbacks.forEach(callback => {
          try {
            callback(notification);
          } catch (error) {
            console.error('广播通知失败:', error);
          }
        });
      }
    }
  }
}

export const notificationSystem = new NotificationSystem();