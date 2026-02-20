import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserPermissions, hasPermission, Permission } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    console.log("=== 开始权限调试 ===");
    
    // 1. 检查当前session
    const session = await getServerSession(authOptions);
    console.log("当前session:", {
      user: session?.user,
      userId: session?.user?.id
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({
        step: "session",
        error: "用户未登录或session无效"
      });
    }
    
    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();
    
    // 2. 检查用户信息
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(userId) 
    });
    console.log("用户信息:", user);
    
    // 3. 检查用户角色分配
    const userRoles = await db.collection("UserRole").find({ userId }).toArray();
    console.log("用户角色分配:", userRoles);
    
    // 4. 检查角色信息
    const roleIds = userRoles.map(ur => ur.roleId);
    console.log("角色ID列表:", roleIds);
    
    // 注意：需要转换为ObjectId来查询
    const roleObjectIds = roleIds.map(id => new ObjectId(id));
    const roles = await db.collection("Role").find({ 
      _id: { $in: roleObjectIds },
      isActive: true 
    }).toArray();
    console.log("角色详情:", roles);
    
    // 5. 提取所有权限
    const permissions = new Set<string>();
    roles.forEach(role => {
      console.log(`角色 ${role.name} 的权限:`, role.permissions);
      role.permissions.forEach((permission: string) => {
        permissions.add(permission);
      });
    });
    const userPermissions = Array.from(permissions);
    console.log("用户总权限:", userPermissions);
    
    // 6. 测试特定权限
    const analyticsReadPermission = Permission.ANALYTICS_READ;
    const hasAnalyticsRead = userPermissions.includes(analyticsReadPermission);
    console.log(`权限检查 [${analyticsReadPermission}]:`, hasAnalyticsRead);
    
    // 7. 使用函数检查
    const functionResult = await getUserPermissions(userId);
    const functionHasPermission = await hasPermission(userId, Permission.ANALYTICS_READ);
    console.log("函数返回的权限:", functionResult);
    console.log("函数权限检查结果:", functionHasPermission);
    
    return NextResponse.json({
      success: true,
      debug: {
        session: {
          userId,
          userName: session.user.name,
          userEmail: session.user.email
        },
        user: user ? {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        } : null,
        userRoles: userRoles.map(ur => ({
          userId: ur.userId,
          roleId: ur.roleId,
          assignedAt: ur.createdAt
        })),
        roles: roles.map(role => ({
          id: role._id.toString(),
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions,
          isActive: role.isActive
        })),
        permissions: {
          direct: userPermissions,
          fromFunction: functionResult,
          analyticsRead: hasAnalyticsRead,
          functionCheck: functionHasPermission
        }
      }
    });
    
  } catch (error) {
    console.error("权限调试失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
