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

    const sampleResources = [
      // 高等数学资料
      {
        title: "高等数学上册 - 同济大学第七版",
        slug: "advanced-mathematics-vol1-tongji-7th",
        description: "同济大学高等数学教材第七版上册，包含函数与极限、导数与微分、微分中值定理与导数的应用、不定积分、定积分等核心内容。PDF格式，高清扫描版本。",
        coverImageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/mathematics-vol1",
        categoryId: mathCategory?._id?.toString(),
        tags: ["高等数学", "同济大学", "教材", "PDF"],
        difficulty: "INTERMEDIATE",
        fileSize: "125.8 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 156,
        isFeatured: true
      },
      {
        title: "线性代数习题解答 - 清华大学版",
        slug: "linear-algebra-exercises-tsinghua",
        description: "清华大学线性代数课程配套习题详解，包含矩阵运算、线性方程组、向量空间、特征值与特征向量等章节的完整解答过程。适合理工科学生使用。",
        coverImageUrl: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/linear-algebra-exercises",
        categoryId: mathCategory?._id?.toString(),
        tags: ["线性代数", "习题解答", "清华大学", "理工科"],
        difficulty: "ADVANCED",
        fileSize: "89.3 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 89
      },
      // 英语四六级资料
      {
        title: "英语四级真题解析 2020-2024年",
        slug: "cet4-real-tests-2020-2024",
        description: "收录2020年至2024年英语四级考试真题及详细解析，包含听力原文、阅读理解答案解析、写作范文、翻译技巧等。附赠听力音频文件。",
        coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/cet4-real-tests",
        categoryId: englishCategory?._id?.toString(),
        tags: ["英语四级", "真题", "听力", "解析"],
        difficulty: "INTERMEDIATE",
        fileSize: "234.7 MB",
        fileFormat: "PDF+MP3",
        rating: 4.9,
        reviewCount: 203,
        isFeatured: true
      },
      {
        title: "新东方四级词汇 - 乱序版",
        slug: "new-oriental-cet4-vocabulary",
        description: "新东方英语四级核心词汇4500个，采用乱序编排，避免按字母顺序记忆的枯燥。每个单词配有音标、词性、中文释义、例句和记忆技巧。",
        coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/cet4-vocabulary",
        categoryId: englishCategory?._id?.toString(),
        tags: ["英语四级", "词汇", "新东方", "记忆技巧"],
        difficulty: "BEGINNER",
        fileSize: "45.2 MB",
        fileFormat: "PDF",
        rating: 4.6,
        reviewCount: 134
      },
      // 计算机基础资料
      {
        title: "数据结构与算法分析 - C++版",
        slug: "data-structures-algorithms-cpp",
        description: "经典的数据结构与算法教材，使用C++语言实现。涵盖线性表、栈、队列、树、图、排序、查找等核心内容，包含大量编程实例和练习题。",
        coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/data-structures-cpp",
        categoryId: csCategory?._id?.toString(),
        tags: ["数据结构", "算法", "C++", "编程"],
        difficulty: "INTERMEDIATE",
        fileSize: "78.9 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 167,
        isFeatured: true
      },
      {
        title: "操作系统概念 - 第九版中文版",
        slug: "operating-system-concepts-9th-cn",
        description: "操作系统领域的权威教材，详细介绍进程管理、内存管理、文件系统、I/O系统等核心概念。第九版增加了虚拟化和云计算相关内容。",
        coverImageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/operating-systems-9th",
        categoryId: csCategory?._id?.toString(),
        tags: ["操作系统", "进程管理", "内存管理", "系统原理"],
        difficulty: "ADVANCED",
        fileSize: "156.4 MB",
        fileFormat: "PDF",
        rating: 4.7,
        reviewCount: 98
      },
      // 考研资料
      {
        title: "考研数学一历年真题解析 2010-2024",
        slug: "postgraduate-math1-real-tests",
        description: "考研数学一15年真题及详细解析，包含高等数学、线性代数、概率论与数理统计三个科目。每题都有多种解法和易错点分析。",
        coverImageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/postgrad-math1-tests",
        categoryId: gradCategory?._id?.toString(),
        tags: ["考研", "数学一", "真题", "解析"],
        difficulty: "ADVANCED",
        fileSize: "198.3 MB",
        fileFormat: "PDF",
        rating: 4.9,
        reviewCount: 245,
        isFeatured: true
      },
      {
        title: "肖秀荣考研政治冲刺8套卷",
        slug: "xiao-xiurong-politics-8-sets",
        description: "肖秀荣老师编写的考研政治冲刺模拟试卷，8套完整试题包含选择题和分析题。附带详细答案解析和时政热点分析，是政治冲刺的必备资料。",
        coverImageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/xiao-politics-8sets",
        categoryId: gradCategory?._id?.toString(),
        tags: ["考研", "政治", "肖秀荣", "冲刺卷"],
        difficulty: "INTERMEDIATE",
        fileSize: "67.8 MB",
        fileFormat: "PDF",
        rating: 4.8,
        reviewCount: 189
      },
      // 专业课程资料
      {
        title: "机械原理课程设计指导书",
        slug: "mechanical-principle-course-design",
        description: "机械原理课程设计完整指导书，包含平面连杆机构、凸轮机构、齿轮传动等设计实例。配有AutoCAD绘图模板和计算程序。",
        coverImageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/mechanical-principle-design",
        categoryId: majorCategory?._id?.toString(),
        tags: ["机械原理", "课程设计", "AutoCAD", "工程设计"],
        difficulty: "INTERMEDIATE",
        fileSize: "112.6 MB",
        fileFormat: "PDF+DWG",
        rating: 4.5,
        reviewCount: 76
      },
      // 职业技能资料
      {
        title: "Python编程从入门到实践 - 第二版",
        slug: "python-crash-course-2nd-edition",
        description: "Python编程的经典入门教材，从基础语法到项目实战，包含Web应用、数据可视化、机器学习等实用项目。适合零基础学习者。",
        coverImageUrl: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/python-crash-course-2nd",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Python", "编程入门", "Web开发", "数据科学"],
        difficulty: "BEGINNER",
        fileSize: "89.7 MB",
        fileFormat: "PDF",
        rating: 4.9,
        reviewCount: 312,
        isFeatured: true
      },
      {
        title: "Excel数据分析与可视化教程",
        slug: "excel-data-analysis-visualization",
        description: "Excel高级数据分析功能详解，包含数据透视表、高级筛选、条件格式、图表制作、VBA编程等内容。适合职场办公和数据分析工作。",
        coverImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        quarkLink: "https://pan.quark.cn/s/excel-data-analysis",
        categoryId: skillsCategory?._id?.toString(),
        tags: ["Excel", "数据分析", "可视化", "办公技能"],
        difficulty: "INTERMEDIATE",
        fileSize: "145.3 MB",
        fileFormat: "PDF+XLSX",
        rating: 4.6,
        reviewCount: 128
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
