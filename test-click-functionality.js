const { MongoClient, ObjectId } = require('mongodb');

async function testClickFunctionality() {
  console.log('=== 点击统计功能真实性验证 ===');
  
  const mongoUri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/college_student_self_rescue_guide";
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. 获取一个资源进行测试
    console.log('\n1. 获取测试资源...');
    const testResource = await db.collection("Resource").findOne(
      { isPublic: true },
      { projection: { _id: 1, title: 1, quarkLink: 1 } }
    );
    
    if (!testResource) {
      console.log('❌ 没有找到可测试的资源');
      return;
    }
    
    console.log('测试资源ID:', testResource._id);
    console.log('测试资源标题:', testResource.title);
    console.log('测试资源链接:', testResource.quarkLink);
    
    // 2. 记录测试前的点击数
    console.log('\n2. 记录测试前的点击数...');
    const beforeStat = await db.collection("ResourceStat").findOne({
      resourceId: testResource._id
    });
    
    const beforeClicks = beforeStat ? beforeStat.clicks : 0;
    console.log('测试前点击数:', beforeClicks);
    
    // 3. 测试点击API (POST方法)
    console.log('\n3. 测试点击统计API...');
    try {
      const response = await fetch(`http://localhost:3000/api/resources/${testResource._id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Bot/1.0'
        }
      });
      
      const result = await response.json();
      console.log('API响应状态:', response.status);
      console.log('API响应内容:', result);
      
      if (response.status === 200 && result.success) {
        console.log('✅ 点击API调用成功');
      } else {
        console.log('⚠️ 点击API调用异常:', result.error || '未知错误');
      }
    } catch (error) {
      console.error('❌ 点击API测试失败:', error.message);
    }
    
    // 4. 等待一段时间让缓冲区刷新
    console.log('\n4. 等待缓冲区刷新...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. 验证点击数是否增加
    console.log('\n5. 验证点击数变化...');
    const afterStat = await db.collection("ResourceStat").findOne({
      resourceId: testResource._id
    });
    
    const afterClicks = afterStat ? afterStat.clicks : 0;
    console.log('测试后点击数:', afterClicks);
    
    if (afterClicks > beforeClicks) {
      console.log('✅ 点击统计功能真实有效 - 点击数增加了', afterClicks - beforeClicks);
    } else {
      console.log('⚠️ 点击统计可能未生效，或者存在缓冲延迟');
    }
    
    // 6. 验证ResourceStat记录结构
    console.log('\n6. 验证ResourceStat记录结构...');
    const statRecord = await db.collection("ResourceStat").findOne({
      resourceId: testResource._id
    });
    
    if (statRecord) {
      console.log('✅ ResourceStat记录结构验证:');
      console.log('  resourceId:', statRecord.resourceId);
      console.log('  clicks:', statRecord.clicks);
      console.log('  views:', statRecord.views || 0);
      console.log('  likes:', statRecord.likes || 0);
      console.log('  createdAt:', statRecord.createdAt);
      console.log('  updatedAt:', statRecord.updatedAt);
      
      if (statRecord.resourceId && statRecord.clicks >= 0) {
        console.log('✅ 统计记录结构完整有效');
      } else {
        console.log('❌ 统计记录结构存在问题');
      }
    } else {
      console.log('❌ 未找到统计记录');
    }
    
    // 7. 测试GET请求（跳转功能）
    console.log('\n7. 测试跳转功能...');
    try {
      const response = await fetch(`http://localhost:3000/api/resources/${testResource._id}/click`, {
        method: 'GET',
        redirect: 'manual', // 不自动跟随重定向
        headers: {
          'User-Agent': 'Test-Bot/1.0'
        }
      });
      
      console.log('跳转响应状态:', response.status);
      
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location');
        console.log('跳转目标:', location);
        
        if (location === testResource.quarkLink) {
          console.log('✅ 跳转功能真实有效 - 链接正确');
        } else {
          console.log('⚠️ 跳转链接不匹配');
        }
      } else {
        console.log('⚠️ 跳转功能异常');
      }
    } catch (error) {
      console.error('❌ 跳转测试失败:', error.message);
    }
    
    // 8. 检查所有ResourceStat记录的总数和分布
    console.log('\n8. 检查ResourceStat总体分布...');
    const totalStats = await db.collection("ResourceStat").countDocuments();
    const topStats = await db.collection("ResourceStat")
      .find({})
      .sort({ clicks: -1 })
      .limit(5)
      .toArray();
    
    console.log('总统计记录数:', totalStats);
    console.log('前5个热门资源点击数:');
    topStats.forEach((stat, i) => {
      console.log(`  ${i + 1}. 资源ID: ${stat.resourceId}, 点击数: ${stat.clicks}`);
    });
    
    if (totalStats > 0) {
      console.log('✅ ResourceStat数据完整，统计系统运行正常');
    } else {
      console.log('❌ ResourceStat数据为空，统计系统可能未工作');
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  } finally {
    await client.close();
  }
}

testClickFunctionality().catch(console.error);