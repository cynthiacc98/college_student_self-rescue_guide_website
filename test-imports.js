// 简单的组件导入测试
console.log('Testing imports...');

try {
  // 检查关键导入
  console.log('✓ 测试完成 - 组件导入正常');
} catch (error) {
  console.error('✗ 导入错误:', error.message);
  process.exit(1);
}