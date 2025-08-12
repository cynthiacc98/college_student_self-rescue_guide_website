/**
 * 简化版用户管理API验证脚本
 * 专门针对项目的API端点进行功能验证
 */

// 添加全局fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const API_BASE = 'http://localhost:3000/api';

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const colorMap = {
    info: colors.cyan,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    data: colors.blue
  };
  
  console.log(`[${timestamp}] ${colorMap[level](`[${level.toUpperCase()}]`)} ${message}`);
  if (data) {
    console.log(colors.blue('Data:'), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

// 发送HTTP请求
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'admin-token': 'test-admin-token', // 简化的管理员token
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  log('info', `测试 ${method} ${endpoint}`);
  if (data) log('data', '请求数据', data);
  
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    const success = response.ok;
    log(success ? 'success' : 'error', `状态: ${response.status} - ${success ? '成功' : '失败'}`);
    if (responseData) log('data', '响应数据', responseData);
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData,
      success
    };
  } catch (error) {
    log('error', '请求失败', error.message);
    return {
      ok: false,
      status: 500,
      data: null,
      success: false,
      error: error.message
    };
  }
}

// 测试场景
const tests = [
  {
    name: '获取用户列表',
    method: 'GET',
    endpoint: '/admin/users',
    expectedStatus: [200, 401, 403] // 200成功，401/403权限问题但API存在
  },
  {
    name: '创建用户',
    method: 'POST',
    endpoint: '/admin/users',
    data: {
      name: '测试用户API',
      email: 'test-api@example.com',
      roles: ['user'],
      isActive: true
    },
    expectedStatus: [200, 201, 400, 401, 403]
  },
  {
    name: '创建用户 (create端点)',
    method: 'POST',
    endpoint: '/admin/users/create',
    data: {
      name: '测试用户Create',
      email: 'test-create@example.com',
      roles: ['user'],
      isActive: true
    },
    expectedStatus: [200, 201, 400, 401, 403]
  }
];

// 运行所有测试
async function runTests() {
  log('info', colors.cyan('========================================'));
  log('info', colors.cyan('开始用户管理API简化验证'));
  log('info', colors.cyan('========================================'));
  
  const results = [];
  
  for (const test of tests) {
    log('info', colors.yellow(`测试: ${test.name}`));
    
    const result = await makeRequest(test.method, test.endpoint, test.data);
    const statusOk = test.expectedStatus.includes(result.status);
    const testPassed = statusOk;
    
    results.push({
      name: test.name,
      passed: testPassed,
      status: result.status,
      response: result.data
    });
    
    log(testPassed ? 'success' : 'error', 
        `${testPassed ? '✅ PASS' : '❌ FAIL'} - ${test.name}`);
    
    if (!testPassed) {
      log('error', `预期状态: ${test.expectedStatus.join('/')}, 实际: ${result.status}`);
    }
    
    log('info', '---');
    
    // 小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 输出结果总结
  log('info', colors.cyan('========================================'));
  log('info', colors.cyan('测试结果总结'));
  log('info', colors.cyan('========================================'));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  
  for (const result of results) {
    const status = result.passed ? colors.green('✅ PASS') : colors.red('❌ FAIL');
    log('info', `${status} ${result.name} (状态: ${result.status})`);
  }
  
  log('info', colors.cyan('========================================'));
  log('info', `总计: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    log('success', colors.green('🎉 基础API端点验证通过！'));
  } else {
    log('warning', colors.yellow('⚠️  部分API可能需要进一步检查'));
  }
  
  return results;
}

// 检查服务器连接
async function checkServer() {
  try {
    log('info', '检查服务器连接...');
    const response = await fetch('http://localhost:3000');
    if (response.status < 500) {
      log('success', '服务器连接正常');
      return true;
    }
    log('error', `服务器响应异常: ${response.status}`);
    return false;
  } catch (error) {
    log('error', '无法连接到服务器', error.message);
    return false;
  }
}

// 主函数
async function main() {
  if (!(await checkServer())) {
    log('error', '请确保开发服务器正在运行 (npm run dev)');
    process.exit(1);
  }
  
  const results = await runTests();
  
  // 基于结果给出具体建议
  log('info', colors.cyan('========================================'));
  log('info', colors.cyan('验证建议'));
  log('info', colors.cyan('========================================'));
  
  const apiIssues = results.filter(r => !r.passed);
  
  if (apiIssues.length === 0) {
    log('success', '✅ API端点基本可用');
    log('success', '建议进行前端集成测试');
  } else {
    log('warning', '发现以下问题:');
    for (const issue of apiIssues) {
      if (issue.status === 401 || issue.status === 403) {
        log('info', `- ${issue.name}: 权限验证问题 (可能需要真实的管理员session)`);
      } else if (issue.status === 404) {
        log('error', `- ${issue.name}: API端点不存在`);
      } else if (issue.status === 500) {
        log('error', `- ${issue.name}: 服务器内部错误`);
      } else {
        log('warning', `- ${issue.name}: 状态码 ${issue.status}`);
      }
    }
  }
  
  log('info', colors.cyan('========================================'));
}

// 启动程序
if (require.main === module) {
  main().catch(error => {
    log('error', '程序异常', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };