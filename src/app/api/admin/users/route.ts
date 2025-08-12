import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission, assignRole, hasRole } from "@/lib/rbac";
import { createAuditLog, AuditAction, AuditResource, AuditStatus } from "@/lib/audit";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.USER_READ);
    
    const client = await clientPromise;
    const db = client.db();
    
    // 获取用户列表及其角色信息
    const users = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'UserRole',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } }
          ],
          as: 'userRoles'
        }
      },
      {
        $lookup: {
          from: 'Role',
          let: { roleIds: '$userRoles.roleId' },
          pipeline: [
            { $match: { $expr: { $in: [{ $toString: '$_id' }, '$$roleIds'] } } }
          ],
          as: 'roles'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          isActive: { $ifNull: ['$isActive', true] },
          lastLogin: 1,
          createdAt: 1,
          avatar: 1,
          roles: {
            $map: {
              input: '$roles',
              as: 'role',
              in: {
                name: '$$role.name',
                displayName: '$$role.displayName'
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    // 转换ObjectId为字符串
    const formattedUsers = users.map(user => ({
      ...user,
      id: user._id.toString(),
      _id: undefined
    }));

    const response = NextResponse.json({ success: true, data: formattedUsers });
    
    // 禁用缓存，确保每次都获取最新数据
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 权限验证
    const currentUser = await requirePermission(Permission.USER_CREATE);
    
    const body = await request.json();
    const { name, email, password, roleIds = [], isActive = true } = body;

    // 验证必要字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: '请填写所有必要字段' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 检查邮箱是否已存在
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = {
      name,
      email,
      password: hashedPassword,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // 分配角色
    if (roleIds.length > 0) {
      for (const roleId of roleIds) {
        await assignRole(userId, roleId, currentUser.id);
      }
    }

    // 记录审计日志
    await createAuditLog({
      userId: currentUser.id,
      action: AuditAction.USER_CREATE,
      resource: AuditResource.USER,
      resourceId: userId,
      newData: { name, email, isActive, roleIds },
      status: AuditStatus.SUCCESS
    });

    return NextResponse.json({ 
      success: true, 
      data: { id: userId, name, email, isActive }
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 }
    );
  }
}