import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import path from "path";
import { promises as fs } from "fs";

// 上传配置
const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/avi',
    'audio/mpeg',
    'audio/wav'
  ],
  uploadDir: path.join(process.cwd(), 'public', 'uploads')
};

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_CONFIG.uploadDir);
  } catch {
    await fs.mkdir(UPLOAD_CONFIG.uploadDir, { recursive: true });
  }
}

// 生成唯一文件名
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  return `${timestamp}-${randomStr}-${baseName}${ext}`;
}

// 获取文件大小的人类可读格式
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 根据MIME类型获取文件格式
function getFileFormat(mimeType: string): string {
  const formatMap: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'video/mp4': 'MP4',
    'video/avi': 'AVI',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV'
  };
  return formatMap[mimeType] || 'UNKNOWN';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    // 确保上传目录存在
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resourceData = JSON.parse(formData.get('resourceData') as string || '{}');

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未选择文件" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `文件大小超过限制，最大允许 ${formatFileSize(UPLOAD_CONFIG.maxFileSize)}` 
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "不支持的文件类型",
          allowedTypes: UPLOAD_CONFIG.allowedTypes
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();

    // 生成唯一文件名
    const fileName = generateFileName(file.name);
    const filePath = path.join(UPLOAD_CONFIG.uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    // 保存文件
    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));

    // 生成slug（如果没有提供）
    let slug = resourceData.slug;
    if (!slug) {
      slug = resourceData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // 确保slug唯一性
      let counter = 1;
      let originalSlug = slug;
      while (await db.collection("Resource").findOne({ slug })) {
        slug = `${originalSlug}-${counter}`;
        counter++;
      }
    }

    // 创建资源记录
    const resourceDoc = {
      title: resourceData.title || file.name,
      slug: slug,
      description: resourceData.description || `上传的文件: ${file.name}`,
      coverImageUrl: resourceData.coverImageUrl || null,
      quarkLink: publicUrl, // 使用本地文件路径
      categoryId: resourceData.categoryId || null,
      authorId: session.user.id,
      tags: resourceData.tags || [getFileFormat(file.type)],
      difficulty: resourceData.difficulty || "BEGINNER",
      fileSize: formatFileSize(file.size),
      fileFormat: getFileFormat(file.type),
      downloadCount: 0,
      rating: 0,
      reviewCount: 0,
      favoriteCount: 0,
      isPublic: resourceData.isPublic !== false,
      isFeatured: false,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
      // 额外的文件信息
      uploadInfo: {
        originalName: file.name,
        fileName: fileName,
        filePath: publicUrl,
        mimeType: file.type,
        size: file.size,
        uploadedBy: session.user.id,
        uploadedAt: now
      }
    };

    // 插入资源记录
    const insertResult = await db.collection("Resource").insertOne(resourceDoc);
    const resourceId = insertResult.insertedId;

    // 创建资源统计记录
    await db.collection("ResourceStat").insertOne({
      resourceId: resourceId,
      views: 0,
      clicks: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now
    });

    // 更新分类的资源计数
    if (resourceData.categoryId) {
      await db.collection("Category").updateOne(
        { _id: new ObjectId(resourceData.categoryId) },
        { 
          $inc: { resourceCount: 1 },
          $set: { updatedAt: now }
        }
      );
    }

    // 记录上传日志
    await db.collection("AuditLog").insertOne({
      userId: session.user.id,
      action: "CREATE",
      resource: "resources",
      resourceId: resourceId.toString(),
      oldData: null,
      newData: {
        title: resourceDoc.title,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: "SUCCESS",
      createdAt: now
    });

    // 获取创建的资源完整信息（包括分类）
    const createdResource = await db.collection("Resource")
      .aggregate([
        { $match: { _id: resourceId } },
        {
          $lookup: {
            from: "Category",
            let: { categoryId: { $toObjectId: "$categoryId" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } },
              { $project: { name: 1, slug: 1, color: 1 } }
            ],
            as: "category"
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ["$category", 0] }
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      message: "文件上传成功",
      data: {
        id: resourceId.toString(),
        slug: slug,
        title: resourceDoc.title,
        fileName: fileName,
        fileSize: formatFileSize(file.size),
        fileFormat: getFileFormat(file.type),
        publicUrl: publicUrl,
        resource: createdResource[0]
      }
    }, { status: 201 });

  } catch (error) {
    console.error("UPLOAD_ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "文件上传失败",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// 获取上传进度（WebSocket或Server-Sent Events可以实现更好的实时进度）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // 获取用户最近的上传记录
    const recentUploads = await db.collection("Resource")
      .find({ 
        authorId: session.user.id,
        "uploadInfo.uploadedBy": session.user.id
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({
        title: 1,
        slug: 1,
        fileSize: 1,
        fileFormat: 1,
        status: 1,
        createdAt: 1,
        "uploadInfo.originalName": 1,
        "uploadInfo.fileName": 1,
        "uploadInfo.size": 1
      })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        recentUploads: recentUploads.map(upload => ({
          ...upload,
          id: upload._id.toString(),
          formattedSize: upload.uploadInfo?.size 
            ? formatFileSize(upload.uploadInfo.size)
            : upload.fileSize
        })),
        uploadConfig: {
          maxFileSize: UPLOAD_CONFIG.maxFileSize,
          maxFileSizeFormatted: formatFileSize(UPLOAD_CONFIG.maxFileSize),
          allowedTypes: UPLOAD_CONFIG.allowedTypes
        }
      }
    });

  } catch (error) {
    console.error("GET_UPLOAD_INFO_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "获取上传信息失败" },
      { status: 500 }
    );
  }
}