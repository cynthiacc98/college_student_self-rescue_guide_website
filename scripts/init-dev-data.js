const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeDevData() {
  try {
    console.log('开始初始化开发数据...');

    // 初始化系统设置
    console.log('1. 初始化系统设置...');
    const settings = [
      {
        key: 'siteName',
        value: '大学生自救指南',
        category: 'SYSTEM',
        description: '网站名称',
        isPublic: true
      },
      {
        key: 'siteDescription',
        value: '高质量学习资料分享与检索平台',
        category: 'SYSTEM',
        description: '网站描述',
        isPublic: true
      },
      {
        key: 'allowRegistration',
        value: true,
        category: 'SYSTEM',
        description: '是否允许用户注册',
        isPublic: true
      },
      {
        key: 'maintenanceMode',
        value: false,
        category: 'SYSTEM',
        description: '维护模式',
        isPublic: false
      },
      {
        key: 'maxFileSize',
        value: 100 * 1024 * 1024, // 100MB
        category: 'SYSTEM',
        description: '最大文件大小（字节）',
        isPublic: true
      },
      {
        key: 'allowedFileTypes',
        value: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar'],
        category: 'SYSTEM',
        description: '允许的文件类型',
        isPublic: true
      },
      {
        key: 'enableAnalytics',
        value: true,
        category: 'SYSTEM',
        description: '启用分析统计',
        isPublic: false
      },
      {
        key: 'enableCache',
        value: true,
        category: 'SYSTEM',
        description: '启用缓存',
        isPublic: false
      },
      {
        key: 'cacheExpiry',
        value: 300000, // 5分钟
        category: 'SYSTEM',
        description: '缓存过期时间（毫秒）',
        isPublic: false
      }
    ];

    for (const setting of settings) {
      try {
        const existing = await prisma.setting.findUnique({
          where: { key: setting.key }
        });
        if (!existing) {
          await prisma.setting.create({ data: setting });
        }
      } catch (error) {
        if (error.code !== 'P2002') { // P2002 = unique constraint violation
          throw error;
        }
      }
    }
    console.log('✅ 系统设置初始化完成');

    // 初始化默认分类
    console.log('2. 初始化默认分类...');
    const categories = [
      {
        name: '计算机科学',
        slug: 'computer-science',
        description: '程序设计、算法、数据结构、软件工程等',
        iconUrl: '🖥️',
        color: '#0ea5e9',
        order: 1,
        isActive: true,
        isFeatured: true
      },
      {
        name: '数学',
        slug: 'mathematics',
        description: '高等数学、线性代数、概率论、离散数学等',
        iconUrl: '📐',
        color: '#8b5cf6',
        order: 2,
        isActive: true,
        isFeatured: true
      },
      {
        name: '英语',
        slug: 'english',
        description: '大学英语、雅思、托福、专业英语等',
        iconUrl: '📖',
        color: '#10b981',
        order: 3,
        isActive: true,
        isFeatured: true
      },
      {
        name: '物理',
        slug: 'physics',
        description: '大学物理、理论物理、应用物理等',
        iconUrl: '⚛️',
        color: '#f59e0b',
        order: 4,
        isActive: true,
        isFeatured: false
      },
      {
        name: '化学',
        slug: 'chemistry',
        description: '无机化学、有机化学、物理化学等',
        iconUrl: '🧪',
        color: '#ef4444',
        order: 5,
        isActive: true,
        isFeatured: false
      },
      {
        name: '经济学',
        slug: 'economics',
        description: '微观经济学、宏观经济学、计量经济学等',
        iconUrl: '💰',
        color: '#06b6d4',
        order: 6,
        isActive: true,
        isFeatured: false
      }
    ];

    for (const category of categories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: category.slug }
        });
        if (!existing) {
          await prisma.category.create({ data: category });
        }
      } catch (error) {
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }
    console.log('✅ 默认分类初始化完成');

    // 初始化示例资源
    console.log('3. 初始化示例资源...');
    const computerScienceCategory = await prisma.category.findUnique({
      where: { slug: 'computer-science' }
    });

    const mathCategory = await prisma.category.findUnique({
      where: { slug: 'mathematics' }
    });

    const resources = [
      {
        title: 'JavaScript 高级程序设计',
        slug: 'javascript-advanced-programming',
        description: '深入学习JavaScript语言特性、DOM操作、Ajax、ES6+新特性等。适合前端开发者进阶学习。',
        quarkLink: 'https://pan.quark.cn/example-js',
        tags: ['JavaScript', 'Web开发', '前端'],
        categoryId: computerScienceCategory?.id,
        difficulty: 'INTERMEDIATE',
        fileSize: '50MB',
        fileFormat: 'PDF',
        isPublic: true,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        title: '数据结构与算法分析',
        slug: 'data-structures-algorithms',
        description: '系统学习各种数据结构和算法，包含大量实例和练习题。面试必备。',
        quarkLink: 'https://pan.quark.cn/example-dsa',
        tags: ['数据结构', '算法', '面试'],
        categoryId: computerScienceCategory?.id,
        difficulty: 'INTERMEDIATE',
        fileSize: '80MB',
        fileFormat: 'PDF',
        isPublic: true,
        isFeatured: true,
        status: 'ACTIVE'
      },
      {
        title: '线性代数教程',
        slug: 'linear-algebra-tutorial',
        description: '从基础到高级的线性代数教程，包含矩阵运算、向量空间、特征值等内容。',
        quarkLink: 'https://pan.quark.cn/example-linalg',
        tags: ['线性代数', '数学', '矩阵'],
        categoryId: mathCategory?.id,
        difficulty: 'BEGINNER',
        fileSize: '120MB',
        fileFormat: 'PDF',
        isPublic: true,
        isFeatured: true,
        status: 'ACTIVE'
      }
    ];

    for (const resource of resources) {
      try {
        const existing = await prisma.resource.findUnique({
          where: { slug: resource.slug }
        });
        if (!existing) {
          await prisma.resource.create({ data: resource });
        }
      } catch (error) {
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }
    console.log('✅ 示例资源初始化完成');

    // 初始化资源统计
    console.log('4. 初始化资源统计...');
    const allResources = await prisma.resource.findMany({
      where: { isPublic: true }
    });

    for (const resource of allResources) {
      try {
        const existing = await prisma.resourceStat.findUnique({
          where: { resourceId: resource.id }
        });
        if (!existing) {
          await prisma.resourceStat.create({
            data: {
              resourceId: resource.id,
              views: Math.floor(Math.random() * 100) + 10,
              clicks: Math.floor(Math.random() * 50) + 5,
              likes: Math.floor(Math.random() * 20) + 1
            }
          });
        }
      } catch (error) {
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }
    console.log('✅ 资源统计初始化完成');

    console.log('🎉 开发数据初始化完成！');
  } catch (error) {
    console.error('初始化开发数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDevData().catch(console.error);
}

module.exports = initializeDevData;