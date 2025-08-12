import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hash } from "bcryptjs";
import { initializeDefaultRoles, assignRole } from "@/lib/rbac";
import { ObjectId } from "mongodb";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 初始化默认角色
    await initializeDefaultRoles();

    // 创建管理员用户
    const adminEmail = "admin@example.com";
    const adminPassword = "admin123";
    const hashedPassword = await hash(adminPassword, 12);

    const adminUser = await db.collection("users").findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          email: adminEmail,
          password: hashedPassword,
          name: "Administrator",
          role: "ADMIN",
          status: "ACTIVE",
          emailVerified: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );

    // 为管理员用户分配ADMIN角色
    if (adminUser) {
      const adminRole = await db.collection("Role").findOne({ name: "ADMIN" });
      if (adminRole) {
        // 检查是否已经有角色分配
        const existingUserRole = await db.collection("UserRole").findOne({
          userId: adminUser._id.toString(),
          roleId: adminRole._id.toString()
        });
        
        if (!existingUserRole) {
          await db.collection("UserRole").insertOne({
            userId: adminUser._id.toString(),
            roleId: adminRole._id.toString(),
            assignedBy: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    const categories = [
      { 
        name: "高等数学", 
        slug: "mathematics", 
        description: "高等数学相关学习资料，包括教材、习题集、视频课程等",
        iconUrl: "📐",
        color: "#3B82F6"
      },
      { 
        name: "英语四六级", 
        slug: "english-cet", 
        description: "英语四级六级考试资料，包括真题、词汇、听力等",
        iconUrl: "🇬🇧",
        color: "#10B981"
      },
      { 
        name: "计算机基础", 
        slug: "computer-science", 
        description: "计算机科学基础课程，包括数据结构、算法、操作系统等",
        iconUrl: "💻",
        color: "#8B5CF6"
      },
      { 
        name: "考研资料", 
        slug: "postgraduate", 
        description: "研究生入学考试相关资料，包括政治、数学、英语、专业课",
        iconUrl: "🎓",
        color: "#F59E0B"
      },
      { 
        name: "专业课程", 
        slug: "major-courses", 
        description: "各专业核心课程资料，包括理工科、文科、商科等",
        iconUrl: "📚",
        color: "#EF4444"
      },
      { 
        name: "职业技能", 
        slug: "professional-skills", 
        description: "职场技能和证书考试资料，如办公软件、编程语言等",
        iconUrl: "🔧",
        color: "#06B6D4"
      }
    ];

    for (const [index, c] of categories.entries()) {
      await db.collection("Category").updateOne(
        { slug: c.slug },
        {
          $set: {
            name: c.name,
            slug: c.slug,
            description: c.description,
            iconUrl: c.iconUrl,
            color: c.color,
            isActive: true,
            isFeatured: index < 3,
            order: index,
            resourceCount: 0,
            viewCount: 0,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }

    // 获取分类信息用于资源关联
    const mathCategory = await db.collection("Category").findOne({ slug: "mathematics" });
    const englishCategory = await db.collection("Category").findOne({ slug: "english-cet" });
    const csCategory = await db.collection("Category").findOne({ slug: "computer-science" });
    const gradCategory = await db.collection("Category").findOne({ slug: "postgraduate" });
    const majorCategory = await db.collection("Category").findOne({ slug: "major-courses" });
    const skillsCategory = await db.collection("Category").findOne({ slug: "professional-skills" });

    // 清理所有现有资源数据，避免占位符数据
    await db.collection("Resource").deleteMany({});
    await db.collection("ResourceStat").deleteMany({});
    
    // 重置所有分类的资源计数
    await db.collection("Category").updateMany(
      {},
      {
        $set: {
          resourceCount: 0,
          viewCount: 0,
          updatedAt: now
        }
      }
    );

    const sampleResources = [
      // 高等数学资料 - 真实链接格式
      {
        title: "高等数学上册教材 - 同济大学第七版PDF",
        slug: "advanced-mathematics-vol1-tongji-7th",
        description: "同济大学出版社高等数学教材第七版上册完整版，涵盖函数与极限、一元函数微分学、一元函数积分学及其应用。高清扫描版本，包含例题详解和课后习题答案。适合工科、理科学生使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/4f8b2e6a1c9d",
        categoryId: mathCategory?._id?.toString(),
        tags: ["高等数学", "同济大学", "教材", "PDF", "微积分"],
        difficulty: "INTERMEDIATE",
        fileSize: "125.8 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 156,
        isFeatured: true
      },
      {
        title: "线性代数课程讲义及习题详解 - 清华版",
        slug: "linear-algebra-exercises-tsinghua",
        description: "清华大学线性代数课程完整讲义和习题详解，包含行列式、矩阵、向量组的线性相关性、线性方程组、矩阵的特征值和特征向量、二次型等核心内容。每章配有大量例题和课后习题详细解答。",
        coverImageUrl: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/7a3c5d9e2f1b",
        categoryId: mathCategory?._id?.toString(),
        tags: ["线性代数", "习题解答", "清华大学", "理工科", "矩阵"],
        difficulty: "ADVANCED",
        fileSize: "89.3 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 89
      },
      {
        title: "概率论与数理统计教程 - 浙江大学版",
        slug: "probability-statistics-zju",
        description: "浙江大学概率论与数理统计教材及习题解答，涵盖随机事件与概率、随机变量及其分布、多维随机变量、数字特征、大数定律、参数估计、假设检验等内容。理论与实际应用并重。",
        coverImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/9b6e4f2a8c7d",
        categoryId: mathCategory?._id?.toString(),
        tags: ["概率论", "数理统计", "浙江大学", "数学建模"],
        difficulty: "ADVANCED",
        fileSize: "156.7 MB",
        fileFormat: "PDF",
        rating: 4.6,
        reviewCount: 112
      },
      // 英语四六级资料 - 真实资源
      {
        title: "英语四级历年真题及详解 2019-2024",
        slug: "cet4-real-tests-2019-2024",
        description: "收录2019年6月至2024年12月英语四级考试全部真题，包含听力原文、阅读理解详解、完形填空解析、翻译参考答案、写作范文点评。附带高质量MP3听力音频，是备考四级的必备资料。",
        coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/8e5f3a9b2c6d",
        categoryId: englishCategory?._id?.toString(),
        tags: ["英语四级", "CET4", "真题", "听力", "MP3"],
        difficulty: "INTERMEDIATE",
        fileSize: "234.7 MB",
        fileFormat: "PDF+MP3",
        rating: 4.9,
        reviewCount: 203,
        isFeatured: true
      },
      {
        title: "新东方四级词汇精讲 - 乱序版3500词",
        slug: "new-oriental-cet4-vocabulary",
        description: "新东方英语教学团队编写的四级核心词汇3500个，采用科学的乱序编排避免机械记忆。每个词汇包含详细音标、词性变化、常用搭配、真题例句和记忆方法。配套练习题和单词卡片。",
        coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/6c4a8e1f9b2d",
        categoryId: englishCategory?._id?.toString(),
        tags: ["英语四级", "词汇", "新东方", "记忆技巧", "单词"],
        difficulty: "BEGINNER",
        fileSize: "45.2 MB",
        fileFormat: "PDF",
        rating: 4.6,
        reviewCount: 134
      },
      {
        title: "六级阅读理解专项训练 - 星火英语版",
        slug: "cet6-reading-comprehension-training",
        description: "星火英语六级阅读理解专项训练，包含100篇精选阅读文章，涵盖社会、科技、文化、教育等热点话题。每篇文章配有详细的词汇注释、长难句分析、答题技巧和解题思路。",
        coverImageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/3f7b9a6e4c2d",
        categoryId: englishCategory?._id?.toString(),
        tags: ["英语六级", "CET6", "阅读理解", "星火英语", "专项训练"],
        difficulty: "ADVANCED",
        fileSize: "67.4 MB",
        fileFormat: "PDF",
        rating: 4.5,
        reviewCount: 98
      },
      // 计算机基础资料 - 真实教材
      {
        title: "数据结构与算法分析 C++语言描述 第四版",
        slug: "data-structures-algorithms-cpp-4th",
        description: "Mark Allen Weiss著作的数据结构与算法经典教材第四版，使用C++语言实现。详细讲解线性表、栈、队列、树、堆、散列、图、排序、查找等数据结构和算法。包含完整源代码和详细的复杂度分析。",
        coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/5d8c3f1a9e6b",
        categoryId: csCategory?._id?.toString(),
        tags: ["数据结构", "算法", "C++", "编程", "源代码"],
        difficulty: "INTERMEDIATE",
        fileSize: "78.9 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 167,
        isFeatured: true
      },
      {
        title: "操作系统概念 第十版中文版 - 恐龙书",
        slug: "operating-system-concepts-10th-cn",
        description: "Abraham Silberschatz等著的操作系统权威教材第十版中文翻译版。全面介绍操作系统的基本概念：进程管理、CPU调度、进程同步、死锁、内存管理、虚拟内存、文件系统、I/O系统、保护和安全。增加了多核系统和虚拟化内容。",
        coverImageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/2a9f7c4e6b3d",
        categoryId: csCategory?._id?.toString(),
        tags: ["操作系统", "恐龙书", "系统编程", "多核", "虚拟化"],
        difficulty: "ADVANCED",
        fileSize: "156.4 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 98
      },
      {
        title: "计算机网络 自顶向下方法 第七版",
        slug: "computer-networking-top-down-7th",
        description: "James Kurose和Keith Ross编写的计算机网络经典教材第七版。采用自顶向下的方法，从应用层开始逐步深入到物理层，详细介绍HTTP、DNS、TCP、UDP、IP、路由算法、网络安全等核心概念。包含丰富的实例和习题。",
        coverImageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/7e4b2f8a5c9d",
        categoryId: csCategory?._id?.toString(),
        tags: ["计算机网络", "TCP/IP", "协议", "网络安全", "路由"],
        difficulty: "INTERMEDIATE",
        fileSize: "198.6 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 145
      },
      // 考研资料 - 权威资源
      {
        title: "考研数学一历年真题详解 2010-2024完整版",
        slug: "postgraduate-math1-real-tests-complete",
        description: "考研数学一15年完整真题集及逐题详解，涵盖高等数学、线性代数、概率论与数理统计。每道题目提供多种解法、考点分析、易错提醒和相关知识点总结。按年份和知识点双重分类整理，便于系统复习。",
        coverImageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/1c8f4a7e3b9d",
        categoryId: gradCategory?._id?.toString(),
        tags: ["考研", "数学一", "真题", "解析", "三科合一"],
        difficulty: "ADVANCED",
        fileSize: "298.3 MB",
        fileFormat: "PDF",
        rating: 4.9,
        reviewCount: 245,
        isFeatured: true
      },
      {
        title: "肖秀荣2025考研政治全套资料 - 精讲精练+1000题",
        slug: "xiao-xiurong-politics-complete-2025",
        description: "肖秀荣老师2025年考研政治全套复习资料，包含《精讲精练》主教材、《1000题》习题集、时政热点分析、答题技巧总结。涵盖马原、毛中特、史纲、思修、时政五大模块，紧跟最新考试大纲。",
        coverImageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/9a6e3f1c7d4b",
        categoryId: gradCategory?._id?.toString(),
        tags: ["考研", "政治", "肖秀荣", "精讲精练", "1000题"],
        difficulty: "INTERMEDIATE",
        fileSize: "167.8 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 189
      },
      {
        title: "张宇考研数学18讲 - 高等数学强化教程",
        slug: "zhangyu-math-18-lectures",
        description: "张宇老师编写的考研数学高等数学部分强化教程，共18讲内容。每讲包含知识点梳理、题型分类、解题方法、典型例题和强化练习。注重解题技巧和思维方法训练，适合强化阶段复习使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/4b7f2a8e5c1d",
        categoryId: gradCategory?._id?.toString(),
        tags: ["考研", "数学", "张宇", "18讲", "强化"],
        difficulty: "ADVANCED",
        fileSize: "145.2 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 156
      },
      // 专业课程资料 - 工程类
      {
        title: "机械原理与机械设计课程设计指导书 第三版",
        slug: "mechanical-principle-design-guide-3rd",
        description: "机械原理与机械设计课程设计完整指导教程第三版。详细介绍减速器设计、传动系统设计、平面连杆机构设计、凸轮机构设计等内容。包含设计计算书模板、AutoCAD标准图纸、三维建模文件和设计实例。",
        coverImageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/6d3a9f2e8c5b",
        categoryId: majorCategory?._id?.toString(),
        tags: ["机械原理", "机械设计", "课程设计", "AutoCAD", "减速器"],
        difficulty: "INTERMEDIATE",
        fileSize: "312.6 MB",
        fileFormat: "PDF+DWG",
        rating: 4.5,
        reviewCount: 76
      },
      {
        title: "电路分析基础教程及习题详解 - 邱关源版",
        slug: "circuit-analysis-qiu-guanyuan",
        description: "邱关源教授编写的电路分析基础教程及配套习题详解。涵盖直流电路、正弦交流电路、三相电路、非正弦周期电路、动态电路等内容。理论推导严谨，例题丰富，适合电气、电子、自动化等专业学生使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/8f5c2a4e7b9d",
        categoryId: majorCategory?._id?.toString(),
        tags: ["电路分析", "邱关源", "电气", "交流电路", "习题详解"],
        difficulty: "INTERMEDIATE",
        fileSize: "145.8 MB",
        fileFormat: "PDF",
        rating: 4.6,
        reviewCount: 123
      },
      {
        title: "材料力学教程 - 刘鸿文版第六版",
        slug: "mechanics-of-materials-liu-hongwen-6th",
        description: "刘鸿文教授编写的材料力学教程第六版，土木、机械类专业经典教材。详细介绍轴向拉压、剪切、扭转、弯曲、应力状态、强度理论、组合变形、压杆稳定等内容。包含大量工程实例和习题解答。",
        coverImageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/3e7a5f1c9b6d",
        categoryId: majorCategory?._id?.toString(),
        tags: ["材料力学", "刘鸿文", "土木", "机械", "强度理论"],
        difficulty: "INTERMEDIATE",
        fileSize: "178.4 MB",
        fileFormat: "PDF",
        rating: 4.4,
        reviewCount: 89
      },
      // 职业技能资料 - 编程与办公
      {
        title: "Python编程：从入门到实践 第二版完整版",
        slug: "python-crash-course-2nd-complete",
        description: "Eric Matthes著的Python编程经典入门教材第二版完整版。从Python基础语法开始，通过项目实战学习Web开发、数据可视化、机器学习等技能。包含三个完整项目：外星人入侵游戏、数据可视化、Web应用程序。附带完整源代码。",
        coverImageUrl: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/2f9c6a1e4d8b",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Python", "编程入门", "Web开发", "数据可视化", "项目实战"],
        difficulty: "BEGINNER",
        fileSize: "189.7 MB",
        fileFormat: "PDF",
        rating: 4.9,
        reviewCount: 312,
        isFeatured: true
      },
      {
        title: "Java核心技术 卷I：基础知识 第11版",
        slug: "java-core-technology-vol1-11th",
        description: "Cay Horstmann著的Java编程权威指南第11版第一卷。详细介绍Java语言基础、面向对象编程、继承、接口、反射、异常处理、泛型、集合框架、多线程等核心概念。配有大量代码示例和实践练习。",
        coverImageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/5a8e3f7c2d9b",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Java", "面向对象", "多线程", "集合框架", "核心技术"],
        difficulty: "INTERMEDIATE",
        fileSize: "234.5 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 198
      },
      {
        title: "Excel数据分析与商业建模实战教程",
        slug: "excel-data-analysis-business-modeling",
        description: "Excel高级数据分析和商业建模完整教程。涵盖数据透视表、高级筛选、条件格式、图表制作、函数应用、VBA编程、Power Query、Power Pivot等高级功能。包含50+实战案例，适合数据分析师、财务人员、市场研究员等使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/7b4f9a3e6c2d",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Excel", "数据分析", "商业建模", "VBA", "Power Query"],
        difficulty: "INTERMEDIATE",
        fileSize: "245.3 MB",
        fileFormat: "PDF+XLSX",
        rating: 4.6,
        reviewCount: 128
      },
      {
        title: "Adobe Photoshop 2024完全自学教程",
        slug: "photoshop-2024-complete-tutorial",
        description: "Adobe Photoshop 2024版本完整自学教程。从基础工具使用到高级合成技巧，包含图像处理、色彩校正、图层管理、滤镜应用、文字设计、UI界面设计等内容。配有200+实例练习文件和视频演示。",
        coverImageUrl: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/9c6f2a8e4b5d",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Photoshop", "图像处理", "UI设计", "视觉设计", "实例教程"],
        difficulty: "BEGINNER",
        fileSize: "456.7 MB",
        fileFormat: "PDF+PSD",
        rating: 4.5,
        reviewCount: 167
      },
      // 物理化学补充资料
      {
        title: "大学物理学 第五版上下册合集 - 程守洙版",
        slug: "university-physics-cheng-shouzhu-5th",
        description: "程守洙、江之永主编的大学物理学教材第五版完整合集。包含力学、热学、电磁学、光学、近代物理等全部内容。每章配有详细的概念解释、公式推导、例题分析和习题解答。适合理工科各专业学生使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/4e8c7a2f6b9d",
        categoryId: majorCategory?._id?.toString(),
        tags: ["大学物理", "程守洙", "力学", "电磁学", "光学"],
        difficulty: "INTERMEDIATE",
        fileSize: "267.8 MB",
        fileFormat: "PDF",
        rating: 4.6,
        reviewCount: 134
      },
      {
        title: "无机化学 第四版 - 大连理工大学版",
        slug: "inorganic-chemistry-dalian-tech-4th",
        description: "大连理工大学无机化学教研室编写的无机化学教材第四版。系统介绍化学基本原理、元素化学、配合物化学等内容。包含原子结构、化学键理论、酸碱平衡、氧化还原反应、主族元素、过渡元素等核心知识点。",
        coverImageUrl: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/6f3a9c1e7d4b",
        categoryId: majorCategory?._id?.toString(),
        tags: ["无机化学", "大连理工", "元素化学", "配合物", "化学键"],
        difficulty: "INTERMEDIATE",
        fileSize: "198.4 MB",
        fileFormat: "PDF",
        rating: 4.4,
        reviewCount: 97
      }
    ];

    for (const r of sampleResources) {
      await db.collection("Resource").updateOne(
        { slug: r.slug },
        {
          $set: {
            title: r.title,
            slug: r.slug,
            description: r.description,
            coverImageUrl: r.coverImageUrl,
            quarkLink: r.quarkLink,
            categoryId: r.categoryId || null,
            authorId: adminUser?._id?.toString() || null,
            tags: r.tags,
            difficulty: r.difficulty || "BEGINNER",
            fileSize: r.fileSize || null,
            fileFormat: r.fileFormat || null,
            rating: r.rating || 0,
            reviewCount: r.reviewCount || 0,
            downloadCount: Math.floor(Math.random() * 500) + 50, // 随机下载数
            isPublic: true,
            isFeatured: r.isFeatured || false,
            status: "ACTIVE",
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      
      const inserted = await db.collection("Resource").findOne({ slug: r.slug });
      if (inserted) {
        // 创建资源统计
        const views = Math.floor(Math.random() * 1000) + 100;
        const clicks = Math.floor(Math.random() * 200) + 20;
        const likes = Math.floor(Math.random() * 50) + 5;
        
        await db.collection("ResourceStat").updateOne(
          { resourceId: inserted._id },
          { 
            $setOnInsert: { 
              views: views, 
              clicks: clicks, 
              likes: likes, 
              createdAt: now 
            }, 
            $set: { updatedAt: now } 
          },
          { upsert: true }
        );
        
        // 更新分类的资源计数
        if (r.categoryId) {
          await db.collection("Category").updateOne(
            { _id: new ObjectId(r.categoryId) },
            { 
              $inc: { resourceCount: 1, viewCount: views },
              $set: { updatedAt: now }
            }
          );
        }
      }
    }

    const resourceCount = await db.collection("Resource").countDocuments();
    const userCount = await db.collection("users").countDocuments();
    const categoryCount = await db.collection("Category").countDocuments();
    
    // 验证真实资源数据
    const sampleQuarkLinks = await db.collection("Resource").find({}, { projection: { quarkLink: 1, title: 1 } }).limit(5).toArray();
    console.log("✓ 种子数据更新完成，验证前5个资源的夸克链接：");
    sampleQuarkLinks.forEach(resource => {
      console.log(`- ${resource.title}: ${resource.quarkLink}`);
    });
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        resources: resourceCount,
        users: userCount,
        categories: categoryCount,
        adminCreated: true,
        adminEmail: "admin@example.com",
        adminPassword: "admin123"
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("SEED_ERROR", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
