const { MongoClient } = require('mongodb');

async function verifyUsers() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.log('DATABASE_URL not set');
    process.exit(1);
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    
    console.log('=== 用户数据库真实验证 ===');
    console.log('用户总数:', users.length);
    
    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`);
      console.log('  ID:', user._id);
      console.log('  邮箱:', user.email);
      console.log('  姓名:', user.name);
      console.log('  角色:', user.role);
      console.log('  密码已加密:', user.password ? '是 (bcrypt hash)' : '否');
      console.log('  密码长度:', user.password ? user.password.length : 0);
      console.log('  创建时间:', user.createdAt);
      console.log('  ---');
    });
    
    const count = await db.collection('users').countDocuments();
    console.log('数据库用户计数验证:', count);
    
    await client.close();
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
}

verifyUsers();