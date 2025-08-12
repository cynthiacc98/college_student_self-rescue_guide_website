import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission, assignRole, removeRole } from "@/lib/rbac";
import { createAuditLog, AuditAction, AuditResource, AuditStatus } from "@/lib/audit";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限验证
    const currentUser = await requirePermission(Permission.USER_ROLE_MANAGE);
    
    const { id } = await params;
    const body = await request.json();
    const { roleIds = [] } = body;

    // 验证用户ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: '无效的用户ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // 检查用户是否存在
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 获取用户当前的角色
    const currentUserRoles = await db.collection('UserRole').find({
      userId: id
    }).toArray();
    
    const currentRoleIds = currentUserRoles.map(ur => ur.roleId.toString());

    // 删除不再需要的角色
    for (const roleId of currentRoleIds) {
      if (!roleIds.includes(roleId)) {
        await removeRole(id, roleId);
      }
    }

    // 添加新的角色
    for (const roleId of roleIds) {
      if (!currentRoleIds.includes(roleId)) {
        await assignRole(id, roleId, currentUser.id);
      }
    }

    // 记录审计日志
    await createAuditLog({
      userId: currentUser.id,
      action: AuditAction.USER_ROLE_ASSIGN,
      resource: AuditResource.USER,
      resourceId: id,
      oldData: { roleIds: currentRoleIds },
      newData: { roleIds },
      status: AuditStatus.SUCCESS
    });

    return NextResponse.json({ 
      success: true, 
      message: '用户角色已更新'
    });
    
  } catch (error) {
    console.error('Update user roles error:', error);
    return NextResponse.json(
      { success: false, error: '更新用户角色失败' },
      { status: 500 }
    );
  }
}