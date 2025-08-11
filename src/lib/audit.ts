import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export enum AuditAction {
  // 用户操作
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT", 
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_ROLE_ASSIGN = "USER_ROLE_ASSIGN",
  USER_ROLE_REMOVE = "USER_ROLE_REMOVE",

  // 资源操作
  RESOURCE_CREATE = "RESOURCE_CREATE",
  RESOURCE_UPDATE = "RESOURCE_UPDATE",
  RESOURCE_DELETE = "RESOURCE_DELETE",
  RESOURCE_APPROVE = "RESOURCE_APPROVE",
  RESOURCE_REJECT = "RESOURCE_REJECT",
  RESOURCE_FEATURE = "RESOURCE_FEATURE",
  RESOURCE_VIEW = "RESOURCE_VIEW",
  RESOURCE_CLICK = "RESOURCE_CLICK",

  // 分类操作
  CATEGORY_CREATE = "CATEGORY_CREATE",
  CATEGORY_UPDATE = "CATEGORY_UPDATE", 
  CATEGORY_DELETE = "CATEGORY_DELETE",

  // 系统操作
  SETTING_UPDATE = "SETTING_UPDATE",
  DATA_EXPORT = "DATA_EXPORT",
  DATA_IMPORT = "DATA_IMPORT",
  SYSTEM_BACKUP = "SYSTEM_BACKUP",
  SYSTEM_RESTORE = "SYSTEM_RESTORE",
}

export enum AuditResource {
  USER = "users",
  RESOURCE = "resources",
  CATEGORY = "categories", 
  ROLE = "roles",
  SETTING = "settings",
  SYSTEM = "system",
}

export enum AuditStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
}

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  errorMessage?: string;
  metadata?: any;
}

// 记录审计日志
export async function createAuditLog(data: AuditLogData) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const auditLog = {
      ...data,
      createdAt: new Date(),
    };

    await db.collection("AuditLog").insertOne(auditLog);
  } catch (error) {
    console.error("创建审计日志失败:", error);
    // 不抛出错误，避免影响主业务流程
  }
}

// 获取请求信息
export function getRequestInfo(request?: Request) {
  if (!request) return {};

  const ipAddress = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}

// 审计装饰器 - 自动记录操作日志
export function auditLog(
  action: AuditAction, 
  resource: AuditResource,
  options: {
    getResourceId?: (args: any[]) => string;
    captureOldData?: boolean;
    captureNewData?: boolean;
  } = {}
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      
      let oldData: any;
      let resourceId: string | undefined;

      try {
        // 获取资源ID
        if (options.getResourceId) {
          resourceId = options.getResourceId(args);
        }

        // 捕获操作前数据
        if (options.captureOldData && resourceId) {
          oldData = await getResourceData(resource, resourceId);
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 捕获操作后数据
        let newData: any;
        if (options.captureNewData) {
          if (resourceId) {
            newData = await getResourceData(resource, resourceId);
          } else if (result && typeof result === 'object' && result.id) {
            newData = result;
            resourceId = result.id;
          }
        }

        // 记录成功日志
        await createAuditLog({
          userId,
          action,
          resource,
          resourceId,
          oldData,
          newData,
          status: AuditStatus.SUCCESS,
        });

        return result;
      } catch (error) {
        // 记录失败日志
        await createAuditLog({
          userId,
          action,
          resource,
          resourceId,
          oldData,
          status: AuditStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
      }
    };
  };
}

// 获取资源数据 
async function getResourceData(resource: AuditResource, resourceId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    let collectionName: string;
    switch (resource) {
      case AuditResource.USER:
        collectionName = "users";
        break;
      case AuditResource.RESOURCE:
        collectionName = "Resource";
        break;
      case AuditResource.CATEGORY:
        collectionName = "Category";
        break;
      case AuditResource.ROLE:
        collectionName = "Role";
        break;
      case AuditResource.SETTING:
        collectionName = "Setting";
        break;
      default:
        return null;
    }

    const ObjectId = require("mongodb").ObjectId;
    return await db.collection(collectionName).findOne({ _id: new ObjectId(resourceId) });
  } catch (error) {
    console.error("获取资源数据失败:", error);
    return null;
  }
}

// 手动记录用户登录日志
export async function logUserLogin(userId: string, request?: Request) {
  const requestInfo = getRequestInfo(request);
  
  await createAuditLog({
    userId,
    action: AuditAction.USER_LOGIN,
    resource: AuditResource.USER,
    resourceId: userId,
    status: AuditStatus.SUCCESS,
    ...requestInfo,
  });
}

// 手动记录用户登出日志
export async function logUserLogout(userId: string, request?: Request) {
  const requestInfo = getRequestInfo(request);
  
  await createAuditLog({
    userId,
    action: AuditAction.USER_LOGOUT,
    resource: AuditResource.USER,
    resourceId: userId,
    status: AuditStatus.SUCCESS,
    ...requestInfo,
  });
}

// 记录资源查看日志（用于统计）
export async function logResourceView(resourceId: string, userId?: string, request?: Request) {
  const requestInfo = getRequestInfo(request);
  
  await createAuditLog({
    userId,
    action: AuditAction.RESOURCE_VIEW,
    resource: AuditResource.RESOURCE,
    resourceId,
    status: AuditStatus.SUCCESS,
    ...requestInfo,
  });
}

// 记录资源点击日志（用于统计）
export async function logResourceClick(resourceId: string, userId?: string, request?: Request) {
  const requestInfo = getRequestInfo(request);
  
  await createAuditLog({
    userId,
    action: AuditAction.RESOURCE_CLICK,
    resource: AuditResource.RESOURCE,
    resourceId,
    status: AuditStatus.SUCCESS,
    ...requestInfo,
  });
}

// 获取审计日志统计
export async function getAuditStats(days = 30) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db.collection("AuditLog").aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", AuditStatus.SUCCESS] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$status", AuditStatus.FAILED] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    return stats;
  } catch (error) {
    console.error("获取审计统计失败:", error);
    return [];
  }
}

// 获取用户操作统计
export async function getUserActivityStats(days = 30) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db.collection("AuditLog").aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          userId: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: "$userId",
          actionCount: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
          actions: { $addToSet: "$action" }
        }
      },
      { $sort: { actionCount: -1 } },
      { $limit: 50 }
    ]).toArray();

    return stats;
  } catch (error) {
    console.error("获取用户活动统计失败:", error);
    return [];
  }
}

// 清理过期审计日志（建议定期执行）
export async function cleanupOldAuditLogs(daysToKeep = 365) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.collection("AuditLog").deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`已清理 ${result.deletedCount} 条过期审计日志`);
    return result.deletedCount;
  } catch (error) {
    console.error("清理审计日志失败:", error);
    return 0;
  }
}