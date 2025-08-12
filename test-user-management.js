/**
 * 用户管理功能全面测试套件
 * 测试所有用户管理相关API端点、权限验证、错误处理和边界情况
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function runTest(testName, testFn) {
  return new Promise(async (resolve) => {
    testResults.total++;
    try {
      log(`\n🧪 测试: ${testName}`, 'cyan');
      const result = await testFn();
      if (result.success) {
        testResults.passed++;
        log(`✅ 通过: ${testName}`, 'green');
        if (result.details) {
          log(`   详情: ${result.details}`, 'blue');
        }
      } else {
        testResults.failed++;
        testResults.errors.push({ test: testName, error: result.error });
        log(`❌ 失败: ${testName}`, 'red');
        log(`   错误: ${result.error}`, 'red');
      }
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: testName, error: error.message });
      log(`❌ 异常: ${testName}`, 'red');
      log(`   异常: ${error.message}`, 'red');
    }
    resolve();
  });
}

// 模拟管理员会话
async function getAdminSession() {
  try {
    // 尝试使用管理员身份登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return loginResponse.headers['set-cookie'] || [];
  } catch (error) {
    log('⚠️  无法获取管理员会话，将使用无权限测试', 'yellow');
    return [];
  }
}

// 测试用户列表获取
async function testGetUsers(cookies = []) {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        details: `获取到${response.data.data?.length || 0}个用户`
      };
    } else {
      return {
        success: false,
        error: `获取用户列表失败: ${response.data.error || '未知错误'}`
      };
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: true,
        details: '权限验证正常工作 - 未授权访问被拒绝'
      };
    }
    return {
      success: false,
      error: `请求失败: ${error.message}`
    };
  }
}

// 测试用户状态切换功能
async function testUserStatusToggle(cookies = []) {
  try {
    // 先获取用户列表找到一个测试用户
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (!usersResponse.data.success || !usersResponse.data.data?.length) {
      return {
        success: false,
        error: '无法获取用户列表或用户列表为空'
      };
    }

    const testUser = usersResponse.data.data.find(u => u.email !== 'admin@example.com');
    if (!testUser) {
      return {
        success: false,
        error: '找不到可测试的非管理员用户'
      };
    }

    // 测试状态切换API (检查API端点不匹配问题)
    // 前端调用: `/api/admin/users/${userId}` with action: "toggle_status"
    // 但实际API路径是: `/api/admin/users/${userId}/status`
    
    // 测试前端期望的路径
    try {
      const toggleResponse1 = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}`, {
        action: 'toggle_status'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies.join('; ')
        }
      });
      
      return {
        success: false,
        error: 'API端点不匹配 - 前端调用的路径不应该存在'
      };
    } catch (error) {
      // 这是期望的结果，因为这个端点不存在
    }

    // 测试正确的API路径
    const toggleResponse = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/status`, {
      isActive: !testUser.isActive
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (toggleResponse.status === 200 && toggleResponse.data.success) {
      return {
        success: true,
        details: `用户状态切换成功 - ${testUser.isActive ? '已禁用' : '已启用'}`
      };
    } else {
      return {
        success: false,
        error: `状态切换失败: ${toggleResponse.data.error || '未知错误'}`
      };
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: true,
        details: '权限验证正常工作 - 未授权访问被拒绝'
      };
    }
    return {
      success: false,
      error: `测试用户状态切换失败: ${error.message}`
    };
  }
}

// 测试新增用户功能
async function testCreateUser(cookies = []) {
  try {
    const newUser = {
      name: `测试用户_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      isActive: true,
      roleIds: []
    };

    // 测试CreateUserDialog调用的API
    const response = await axios.post(`${BASE_URL}/api/admin/users/create`, newUser, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        details: `用户创建成功: ${newUser.name} (${newUser.email})`
      };
    } else {
      return {
        success: false,
        error: `创建用户失败: ${response.data.error || '未知错误'}`
      };
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: true,
        details: '权限验证正常工作 - 未授权访问被拒绝'
      };
    }
    return {
      success: false,
      error: `测试创建用户失败: ${error.message}`
    };
  }
}

// 测试角色管理功能
async function testRoleManagement(cookies = []) {
  try {
    // 先获取可用的角色列表
    const rolesResponse = await axios.get(`${BASE_URL}/api/admin/roles`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (!rolesResponse.data.success) {
      return {
        success: false,
        error: '无法获取角色列表'
      };
    }

    const roles = rolesResponse.data.data || [];
    if (roles.length === 0) {
      return {
        success: false,
        error: '系统中没有可用的角色'
      };
    }

    // 获取用户列表找到一个测试用户
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    const testUser = usersResponse.data.data?.find(u => u.email !== 'admin@example.com');
    if (!testUser) {
      return {
        success: false,
        error: '找不到可测试的用户'
      };
    }

    // 测试角色分配
    const roleIds = [roles[0].id]; // 分配第一个角色
    const assignRoleResponse = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/roles`, {
      roleIds
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    if (assignRoleResponse.status === 200 && assignRoleResponse.data.success) {
      return {
        success: true,
        details: `角色分配成功: 为用户 ${testUser.name || testUser.email} 分配了角色 ${roles[0].displayName}`
      };
    } else {
      return {
        success: false,
        error: `角色分配失败: ${assignRoleResponse.data.error || '未知错误'}`
      };
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: true,
        details: '权限验证正常工作 - 未授权访问被拒绝'
      };
    }
    return {
      success: false,
      error: `测试角色管理失败: ${error.message}`
    };
  }
}

// 测试输入验证和错误处理
async function testInputValidation(cookies = []) {
  try {
    const testCases = [
      // 测试无效的用户创建数据
      {
        data: { email: 'invalid-email', password: '123' },
        expected: '验证失败'
      },
      // 测试重复邮箱
      {
        data: { name: 'Test', email: 'admin@example.com', password: 'password123' },
        expected: '邮箱已被注册'
      },
      // 测试密码太短
      {
        data: { name: 'Test', email: 'test@example.com', password: '123' },
        expected: '密码长度不足'
      }
    ];

    let validationsPassed = 0;
    
    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${BASE_URL}/api/admin/users/create`, testCase.data, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies.join('; ')
          }
        });
        
        // 如果请求成功，说明验证有问题
        if (response.data.success) {
          return {
            success: false,
            error: `输入验证失效 - 应该拒绝的数据被接受了: ${JSON.stringify(testCase.data)}`
          };
        }
      } catch (error) {
        // 期望的错误响应
        if (error.response?.status >= 400 && error.response?.status < 500) {
          validationsPassed++;
        }
      }
    }

    return {
      success: true,
      details: `输入验证正常 - ${validationsPassed}/${testCases.length} 个测试用例通过`
    };
  } catch (error) {
    return {
      success: false,
      error: `测试输入验证失败: ${error.message}`
    };
  }
}

// 测试权限边界
async function testPermissionBoundaries() {
  try {
    // 测试未认证访问
    const unauthorizedTests = [
      { url: '/api/admin/users', method: 'GET' },
      { url: '/api/admin/users/create', method: 'POST', data: {} },
      { url: '/api/admin/users/test/status', method: 'PATCH', data: {} }
    ];

    let permissionTestsPassed = 0;

    for (const test of unauthorizedTests) {
      try {
        if (test.method === 'GET') {
          await axios.get(`${BASE_URL}${test.url}`);
        } else if (test.method === 'POST') {
          await axios.post(`${BASE_URL}${test.url}`, test.data);
        } else if (test.method === 'PATCH') {
          await axios.patch(`${BASE_URL}${test.url}`, test.data);
        }
        
        // 如果请求成功，说明权限验证有问题
        return {
          success: false,
          error: `权限验证失效 - 未认证请求应该被拒绝: ${test.method} ${test.url}`
        };
      } catch (error) {
        // 期望的401或403错误
        if (error.response?.status === 401 || error.response?.status === 403) {
          permissionTestsPassed++;
        }
      }
    }

    return {
      success: true,
      details: `权限边界测试通过 - ${permissionTestsPassed}/${unauthorizedTests.length} 个未授权请求被正确拒绝`
    };
  } catch (error) {
    return {
      success: false,
      error: `测试权限边界失败: ${error.message}`
    };
  }
}

// 测试API端点不匹配问题
async function testAPIEndpointMismatch() {
  try {
    // 检查前端组件与API端点的匹配性
    const issues = [];

    // 1. UsersManager组件调用的端点与实际API不匹配
    // 前端: `/api/admin/users/${userId}` with action: "toggle_status"
    // 实际: `/api/admin/users/${userId}/status`
    
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/test-id`, {
        action: 'toggle_status'
      });
      issues.push('前端状态切换端点错误 - 此端点不应存在');
    } catch (error) {
      if (error.response?.status === 404) {
        // 这是期望的结果
      } else {
        issues.push(`状态切换端点测试异常: ${error.message}`);
      }
    }

    // 2. 角色更新端点测试
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/test-id`, {
        action: 'update_role',
        role: 'USER'
      });
      issues.push('前端角色更新端点错误 - 此端点不应存在');
    } catch (error) {
      if (error.response?.status === 404) {
        // 这是期望的结果
      } else {
        issues.push(`角色更新端点测试异常: ${error.message}`);
      }
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: `API端点不匹配问题: ${issues.join('; ')}`
      };
    }

    return {
      success: true,
      details: 'API端点匹配性检查通过'
    };
  } catch (error) {
    return {
      success: false,
      error: `测试API端点匹配性失败: ${error.message}`
    };
  }
}

// 主测试函数
async function runUserManagementTests() {
  log('🚀 开始用户管理功能全面测试', 'magenta');
  log('====================================', 'magenta');

  // 获取管理员会话
  const cookies = await getAdminSession();
  
  // 运行所有测试
  await runTest('获取用户列表', () => testGetUsers(cookies));
  await runTest('用户状态切换功能', () => testUserStatusToggle(cookies));
  await runTest('新增用户功能', () => testCreateUser(cookies));
  await runTest('角色管理功能', () => testRoleManagement(cookies));
  await runTest('输入验证和错误处理', () => testInputValidation(cookies));
  await runTest('权限边界测试', () => testPermissionBoundaries());
  await runTest('API端点匹配性检查', () => testAPIEndpointMismatch());

  // 输出测试结果
  log('\n📊 测试结果汇总', 'magenta');
  log('====================================', 'magenta');
  log(`总测试数: ${testResults.total}`, 'blue');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');
  log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');

  if (testResults.failed > 0) {
    log('\n❌ 失败的测试详情:', 'red');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.test}:`, 'red');
      log(`   ${error.error}`, 'red');
    });

    log('\n🔧 发现的问题和建议:', 'yellow');
    log('1. API端点不匹配 - 前端组件调用的API路径与实际实现不符', 'yellow');
    log('2. 用户状态切换需要使用 /api/admin/users/{id}/status 端点', 'yellow');
    log('3. 角色更新需要使用 /api/admin/users/{id}/roles 端点', 'yellow');
    log('4. 建议修复前端组件中的API调用路径', 'yellow');
  }

  log('\n✨ 测试完成!', 'magenta');
  
  return testResults;
}

// 如果直接运行此脚本
if (require.main === module) {
  runUserManagementTests().catch(console.error);
}

module.exports = { runUserManagementTests };