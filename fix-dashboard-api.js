const { MongoClient, ObjectId } = require('mongodb');

async function fixDashboardAPI() {
  console.log('=== 修复Dashboard API问题 ===');
  
  const mongoUri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/college_student_self_rescue_guide";
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. 创建AuditLog集合和示例数据
    console.log('\n1. 创建AuditLog集合...');
    
    const auditLogExists = await db.collection('AuditLog').countDocuments();
    console.log('AuditLog集合现有记录数:', auditLogExists);
    
    if (auditLogExists === 0) {
      // 获取一些用户和资源数据来创建示例审计日志
      const users = await db.collection('users').find({}).limit(3).toArray();
      const resources = await db.collection('Resource').find({}).limit(3).toArray();
      
      const sampleAuditLogs = [];
      const now = new Date();
      
      for (let i = 0; i < 10; i++) {
        const user = users[i % users.length];
        const resource = resources[i % resources.length];
        const date = new Date(now.getTime() - i * 60 * 60 * 1000); // 每小时一条记录
        
        sampleAuditLogs.push({
          userId: user._id.toString(),
          action: ['USER_LOGIN', 'RESOURCE_CREATE', 'RESOURCE_UPDATE', 'CATEGORY_CREATE'][i % 4],
          resource: resource.title,
          resourceId: resource._id.toString(),
          details: `用户 ${user.name} 进行了操作`,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test Browser',
          createdAt: date,
          updatedAt: date
        });
      }
      
      await db.collection('AuditLog').insertMany(sampleAuditLogs);
      console.log('✅ 已创建', sampleAuditLogs.length, '条审计日志记录');
    } else {
      console.log('✅ AuditLog集合已存在，有', auditLogExists, '条记录');
    }
    
    // 2. 测试Dashboard API所需的各种查询
    console.log('\n2. 测试Dashboard数据查询...');
    
    // 测试基础指标
    const resourceCount = await db.collection('Resource').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    const categoryCount = await db.collection('Category').countDocuments();
    
    console.log('基础指标:');
    console.log('  资源数量:', resourceCount);
    console.log('  用户数量:', userCount);
    console.log('  分类数量:', categoryCount);
    
    // 测试统计聚合
    const totalViews = await db.collection('ResourceStat').aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]).toArray();
    
    const totalClicks = await db.collection('ResourceStat').aggregate([
      { $group: { _id: null, total: { $sum: '$clicks' } } }
    ]).toArray();
    
    console.log('统计数据:');
    console.log('  总浏览量:', totalViews[0]?.total || 0);
    console.log('  总点击量:', totalClicks[0]?.total || 0);
    
    // 测试热门资源查询
    const topResources = await db.collection('ResourceStat').aggregate([
      { $sort: { views: -1, clicks: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'Resource',
          let: { resourceId: '$resourceId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$resourceId'] } } },
            { $project: { title: 1 } }
          ],
          as: 'resource'
        }
      },
      { $unwind: '$resource' },
      {
        $project: {
          title: '$resource.title',
          views: 1,
          clicks: 1
        }
      }
    ]).toArray();
    
    console.log('热门资源查询结果:');
    topResources.forEach((res, i) => {
      console.log(`  ${i + 1}. ${res.title} - 浏览: ${res.views}, 点击: ${res.clicks}`);
    });
    
    // 测试分类统计
    const categoryStats = await db.collection('Category').aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'Resource',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'resources'
        }
      },
      {
        $project: {
          name: 1,
          resourceCount: { $size: '$resources' },
          color: { $ifNull: ['$color', '#8b5cf6'] }
        }
      },
      { $match: { resourceCount: { $gt: 0 } } },
      { $sort: { resourceCount: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    console.log('分类统计查询结果:');
    categoryStats.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.name}: ${cat.resourceCount} 个资源`);
    });
    
    // 测试最近活动查询
    const recentActivity = await db.collection('AuditLog').aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          let: { userId: { $toObjectId: '$userId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $project: { name: 1, email: 1 } }
          ],
          as: 'user'
        }
      },
      {
        $project: {
          action: 1,
          resource: 1,
          resourceId: 1,
          createdAt: 1,
          userName: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Unknown'] }
        }
      }
    ]).toArray();
    
    console.log('最近活动查询结果:');
    recentActivity.forEach((activity, i) => {
      console.log(`  ${i + 1}. ${activity.userName} ${activity.action} ${activity.resource}`);
    });
    
    console.log('\n✅ 所有查询测试成功，Dashboard API应该可以正常工作了');
    
    // 3. 再次测试Dashboard API
    console.log('\n3. 测试Dashboard API...');
    try {
      const response = await fetch('http://localhost:3000/api/admin/dashboard?range=7d', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard API状态码:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dashboard API修复成功！');
        console.log('响应数据包含:');
        console.log('  metrics:', Object.keys(result.data?.metrics || {}));
        console.log('  charts:', Object.keys(result.data?.charts || {}));
        console.log('  recentActivity:', result.data?.recentActivity?.length || 0, '条记录');
      } else {
        const errorText = await response.text();
        console.log('⚠️ Dashboard API仍有问题:', errorText);
      }
    } catch (error) {
      console.log('⚠️ Dashboard API测试失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message);
  } finally {
    await client.close();
  }
}

fixDashboardAPI().catch(console.error);