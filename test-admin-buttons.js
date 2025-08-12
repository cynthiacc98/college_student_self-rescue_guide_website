const { chromium } = require('playwright');

async function testAdminButtons() {
  console.log('=== 管理后台按钮功能真实性验证 ===');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. 登录管理员账户
    console.log('\n1. 登录管理员账户...');
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("登录")');
    
    // 等待登录完成
    await page.waitForTimeout(2000);
    
    // 2. 访问管理后台
    console.log('\n2. 访问管理后台主页...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // 检查管理后台是否正常加载
    const adminTitle = await page.textContent('h1');
    console.log('管理后台标题:', adminTitle);
    
    // 3. 验证仪表板数字
    console.log('\n3. 验证仪表板数字...');
    
    // 检查数字卡片
    const cards = await page.locator('.card').all();
    console.log('找到数字卡片数量:', cards.length);
    
    for (let i = 0; i < cards.length && i < 3; i++) {
      const card = cards[i];
      try {
        const title = await card.locator('.text-sm').textContent();
        const value = await card.locator('.text-3xl').textContent();
        const hint = await card.locator('.text-xs').textContent();
        
        console.log(`卡片 ${i + 1}:`);
        console.log(`  标题: ${title}`);
        console.log(`  数值: ${value}`);
        console.log(`  说明: ${hint}`);
        
        // 验证数值是否为数字
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
          console.log(`  ✅ 数值有效: ${numValue}`);
        } else {
          console.log(`  ❌ 数值无效: ${value}`);
        }
      } catch (error) {
        console.log(`  ❌ 卡片 ${i + 1} 读取失败:`, error.message);
      }
    }
    
    // 4. 测试用户管理页面
    console.log('\n4. 测试用户管理页面...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    
    // 检查用户表格是否加载
    const userTable = await page.locator('table').first();
    if (await userTable.count() > 0) {
      console.log('✅ 用户管理表格已加载');
      
      // 检查用户数量
      const userRows = await page.locator('tbody tr').all();
      console.log('用户列表行数:', userRows.length);
      
      if (userRows.length > 0) {
        console.log('✅ 用户数据真实存在');
        
        // 检查第一行用户数据
        const firstRow = userRows[0];
        const email = await firstRow.locator('td').nth(1).textContent();
        const name = await firstRow.locator('td').nth(2).textContent();
        const role = await firstRow.locator('td').nth(3).textContent();
        
        console.log('第一个用户:');
        console.log(`  邮箱: ${email}`);
        console.log(`  姓名: ${name}`);
        console.log(`  角色: ${role}`);
      } else {
        console.log('❌ 用户列表为空');
      }
    } else {
      console.log('❌ 用户管理表格未加载');
    }
    
    // 5. 测试资源管理页面
    console.log('\n5. 测试资源管理页面...');
    await page.goto('http://localhost:3000/admin/resources');
    await page.waitForTimeout(2000);
    
    // 检查资源表格
    const resourceTable = await page.locator('table').first();
    if (await resourceTable.count() > 0) {
      console.log('✅ 资源管理表格已加载');
      
      const resourceRows = await page.locator('tbody tr').all();
      console.log('资源列表行数:', resourceRows.length);
      
      if (resourceRows.length > 0) {
        console.log('✅ 资源数据真实存在');
        
        // 检查第一行资源数据
        const firstRow = resourceRows[0];
        const title = await firstRow.locator('td').first().textContent();
        
        console.log('第一个资源标题:', title);
        
        // 检查操作按钮是否存在
        const editButton = await firstRow.locator('a:has-text("编辑")').count();
        const deleteButton = await firstRow.locator('button:has-text("删除")').count();
        
        console.log('编辑按钮存在:', editButton > 0 ? '是' : '否');
        console.log('删除按钮存在:', deleteButton > 0 ? '是' : '否');
        
        if (editButton > 0 || deleteButton > 0) {
          console.log('✅ 资源管理操作按钮真实存在');
        }
      } else {
        console.log('❌ 资源列表为空');
      }
    } else {
      console.log('❌ 资源管理表格未加载');
    }
    
    // 6. 测试新建资源按钮
    console.log('\n6. 测试新建资源按钮...');
    const newResourceButton = await page.locator('a:has-text("新建资源")');
    if (await newResourceButton.count() > 0) {
      console.log('✅ 新建资源按钮存在');
      
      // 点击新建资源按钮
      await newResourceButton.click();
      await page.waitForTimeout(2000);
      
      // 检查是否跳转到新建页面
      const currentUrl = page.url();
      console.log('新建资源页面URL:', currentUrl);
      
      if (currentUrl.includes('/admin/resources/new')) {
        console.log('✅ 新建资源按钮功能真实有效');
        
        // 检查表单是否存在
        const form = await page.locator('form').first();
        if (await form.count() > 0) {
          console.log('✅ 新建资源表单已加载');
          
          // 检查关键表单字段
          const titleField = await page.locator('input[name="title"]').count();
          const descField = await page.locator('textarea[name="description"]').count();
          const linkField = await page.locator('input[name="quarkLink"]').count();
          const submitButton = await page.locator('button[type="submit"]').count();
          
          console.log('表单字段检查:');
          console.log(`  标题字段: ${titleField > 0 ? '存在' : '不存在'}`);
          console.log(`  描述字段: ${descField > 0 ? '存在' : '不存在'}`);
          console.log(`  链接字段: ${linkField > 0 ? '存在' : '不存在'}`);
          console.log(`  提交按钮: ${submitButton > 0 ? '存在' : '不存在'}`);
          
          if (titleField > 0 && descField > 0 && linkField > 0 && submitButton > 0) {
            console.log('✅ 新建资源表单完整有效');
          }
        } else {
          console.log('❌ 新建资源表单未加载');
        }
      } else {
        console.log('❌ 新建资源按钮跳转异常');
      }
    } else {
      console.log('❌ 新建资源按钮不存在');
    }
    
    // 7. 测试分类管理页面
    console.log('\n7. 测试分类管理页面...');
    await page.goto('http://localhost:3000/admin/categories');
    await page.waitForTimeout(2000);
    
    // 检查分类数据
    const categoryRows = await page.locator('tbody tr').all();
    console.log('分类列表行数:', categoryRows.length);
    
    if (categoryRows.length > 0) {
      console.log('✅ 分类数据真实存在');
      
      const firstCategory = categoryRows[0];
      const categoryName = await firstCategory.locator('td').first().textContent();
      console.log('第一个分类名称:', categoryName);
      
      // 检查分类操作按钮
      const categoryEditBtn = await firstCategory.locator('button:has-text("编辑")').count();
      const categoryDeleteBtn = await firstCategory.locator('button:has-text("删除")').count();
      
      console.log('分类编辑按钮存在:', categoryEditBtn > 0 ? '是' : '否');
      console.log('分类删除按钮存在:', categoryDeleteBtn > 0 ? '是' : '否');
      
      if (categoryEditBtn > 0 || categoryDeleteBtn > 0) {
        console.log('✅ 分类管理操作按钮真实存在');
      }
    } else {
      console.log('❌ 分类列表为空');
    }
    
    console.log('\n=== 管理后台按钮验证完成 ===');
    
  } catch (error) {
    console.error('❌ 管理后台测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

// 检查服务器运行状态
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
  
  await testAdminButtons();
}

main().catch(console.error);