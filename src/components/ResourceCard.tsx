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
      clicks?: number;
    };
    updatedAt?: string;
  };
  index?: number;
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
  // 决定卡片变体
  const getCardVariant = () => {
    if (resource._count?.clicks && resource._count.clicks > 100) return 'premium';
    if (resource._count?.clicks && resource._count.clicks > 50) return 'featured';
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
        views: resource._count?.clicks,
        likes: Math.floor(Math.random() * 50) + 10, // 模拟点赞数
        downloadCount: resource._count?.clicks,
        rating: 4 + Math.random(), // 4-5星随机评分
        updatedAt: formatDate(resource.updatedAt),
        tags: resource.tags.slice(0, 3),
        isHot: (resource._count?.clicks ?? 0) > 50,
        isNew: resource.updatedAt && 
               new Date(resource.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }}
      className="h-full"
    />
  );
}
