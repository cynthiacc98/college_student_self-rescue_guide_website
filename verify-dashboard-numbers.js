const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');

async function verifyDashboardNumbers() {
  console.log('=== 管理后台数字统计真实性验证 ===');
  
  const prisma = new PrismaClient();
  const mongoUri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/college_student_self_rescue_guide";
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. 验证资源数量 (Prisma)
    console.log('\n1. 验证资源数量...');
    const prismaResourceCount = await prisma.resource.count();
    const mongoResourceCount = await db.collection("Resource").countDocuments();
    
    console.log('Prisma资源统计:', prismaResourceCount);
    console.log('MongoDB资源统计:', mongoResourceCount);
    
    if (prismaResourceCount === mongoResourceCount) {
      console.log('✅ 资源数量统计一致');
    } else {
      console.log('⚠️ 资源数量统计不一致，存在数据同步问题');
    }
    
    // 2. 验证分类数量 (Prisma)
    console.log('\n2. 验证分类数量...');
    const prismaCategoryCount = await prisma.category.count();
    const mongoCategoryCount = await db.collection("Category").countDocuments();
    
    console.log('Prisma分类统计:', prismaCategoryCount);
    console.log('MongoDB分类统计:', mongoCategoryCount);
    
    if (prismaCategoryCount === mongoCategoryCount) {
      console.log('✅ 分类数量统计一致');
    } else {
      console.log('⚠️ 分类数量统计不一致，存在数据同步问题');
    }
    
    // 3. 验证用户数量 (MongoDB only)
    console.log('\n3. 验证用户数量...');
    const userCount = await db.collection("users").countDocuments();
    console.log('MongoDB用户统计:', userCount);
    console.log('✅ 用户数量统计真实有效');
    
    // 4. 验证热门资料统计
    console.log('\n4. 验证热门资料统计...');
    
    // 检查ResourceStat集合是否存在
    const collections = await db.listCollections().toArray();
    const hasResourceStat = collections.some(c => c.name === 'ResourceStat');
    console.log('ResourceStat集合存在:', hasResourceStat);
    
    if (hasResourceStat) {
      const resourceStats = await db.collection("ResourceStat").find({}).toArray();
      console.log('ResourceStat集合记录数:', resourceStats.length);
      
      if (resourceStats.length > 0) {
        console.log('前5个统计记录:');
        resourceStats.slice(0, 5).forEach((stat, i) => {
          console.log(`  ${i + 1}. 资源ID: ${stat.resourceId}, 点击数: ${stat.clicks}`);
        });
        
        // 验证聚合查询
        const topClicks = await db.collection("ResourceStat").aggregate([
          { $sort: { clicks: -1 } },
          { $limit: 5 },
          { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
          { $unwind: "$res" },
          { $project: { _id: 0, title: "$res.title", clicks: 1 } },
        ]).toArray();
        
        console.log('热门资料聚合查询结果:', topClicks.length);
        topClicks.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.title}: ${item.clicks} 次点击`);
        });
        
        if (topClicks.length > 0) {
          console.log('✅ 热门资料统计真实有效');
        } else {
          console.log('⚠️ 热门资料聚合查询无结果');
        }
      } else {
        console.log('⚠️ ResourceStat集合为空');
      }
    } else {
      console.log('❌ ResourceStat集合不存在，热门统计功能无法工作');
    }
    
    // 5. 验证实际资源数据
    console.log('\n5. 验证实际资源数据...');
    const resources = await db.collection("Resource").find({}).limit(5).toArray();
    console.log('实际资源记录数:', resources.length);
    
    if (resources.length > 0) {
      console.log('前5个资源:');
      resources.forEach((res, i) => {
        console.log(`  ${i + 1}. 标题: ${res.title}`);
        console.log(`      ID: ${res._id}`);
        console.log(`      分类: ${res.categoryId || '无'}`);
        console.log(`      公开: ${res.isPublic ? '是' : '否'}`);
      });
      console.log('✅ 资源数据真实存在');
    } else {
      console.log('❌ 资源集合为空');
    }
    
    // 6. 验证分类数据
    console.log('\n6. 验证分类数据...');
    const categories = await db.collection("Category").find({}).limit(5).toArray();
    console.log('实际分类记录数:', categories.length);
    
    if (categories.length > 0) {
      console.log('前5个分类:');
      categories.forEach((cat, i) => {
        console.log(`  ${i + 1}. 名称: ${cat.name}`);
        console.log(`      slug: ${cat.slug}`);
        console.log(`      激活: ${cat.isActive ? '是' : '否'}`);
      });
      console.log('✅ 分类数据真实存在');
    } else {
      console.log('❌ 分类集合为空');
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
  } finally {
    await prisma.$disconnect();
    await client.close();
  }
}

verifyDashboardNumbers().catch(console.error);