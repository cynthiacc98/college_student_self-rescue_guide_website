import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // 简单的管理员权限验证
    const authError = await requireAdmin();
    if (authError) return authError;
    
    const client = await clientPromise;
    const db = client.db();
    
    // 获取用户列表（简化版）
    const users = await db.collection('users')
      .find({}, { 
        projection: { 
          name: 1, 
          email: 1, 
          role: 1,
          status: 1,
          createdAt: 1,
          lastLogin: 1 
        } 
      })
      .sort({ createdAt: -1 })
      .toArray();

    // 转换结果
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role || 'USER',
      status: user.status || 'ACTIVE',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedUsers,
      count: formattedUsers.length
    });
    
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
    const authError = await requireAdmin();
    if (authError) return authError;
    
    const body = await request.json();
    const { name, email, password, role = 'USER' } = body;

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
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: ['ADMIN', 'USER'].includes(role) ? role : 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: result.insertedId.toString(), 
        name, 
        email, 
        role: newUser.role 
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