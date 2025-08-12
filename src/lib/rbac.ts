import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 权限枚举
export enum Permission {
  // 用户管理
  USER_READ = "user:read",
  USER_CREATE = "user:create", 
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_ROLE_MANAGE = "user:role:manage",

  // 资源管理
  RESOURCE_READ = "resource:read",
  RESOURCE_CREATE = "resource:create",
  RESOURCE_UPDATE = "resource:update", 
  RESOURCE_DELETE = "resource:delete",
  RESOURCE_APPROVE = "resource:approve",
  RESOURCE_FEATURE = "resource:feature",

  // 分类管理
  CATEGORY_READ = "category:read",
  CATEGORY_CREATE = "category:create",
  CATEGORY_UPDATE = "category:update",
  CATEGORY_DELETE = "category:delete",

  // 数据分析
  ANALYTICS_READ = "analytics:read",
  ANALYTICS_EXPORT = "analytics:export",

  // 系统设置
  SETTING_READ = "setting:read",
  SETTING_UPDATE = "setting:update",
  SETTING_SYSTEM = "setting:system",

  // 审计日志
  AUDIT_READ = "audit:read",
  AUDIT_EXPORT = "audit:export",

  // 导入导出
  DATA_IMPORT = "data:import",
  DATA_EXPORT = "data:export",
}

// 预定义角色
export const DefaultRoles = {
  SUPER_ADMIN: {
    name: "SUPER_ADMIN",
    displayName: "超级管理员",
    description: "拥有所有权限的超级管理员",
    permissions: Object.values(Permission)
  },
  ADMIN: {
    name: "ADMIN", 
    displayName: "管理员",
    description: "普通管理员，拥有大部分管理权限",
    permissions: [
      Permission.USER_READ,
      Permission.RESOURCE_READ,
      Permission.RESOURCE_CREATE,
      Permission.RESOURCE_UPDATE,
      Permission.RESOURCE_DELETE,
      Permission.RESOURCE_APPROVE,
      Permission.CATEGORY_READ,
      Permission.CATEGORY_CREATE,
      Permission.CATEGORY_UPDATE,
      Permission.CATEGORY_DELETE,
      Permission.ANALYTICS_READ,
      Permission.SETTING_READ,
      Permission.AUDIT_READ,
      Permission.DATA_EXPORT,
    ]
  },
  EDITOR: {
    name: "EDITOR",
    displayName: "编辑者", 
    description: "内容编辑员，主要负责资源管理",
    permissions: [
      Permission.RESOURCE_READ,
      Permission.RESOURCE_CREATE,
      Permission.RESOURCE_UPDATE,
      Permission.CATEGORY_READ,
      Permission.ANALYTICS_READ,
    ]
  },
  VIEWER: {
    name: "VIEWER",
    displayName: "查看者",
    description: "只读权限用户",
    permissions: [
      Permission.USER_READ,
      Permission.RESOURCE_READ,
      Permission.CATEGORY_READ,
      Permission.ANALYTICS_READ,
    ]
  }
};

// 权限分组
export const PermissionGroups = {
  USER: {
    name: "用户管理",
    permissions: [
      Permission.USER_READ,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
      Permission.USER_ROLE_MANAGE,
    ]
  },
  RESOURCE: {
    name: "资源管理",
    permissions: [
      Permission.RESOURCE_READ,
      Permission.RESOURCE_CREATE,
      Permission.RESOURCE_UPDATE,
      Permission.RESOURCE_DELETE,
      Permission.RESOURCE_APPROVE,
      Permission.RESOURCE_FEATURE,
    ]
  },
  CATEGORY: {
    name: "分类管理", 
    permissions: [
      Permission.CATEGORY_READ,
      Permission.CATEGORY_CREATE,
      Permission.CATEGORY_UPDATE,
      Permission.CATEGORY_DELETE,
    ]
  },
  ANALYTICS: {
    name: "数据分析",
    permissions: [
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT,
    ]
  },
  SYSTEM: {
    name: "系统管理",
    permissions: [
      Permission.SETTING_READ,
      Permission.SETTING_UPDATE,
      Permission.SETTING_SYSTEM,
      Permission.AUDIT_READ,
      Permission.AUDIT_EXPORT,
      Permission.DATA_IMPORT,
      Permission.DATA_EXPORT,
    ]
  }
};

// 获取用户权限
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 获取用户角色
    const userRoles = await db.collection("UserRole").find({ userId }).toArray();
    if (userRoles.length === 0) return [];

    // 获取角色权限
    const roleIds = userRoles.map(ur => new ObjectId(ur.roleId));
    const roles = await db.collection("Role").find({ 
      _id: { $in: roleIds },
      isActive: true 
    }).toArray();

    // 合并所有权限
    const permissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach((permission: string) => {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  } catch (error) {
    console.error("获取用户权限失败:", error);
    return [];
  }
}

// 检查用户是否有权限
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

// 检查多个权限
export async function hasPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(permission => userPermissions.includes(permission));
}

// 检查用户是否有角色
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db();

    const role = await db.collection("Role").findOne({ name: roleName, isActive: true });
    if (!role) return false;

    const userRole = await db.collection("UserRole").findOne({ 
      userId, 
      roleId: role._id.toString() 
    });

    return !!userRole;
  } catch (error) {
    console.error("检查用户角色失败:", error);
    return false;
  }
}

// 获取当前用户信息和权限
export async function getCurrentUserPermissions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { user: null, permissions: [] };
  }

  const permissions = await getUserPermissions(session.user.id);
  return { user: session.user, permissions };
}

// 权限检查中间件
export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("未登录");
  }

  const hasAccess = await hasPermission(session.user.id, permission);
  if (!hasAccess) {
    throw new Error("权限不足");
  }

  return session.user;
}

// 权限检查装饰器
export function withPermission(permission: Permission) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      await requirePermission(permission);
      return method.apply(this, args);
    };
  };
}

// 初始化默认角色
export async function initializeDefaultRoles() {
  try {
    const client = await clientPromise;
    const db = client.db();

    for (const [key, roleData] of Object.entries(DefaultRoles)) {
      const existingRole = await db.collection("Role").findOne({ name: roleData.name });
      
      if (!existingRole) {
        await db.collection("Role").insertOne({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          permissions: roleData.permissions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`已创建角色: ${roleData.displayName}`);
      }
    }
  } catch (error) {
    console.error("初始化默认角色失败:", error);
  }
}

// 给用户分配角色
export async function assignRole(userId: string, roleId: string, assignedBy?: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const existingUserRole = await db.collection("UserRole").findOne({ userId, roleId });
    if (existingUserRole) {
      throw new Error("用户已经拥有该角色");
    }

    await db.collection("UserRole").insertOne({
      userId,
      roleId, 
      assignedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("分配角色失败:", error);
    throw error;
  }
}

// 移除用户角色
export async function removeRole(userId: string, roleId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    await db.collection("UserRole").deleteOne({ userId, roleId });
    return true;
  } catch (error) {
    console.error("移除角色失败:", error);
    throw error;
  }
}