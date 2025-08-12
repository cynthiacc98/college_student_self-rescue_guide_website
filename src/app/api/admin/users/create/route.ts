import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.USER_CREATE);
    
    const { name, email, password, isActive = true, roleIds = [] } = await request.json();
    
    // 验证必要字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "用户名、邮箱和密码为必填项" },
        { status: 400 }
      );
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "邮箱格式无效" },
        { status: 400 }
      );
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "密码长度至少为6位" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // 检查邮箱是否已存在
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "该邮箱已被注册" },
        { status: 400 }
      );
    }
    
    // 加密密码
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // 创建用户
    const newUser = {
      name,
      email,
      password: hashedPassword,
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      isActive,
      emailVerified: null,
      role: "USER", // 默认角色
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const userResult = await db.collection('users').insertOne(newUser);
    const userId = userResult.insertedId.toString();
    
    // 如果指定了角色，分配角色
    if (roleIds.length > 0) {
      const userRoles = roleIds.map((roleId: string) => ({
        userId: userId,
        roleId: roleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      await db.collection('UserRole').insertMany(userRoles);
    }
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userResponse } = newUser;
    
    return NextResponse.json({
      success: true,
      message: "用户创建成功",
      data: {
        id: userId,
        ...userResponse,
      }
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 }
    );
  }
}