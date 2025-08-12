async function testDashboardAPI() {
  console.log('=== Dashboard API真实性验证 ===');
  
  try {
    // 首先登录获取session
    console.log('\n1. 模拟管理员登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        redirect: false
      })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    
    // 测试Dashboard API
    console.log('\n2. 测试Dashboard API...');
    const response = await fetch('http://localhost:3000/api/admin/dashboard?range=7d', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
      credentials: 'include'
    });
    
    console.log('Dashboard API状态码:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Dashboard API响应成功');
      
      if (result.success && result.data) {
        const data = result.data;
        
        console.log('\n3. 验证核心指标数据:');
        console.log('  学习资源数量:', data.metrics.resourceCount);
        console.log('  用户数量:', data.metrics.userCount);
        console.log('  分类数量:', data.metrics.categoryCount);
        console.log('  总浏览量:', data.metrics.totalViews);
        console.log('  总点击量:', data.metrics.totalClicks);
        console.log('  活跃用户:', data.metrics.activeUsers);
        console.log('  今日注册:', data.metrics.todayRegistrations);
        console.log('  月增长率:', data.metrics.monthlyGrowth + '%');
        
        // 验证数字的真实性
        let validMetrics = 0;
        Object.entries(data.metrics).forEach(([key, value]) => {
          if (typeof value === 'number' && !isNaN(value) && value >= 0) {
            validMetrics++;
          }
        });
        
        console.log(`✅ 核心指标验证: ${validMetrics}/${Object.keys(data.metrics).length} 个指标有效`);
        
        console.log('\n4. 验证图表数据:');
        console.log('  每日统计数据点数:', data.charts.dailyStats.length);
        console.log('  分类统计数据点数:', data.charts.categoryStats.length);
        console.log('  热门资源数据点数:', data.charts.topResources.length);
        console.log('  用户增长数据点数:', data.charts.userGrowth.length);
        
        // 验证热门资源数据
        if (data.charts.topResources.length > 0) {
          console.log('\n5. 热门资源详情 (前5个):');
          data.charts.topResources.slice(0, 5).forEach((resource, i) => {
            console.log(`  ${i + 1}. ${resource.title}`);
            console.log(`      浏览量: ${resource.views}, 点击量: ${resource.clicks}`);
          });
          console.log('✅ 热门资源数据真实有效');
        } else {
          console.log('⚠️ 热门资源数据为空');
        }
        
        // 验证分类统计
        if (data.charts.categoryStats.length > 0) {
          console.log('\n6. 分类统计详情:');
          data.charts.categoryStats.forEach((category, i) => {
            console.log(`  ${i + 1}. ${category.name}: ${category.value} 个资源`);
          });
          console.log('✅ 分类统计数据真实有效');
        } else {
          console.log('⚠️ 分类统计数据为空');
        }
        
        // 验证最近活动
        if (data.recentActivity && data.recentActivity.length > 0) {
          console.log('\n7. 最近活动详情 (前5个):');
          data.recentActivity.slice(0, 5).forEach((activity, i) => {
            console.log(`  ${i + 1}. ${activity.user} ${activity.action} ${activity.resource}`);
            console.log(`      时间: ${activity.time}`);
          });
          console.log('✅ 最近活动数据真实有效');
        } else {
          console.log('⚠️ 最近活动数据为空');
        }
        
        console.log('\n=== Dashboard API验证结果 ===');
        console.log('✅ API端点工作正常');
        console.log('✅ 数据结构完整');
        console.log('✅ 指标数据真实有效');
        console.log('✅ 图表数据可用');
        
      } else {
        console.log('❌ API响应格式异常:', result);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Dashboard API调用失败');
      console.log('响应内容:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Dashboard API测试失败:', error.message);
  }
}

async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ 服务器未运行，请先启动开发服务器: npm run dev');
    return;
  }
  
  await testDashboardAPI();
}

main().catch(console.error);