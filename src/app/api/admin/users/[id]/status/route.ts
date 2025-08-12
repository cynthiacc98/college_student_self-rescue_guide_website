import { NextRequest, NextResponse } from "next/server";
import { requirePermission, Permission } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限验证
    await requirePermission(Permission.USER_UPDATE);
    
    const { id } = await params;
    const { isActive } = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "无效的用户ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // 检查用户是否存在
    const user = await db.collection('users').findOne({
      _id: new ObjectId(id)
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }
    
    // 更新用户状态
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: isActive,
          status: isActive ? 'ACTIVE' : 'INACTIVE',
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: `用户状态已${isActive ? '激活' : '禁用'}`
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    return NextResponse.json(
      { success: false, error: '更新用户状态失败' },
      { status: 500 }
    );
  }
}