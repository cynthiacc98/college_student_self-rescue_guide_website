import { NextResponse } from "next/server";
import { initializeDefaultRoles, DefaultRoles } from "@/lib/rbac";
import clientPromise from "@/lib/mongodb";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    console.log("开始调试角色初始化...");
    
    const client = await clientPromise;
    const db = client.db();
    
    // 清理现有角色数据
    await db.collection("Role").deleteMany({});
    await db.collection("UserRole").deleteMany({});
    console.log("已清理现有角色数据");
    
    // 手动创建角色
    const now = new Date();
    
    for (const [key, roleData] of Object.entries(DefaultRoles)) {
      console.log(`创建角色: ${roleData.name}`, roleData);
      
      try {
        const result = await db.collection("Role").insertOne({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          permissions: roleData.permissions,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`角色 ${roleData.name} 创建成功，ID: ${result.insertedId}`);
      } catch (error) {
        console.error(`创建角色 ${roleData.name} 失败:`, error);
      }
    }
    
    // 检查创建结果
    const roleCount = await db.collection("Role").countDocuments();
    const roles = await db.collection("Role").find({}).toArray();
    
    console.log(`总共创建了 ${roleCount} 个角色:`, roles.map(r => r.name));
    
    // 为管理员用户分配角色
    const adminUser = await db.collection("users").findOne({ email: "admin@example.com" });
    if (adminUser) {
      console.log("找到管理员用户:", adminUser._id);
      
      const adminRole = await db.collection("Role").findOne({ name: "ADMIN" });
      if (adminRole) {
        console.log("找到ADMIN角色:", adminRole._id);
        
        // 删除现有的角色分配
        await db.collection("UserRole").deleteMany({ userId: adminUser._id.toString() });
        
        // 分配新角色
        const userRoleResult = await db.collection("UserRole").insertOne({
          userId: adminUser._id.toString(),
          roleId: adminRole._id.toString(),
          assignedBy: null,
          createdAt: now,
          updatedAt: now,
        });
        console.log("角色分配成功:", userRoleResult.insertedId);
      }
    }
    
    // 验证角色分配
    const userRoles = await db.collection("UserRole").find({}).toArray();
    console.log("用户角色分配情况:", userRoles);
    
    return NextResponse.json({ 
      success: true, 
      roles: roles.length,
      userRoles: userRoles.length,
      data: { roles, userRoles }
    });
    
  } catch (error) {
    console.error("调试角色初始化失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
