import { prisma } from '@/lib/prisma';
import { withCache, createCacheKey, memoryCache } from '@/lib/mongodb';

/**
 * 系统设置服务 - 统一管理所有系统设置
 * 优先使用Prisma处理数据，确保类型安全和一致性
 */

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableAnalytics: boolean;
  enableCache: boolean;
  cacheExpiry: number;
}

// 默认系统设置
const DEFAULT_SETTINGS: SystemSettings = {
  siteName: '大学生自救指南',
  siteDescription: '高质量学习资料分享与检索平台',
  allowRegistration: true,
  maintenanceMode: false,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar'],
  enableAnalytics: true,
  enableCache: true,
  cacheExpiry: 300000 // 5分钟
};

/**
 * 获取系统设置 - 带缓存和错误处理
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const cacheKey = 'system_settings';
  
  try {
    return await withCache(
      cacheKey,
      async () => {
        // 尝试从数据库获取设置
        const settings = await prisma.setting.findMany({
          where: {
            category: 'SYSTEM'
          },
          select: {
            key: true,
            value: true
          }
        });

        // 如果数据库中没有设置，使用默认值（暂不初始化，避免事务问题）
        if (settings.length === 0) {
          console.info('未找到系统设置，使用默认配置');
          return DEFAULT_SETTINGS;
        }

        // 构建设置对象，合并默认值
        const settingsMap = new Map(settings.map(s => [s.key, s.value]));
        
        return {
          siteName: settingsMap.get('siteName') as string || DEFAULT_SETTINGS.siteName,
          siteDescription: settingsMap.get('siteDescription') as string || DEFAULT_SETTINGS.siteDescription,
          allowRegistration: settingsMap.get('allowRegistration') as boolean ?? DEFAULT_SETTINGS.allowRegistration,
          maintenanceMode: settingsMap.get('maintenanceMode') as boolean ?? DEFAULT_SETTINGS.maintenanceMode,
          maxFileSize: settingsMap.get('maxFileSize') as number || DEFAULT_SETTINGS.maxFileSize,
          allowedFileTypes: settingsMap.get('allowedFileTypes') as string[] || DEFAULT_SETTINGS.allowedFileTypes,
          enableAnalytics: settingsMap.get('enableAnalytics') as boolean ?? DEFAULT_SETTINGS.enableAnalytics,
          enableCache: settingsMap.get('enableCache') as boolean ?? DEFAULT_SETTINGS.enableCache,
          cacheExpiry: settingsMap.get('cacheExpiry') as number || DEFAULT_SETTINGS.cacheExpiry,
        };
      },
      DEFAULT_SETTINGS.cacheExpiry
    );
  } catch (error) {
    console.error('获取系统设置失败，使用默认配置:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 获取基础设置（用于layout等关键组件）
 * 增强的错误处理和自动初始化
 */
export async function getBasicSettings(): Promise<Pick<SystemSettings, 'siteName' | 'siteDescription'>> {
  try {
    // 首次尝试获取设置
    const settings = await getSystemSettings();
    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription
    };
  } catch (error) {
    console.error('获取基础设置失败，尝试初始化默认设置:', error);
    
    // 暂时直接使用默认值，避免复杂的数据库初始化
    return {
      siteName: DEFAULT_SETTINGS.siteName,
      siteDescription: DEFAULT_SETTINGS.siteDescription
    };
  }
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<void> {
  try {
    // 清除缓存
    memoryCache.del('system_settings');
    
    // 更新数据库中的设置
    for (const [key, value] of Object.entries(updates)) {
      try {
        const existing = await prisma.setting.findUnique({ where: { key } });
        if (existing) {
          await prisma.setting.update({
            where: { key },
            data: { 
              value: value as any,
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.setting.create({
            data: {
              key,
              value: value as any,
              category: 'SYSTEM',
              description: getSettingDescription(key),
              isPublic: isPublicSetting(key)
            }
          });
        }
      } catch (error) {
        console.error(`更新设置 ${key} 失败:`, error);
        throw error;
      }
    }
    
    console.info('系统设置更新成功:', Object.keys(updates));
  } catch (error) {
    console.error('更新系统设置失败:', error);
    throw error;
  }
}

/**
 * 初始化默认设置
 */
export async function initializeDefaultSettings(): Promise<void> {
  try {
    const settingsToCreate = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value: value as any,
      category: 'SYSTEM',
      description: getSettingDescription(key),
      isPublic: isPublicSetting(key)
    }));

    // 确保不重复创建
    for (const setting of settingsToCreate) {
      try {
        const existing = await prisma.setting.findUnique({ where: { key: setting.key } });
        if (!existing) {
          await prisma.setting.create({ data: setting });
        }
      } catch (error) {
        if (error.code !== 'P2002') { // 忽略唯一约束违反错误
          console.error(`创建设置 ${setting.key} 失败:`, error);
        }
      }
    }

    console.info('默认系统设置初始化完成');
  } catch (error) {
    console.error('初始化默认设置失败:', error);
    // 不抛出错误，使用内存中的默认值
  }
}

/**
 * 获取设置描述
 */
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    siteName: '网站名称',
    siteDescription: '网站描述',
    allowRegistration: '是否允许用户注册',
    maintenanceMode: '维护模式',
    maxFileSize: '最大文件大小（字节）',
    allowedFileTypes: '允许的文件类型',
    enableAnalytics: '启用分析统计',
    enableCache: '启用缓存',
    cacheExpiry: '缓存过期时间（毫秒）'
  };
  return descriptions[key] || '';
}

/**
 * 判断设置是否为公开设置
 */
function isPublicSetting(key: string): boolean {
  const publicSettings = ['siteName', 'siteDescription', 'allowRegistration'];
  return publicSettings.includes(key);
}

/**
 * 验证维护模式
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await getSystemSettings();
    return settings.maintenanceMode;
  } catch (error) {
    console.error('检查维护模式失败:', error);
    return false;
  }
}

/**
 * 获取公开设置（用于客户端）
 */
export async function getPublicSettings(): Promise<Partial<SystemSettings>> {
  try {
    const settings = await getSystemSettings();
    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      allowRegistration: settings.allowRegistration,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes
    };
  } catch (error) {
    console.error('获取公开设置失败:', error);
    return {
      siteName: DEFAULT_SETTINGS.siteName,
      siteDescription: DEFAULT_SETTINGS.siteDescription,
      allowRegistration: DEFAULT_SETTINGS.allowRegistration,
      maxFileSize: DEFAULT_SETTINGS.maxFileSize,
      allowedFileTypes: DEFAULT_SETTINGS.allowedFileTypes
    };
  }
}