"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Eye, Download, Tag, Calendar, TrendingUp, Heart, Zap } from "lucide-react";

interface ResourceCardOptimizedProps {
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
  };
  index?: number;
}

const ResourceCardOptimized = memo(function ResourceCardOptimized({ 
  resource, 
  index = 0 
}: ResourceCardOptimizedProps) {
  // 性能优化：使用 useMemo 缓存计算结果
  const cardData = useMemo(() => {
    const clicks = resource._count?.clicks || 0;      // 下载次数
    const views = resource._count?.views || 0;        // 浏览次数
    const favorites = resource._count?.favorites || 0; // 收藏次数
    const totalEngagement = views + clicks * 3 + favorites * 5; // 综合热度：浏览+下载*3+收藏*5
    
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
    
    // 计算是否为NEW标签（过去7天内更新）
    const isNew = resource.updatedAt && 
                  new Date(resource.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      variant: getCardVariant(),
      formattedDate: formatDate(resource.updatedAt),
      clicks,
      views,
      favorites,
      totalEngagement,
      truncatedDescription: resource.description 
        ? resource.description.length > 80 
          ? resource.description.substring(0, 80) + '...' 
          : resource.description
        : '这个资源没有描述信息',
      isHot: totalEngagement > 30,
      isNew
    };
  }, [resource._count?.clicks, resource._count?.views, resource._count?.favorites, resource.updatedAt, resource.description]);

  // 性能优化：样式类名缓存
  const cardStyles = useMemo(() => {
    const baseClasses = "group relative block p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl";
    
    switch (cardData.variant) {
      case 'premium':
        return `${baseClasses} bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-400/20 hover:border-purple-400/40`;
      case 'featured':
        return `${baseClasses} bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-blue-400/20 hover:border-blue-400/40`;
      default:
        return `${baseClasses} bg-white/5 border-white/10 hover:border-white/20`;
    }
  }, [cardData.variant]);

  return (
    <Link 
      href={`/resources/${resource.id}`}
      className={cardStyles}
      prefetch={false} // 性能优化：禁用预获取
    >
      {/* NEW和热门标识 */}
      <div className="absolute -top-2 -right-2 z-10 flex flex-col gap-1">
        {cardData.isNew && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs text-white font-semibold shadow-lg">
            <Zap className="w-3 h-3" />
            <span>NEW</span>
          </div>
        )}
        {cardData.isHot && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-xs text-white font-semibold shadow-lg">
            <TrendingUp className="w-3 h-3" />
            <span>热门</span>
          </div>
        )}
      </div>

      {/* 卡片内容 */}
      <div className="space-y-4">
        {/* 标题 */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white group-hover:brand-text-gradient transition-all line-clamp-2">
            {resource.title}
          </h3>
          
          {/* 描述 */}
          <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
            {cardData.truncatedDescription}
          </p>
        </div>

        {/* 标签 */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resource.tags.slice(0, 3).map((tag, tagIndex) => (
              <span 
                key={tagIndex}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300 backdrop-blur-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {/* 浏览量 */}
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{cardData.views}</span>
            </div>
            
            {/* 下载量 */}
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{cardData.clicks}</span>
            </div>
            
            {/* 收藏数 */}
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{cardData.favorites}</span>
            </div>
            
            {/* 更新时间 */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{cardData.formattedDate}</span>
            </div>
          </div>

          {/* 分类标签 */}
          {resource.category && (
            <div className="px-2 py-1 bg-brand-gradient rounded-full text-xs text-white font-medium">
              {resource.category.name}
            </div>
          )}
        </div>

        {/* 悬浮指示器 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </div>
    </Link>
  );
});

export default ResourceCardOptimized;