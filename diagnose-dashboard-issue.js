const { MongoClient, ObjectId } = require('mongodb');

async function diagnoseDashboardIssue() {
  console.log('=== Dashboard API问题诊断 ===');
  
  const mongoUri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/college_student_self_rescue_guide";
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. 检查所有集合
    console.log('\n1. 检查数据库集合...');
    const collections = await db.listCollections().toArray();
    console.log('现有集合:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // 2. 检查RBAC相关集合
    console.log('\n2. 检查RBAC权限系统...');
    
    const hasRole = collections.some(c => c.name === 'Role');
    const hasUserRole = collections.some(c => c.name === 'UserRole');
    const hasUserActivity = collections.some(c => c.name === 'UserActivity');
    const hasAuditLog = collections.some(c => c.name === 'AuditLog');
    
    console.log(`Role集合存在: ${hasRole ? '是' : '否'}`);
    console.log(`UserRole集合存在: ${hasUserRole ? '是' : '否'}`);
    console.log(`UserActivity集合存在: ${hasUserActivity ? '是' : '否'}`);
    console.log(`AuditLog集合存在: ${hasAuditLog ? '是' : '否'}`);
    
    // 3. 检查admin用户信息
    console.log('\n3. 检查admin用户信息...');
    const adminUser = await db.collection('users').findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('Admin用户ID:', adminUser._id);
      console.log('Admin用户角色:', adminUser.role);
      
      if (hasRole) {
        // 检查Role集合
        const roles = await db.collection('Role').find({}).toArray();
        console.log('Role集合记录数:', roles.length);
        if (roles.length > 0) {
          console.log('现有角色:');
          roles.forEach(role => {
            console.log(`  - ${role.name} (${role.displayName}): ${role.permissions.length} 个权限`);
          });
        }
        
        if (hasUserRole) {
          // 检查admin的角色分配
          const userRoles = await db.collection('UserRole').find({ 
            userId: adminUser._id.toString() 
          }).toArray();
          console.log('Admin用户角色分配数:', userRoles.length);
        } else {
          console.log('⚠️ UserRole集合不存在，无法进行权限验证');
        }
      } else {
        console.log('⚠️ Role集合不存在，RBAC系统未初始化');
      }
    } else {
      console.log('❌ Admin用户不存在');
    }
    
    // 4. 检查统计相关集合
    console.log('\n4. 检查统计数据集合...');
    
    const resourceStatCount = await db.collection('ResourceStat').countDocuments();
    const resourceCount = await db.collection('Resource').countDocuments();
    const categoryCount = await db.collection('Category').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    
    console.log('ResourceStat记录数:', resourceStatCount);
    console.log('Resource记录数:', resourceCount);
    console.log('Category记录数:', categoryCount);
    console.log('Users记录数:', userCount);
    
    // 5. 测试基础数据聚合
    console.log('\n5. 测试数据聚合查询...');
    
    try {
      const totalViews = await db.collection('ResourceStat').aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).toArray();
      console.log('总浏览量聚合结果:', totalViews[0]?.total || 0);
    } catch (error) {
      console.log('浏览量聚合查询失败:', error.message);
    }
    
    try {
      const totalClicks = await db.collection('ResourceStat').aggregate([
        { $group: { _id: null, total: { $sum: '$clicks' } } }
      ]).toArray();
      console.log('总点击量聚合结果:', totalClicks[0]?.total || 0);
    } catch (error) {
      console.log('点击量聚合查询失败:', error.message);
    }
    
    // 6. 建议解决方案
    console.log('\n6. 问题分析和建议...');
    
    if (!hasRole || !hasUserRole) {
      console.log('🚨 主要问题: RBAC权限系统未初始化');
      console.log('解决方案:');
      console.log('  1. 需要初始化Role集合');
      console.log('  2. 需要为admin用户分配角色');
      console.log('  3. 或者修改Dashboard API跳过权限检查（用于测试）');
    }
    
    if (!hasUserActivity) {
      console.log('⚠️ UserActivity集合不存在，无法统计用户活跃度');
    }
    
    if (!hasAuditLog) {
      console.log('⚠️ AuditLog集合不存在，无法显示最近活动');
    }
    
    console.log('\n=== 诊断完成 ===');
    
  } catch (error) {
    console.error('❌ 诊断过程出错:', error.message);
  } finally {
    await client.close();
  }
}

diagnoseDashboardIssue().catch(console.error);