const { chromium } = require('playwright');

async function testFrontendAuth() {
  console.log('=== 前端登录注册流程真实验证 ===');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. 测试登录页面加载
    console.log('\n1. 测试登录页面加载...');
    await page.goto('http://localhost:3000/login');
    
    // 检查关键元素是否存在
    const emailInput = await page.locator('input[name="email"]');
    const passwordInput = await page.locator('input[type="password"]');
    const loginButton = await page.locator('button:has-text("登录")');
    const registerLink = await page.locator('a[href="/register"]');
    
    console.log('✅ 登录页面元素检查:');
    console.log('  邮箱输入框:', await emailInput.count() > 0 ? '存在' : '不存在');
    console.log('  密码输入框:', await passwordInput.count() > 0 ? '存在' : '不存在');
    console.log('  登录按钮:', await loginButton.count() > 0 ? '存在' : '不存在');
    console.log('  注册链接:', await registerLink.count() > 0 ? '存在' : '不存在');
    
    // 2. 测试表单验证
    console.log('\n2. 测试表单验证...');
    
    // 测试空表单提交
    await loginButton.first().click();
    await page.waitForTimeout(1000);
    
    // 测试错误登录
    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.first().click();
    
    // 等待错误提示
    await page.waitForTimeout(2000);
    
    // 3. 测试正确登录
    console.log('\n3. 测试正确登录...');
    await emailInput.clear();
    await passwordInput.clear();
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('admin123');
    
    // 监听网络请求
    let loginRequestMade = false;
    page.on('request', request => {
      if (request.url().includes('/api/auth/callback/credentials')) {
        console.log('✅ 登录API请求已发送:', request.method());
        loginRequestMade = true;
      }
    });
    
    await loginButton.first().click();
    
    // 等待登录处理
    await page.waitForTimeout(3000);
    
    // 检查是否登录成功（页面跳转）
    const currentUrl = page.url();
    console.log('登录后当前URL:', currentUrl);
    
    if (currentUrl === 'http://localhost:3000/' || !currentUrl.includes('/login')) {
      console.log('✅ 登录成功，页面已跳转');
    } else {
      console.log('⚠️ 登录后仍在登录页面');
    }
    
    // 4. 检查登录状态
    console.log('\n4. 检查登录状态...');
    await page.goto('http://localhost:3000/admin');
    
    await page.waitForTimeout(2000);
    const adminUrl = page.url();
    console.log('访问管理页面URL:', adminUrl);
    
    if (adminUrl.includes('/admin') && !adminUrl.includes('/login')) {
      console.log('✅ 管理员权限验证成功，可访问后台');
    } else {
      console.log('⚠️ 管理员权限验证失败或重定向到登录页');
    }
    
    console.log('\n=== 前端验证完成 ===');
    
  } catch (error) {
    console.error('❌ 前端测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

// 检查服务器是否运行
async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ 服务器未运行，请先启动开发服务器: npm run dev');
    return;
  }
  
  await testFrontendAuth();
}

main().catch(console.error);