"use client";

import NeoBrutalCard from "@/components/NeoBrutalCard";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    tags: string[];
    isPublic: boolean;
    category?: {
      name: string;
      slug: string;
    } | null;
    _count?: {
      clicks?: number;    // 下载次数
      views?: number;     // 浏览次数
      favorites?: number; // 收藏次数
    };
    updatedAt?: string;
    rating?: number;      // 资源评分
  };
  index?: number;
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
  // 计算综合热度 (浏览量 + 下载量*3 + 收藏数*5)
  const totalEngagement = (resource._count?.views || 0) + 
                         (resource._count?.clicks || 0) * 3 + 
                         (resource._count?.favorites || 0) * 5;

  // 决定卡片变体
  const getCardVariant = () => {
    if (totalEngagement > 100) return 'premium';
    if (totalEngagement > 30) return 'featured';
    return 'default';
  };
  
  // 格式化更新时间
  const formatDate = (dateString?: string) => {
    if (!dateString) return '最近更新';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return '刚刚更新';
      if (diffInHours < 24) return `${diffInHours}小时前`;
      if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}天前`;
      if (diffInHours < 24 * 30) return `${Math.floor(diffInHours / (24 * 7))}周前`;
      return date.toLocaleDateString('zh-CN');
    } catch {
      return '最近更新';
    }
  };
  
  return (
    <NeoBrutalCard
      title={resource.title}
      description={resource.description || '暂无描述'}
      category={resource.category?.name}
      href={`/resources/${resource.id}`}
      variant={getCardVariant()}
      enable3D={true}
      glowEffect={true}
      particleEffect={getCardVariant() === 'premium'}
      metadata={{
        views: resource._count?.views || 0,                    // 真实浏览量
        likes: resource._count?.favorites || 0,                // 收藏数作为点赞数
        downloadCount: resource._count?.clicks || 0,           // 真实下载量
        rating: resource.rating || 0,                          // 真实评分
        updatedAt: formatDate(resource.updatedAt),
        tags: resource.tags.slice(0, 3),
        isHot: totalEngagement > 30,                           // 基于真实综合热度判断
        isNew: resource.updatedAt && 
               new Date(resource.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)  // 7天内更新判断NEW
      }}
      className="h-full"
    />
  );
}
