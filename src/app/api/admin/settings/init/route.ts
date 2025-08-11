import { NextResponse } from 'next/server';
import { initializeDefaultSettings } from '@/lib/settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * 初始化默认系统设置
 * 只有管理员可以执行此操作
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户权限（开发环境允许直接初始化）
    if (process.env.NODE_ENV !== 'development' && (!session || session.user?.email !== process.env.ADMIN_EMAIL)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // 初始化默认设置
    await initializeDefaultSettings();

    return NextResponse.json({ 
      success: true, 
      message: '系统设置初始化成功' 
    });
  } catch (error) {
    console.error('初始化设置失败:', error);
    return NextResponse.json(
      { error: '初始化设置失败' },
      { status: 500 }
    );
  }
}