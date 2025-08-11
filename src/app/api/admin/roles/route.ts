import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission, PermissionGroups, DefaultRoles } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // 权限验证
    await requirePermission(Permission.USER_ROLE_MANAGE);
    
    const client = await clientPromise;
    const db = client.db();
    
    // 获取所有活跃角色
    const roles = await db.collection('Role').find({ 
      isActive: true 
    }).sort({ createdAt: 1 }).toArray();

    // 转换ObjectId为字符串
    const formattedRoles = roles.map(role => ({
      ...role,
      id: role._id.toString(),
      _id: undefined
    }));

    return NextResponse.json({ success: true, data: formattedRoles });
    
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { success: false, error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 权限验证  
    const currentUser = await requirePermission(Permission.USER_ROLE_MANAGE);
    
    const body = await request.json();
    const { name, displayName, description, permissions = [], isActive = true } = body;

    // 验证必要字段
    if (!name || !displayName) {
      return NextResponse.json(
        { success: false, error: '角色名称和显示名称为必填项' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 检查角色名是否已存在
    const existingRole = await db.collection('Role').findOne({ name });
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: '该角色名称已存在' },
        { status: 400 }
      );
    }

    // 创建角色
    const newRole = {
      name,
      displayName,
      description,
      permissions,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('Role').insertOne(newRole);
    const roleId = result.insertedId.toString();

    return NextResponse.json({ 
      success: true, 
      data: { id: roleId, ...newRole }
    });
    
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { success: false, error: '创建角色失败' },
      { status: 500 }
    );
  }
}

// 获取权限组信息
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'permissions') {
      // 返回权限组信息
      return NextResponse.json({ 
        success: true, 
        data: {
          groups: PermissionGroups,
          defaultRoles: DefaultRoles
        }
      });
    }
    
    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { success: false, error: '获取权限信息失败' },
      { status: 500 }
    );
  }
}