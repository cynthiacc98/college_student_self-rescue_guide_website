"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Download, MessageCircle, ExternalLink, Star } from 'lucide-react';

interface ResourceActionsProps {
  resource: {
    id: string;
    title: string;
    quarkLink?: string | null;
    downloadCount: number;
    rating?: number | null;
    reviewCount: number;
    favoriteCount: number;
  };
  session: any;
  resourceId: string;
}

export default function ResourceActions({ resource, session, resourceId }: ResourceActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [localStats, setLocalStats] = useState({
    downloads: resource.downloadCount || 0,
    favorites: resource.favoriteCount || 0,
    reviews: resource.reviewCount || 0,
  });

  // 获取用户收藏状态
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!session) return;
      
      try {
        const response = await fetch(`/api/resources/favorite?resourceId=${resourceId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.favorited);
        }
      } catch (error) {
        console.error('获取收藏状态失败:', error);
      }
    };

    checkFavoriteStatus();
  }, [session, resourceId]);

  // 处理下载点击
  const handleDownload = async () => {
    if (!session) {
      // 未登录用户仍然可以点击，但会记录下载
      window.location.href = `/login?callbackUrl=/resources/${resourceId}`;
      return;
    }

    setIsDownloading(true);
    
    try {
      // 生成会话ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user-session-id', sessionId);
      }

      // 记录下载行为
      await fetch('/api/track/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          userId: session.user?.id || null,
          sessionId,
        }),
      });

      // 更新本地统计
      setLocalStats(prev => ({
        ...prev,
        downloads: prev.downloads + 1
      }));

      // 如果有下载链接，打开链接
      if (resource.quarkLink) {
        window.open(resource.quarkLink, '_blank');
      }
    } catch (error) {
      console.error('下载记录失败:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 处理收藏点击
  const handleFavorite = async () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=/resources/${resourceId}`;
      return;
    }

    if (isLoadingFavorite) return;

    setIsLoadingFavorite(true);
    
    try {
      // 获取会话ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user-session-id', sessionId);
      }

      const response = await fetch('/api/resources/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          resourceId,
          action: isFavorited ? 'remove' : 'add'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.favorited);
        setLocalStats(prev => ({
          ...prev,
          favorites: data.favorited ? prev.favorites + 1 : prev.favorites - 1
        }));
      } else {
        const errorData = await response.json();
        console.error('收藏操作失败:', errorData.error);
        alert(errorData.error || '收藏操作失败');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      alert('收藏操作失败，请稍后重试');
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* 主要操作按钮 */}
      <div className="flex flex-wrap gap-3">
        {/* 下载按钮 */}
        {resource.quarkLink && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                记录中...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                打开夸克网盘链接
              </>
            )}
          </button>
        )}

        {/* 收藏按钮 */}
        <button
          onClick={handleFavorite}
          disabled={isLoadingFavorite}
          className={`inline-flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isFavorited 
              ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100' 
              : 'border-gray-300 bg-white text-gray-600 hover:border-red-500 hover:text-red-600'
          }`}
        >
          {isLoadingFavorite ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              处理中...
            </>
          ) : (
            <>
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? '已收藏' : '收藏'}
            </>
          )}
        </button>

      </div>

      {/* 未登录提示 */}
      {!session && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            🔐 登录后可享受更多功能：收藏资源、留言评论、个性化推荐
          </p>
          <Link
            href={`/login?callbackUrl=/resources/${resourceId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            立即登录 →
          </Link>
        </div>
      )}

      {/* 实时统计信息 */}
      <div className="flex gap-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          <span>{localStats.downloads} 次下载</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span>{localStats.favorites} 人收藏</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{localStats.reviews} 条评论</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          <span>{resource.rating ? `${resource.rating.toFixed(1)} 分` : '暂无评分'}</span>
        </div>
      </div>
    </div>
  );
}