"use client";

import { useState, useEffect } from 'react';
import { Star, BarChart3 } from 'lucide-react';

interface ResourceRatingProps {
  resourceId: string;
  session: any;
  initialRating?: number;
  initialReviewCount?: number;
}

interface RatingData {
  userRating: number | null;
  avgRating: number;
  reviewCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ResourceRating({ 
  resourceId, 
  session, 
  initialRating = 0,
  initialReviewCount = 0
}: ResourceRatingProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    userRating: null,
    avgRating: initialRating,
    reviewCount: initialReviewCount,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 加载评分数据
  useEffect(() => {
    const fetchRatingData = async () => {
      if (!session) return;
      
      try {
        const response = await fetch(`/api/resources/rating?resourceId=${resourceId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          setRatingData(data);
        }
      } catch (error) {
        console.error('获取评分数据失败:', error);
      }
    };

    fetchRatingData();
  }, [session, resourceId]);

  // 处理评分点击
  const handleRating = async (rating: number) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=/resources/${resourceId}`;
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      // 获取会话ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user-session-id', sessionId);
      }

      const response = await fetch('/api/resources/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          resourceId,
          rating
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRatingData(prev => ({
          ...prev,
          userRating: rating,
          avgRating: data.avgRating,
          reviewCount: data.reviewCount
        }));
      } else {
        const errorData = await response.json();
        alert(errorData.error || '评分失败');
      }
    } catch (error) {
      console.error('评分失败:', error);
      alert('评分失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染星星
  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          return (
            <button
              key={star}
              className={`${sizeClasses[size]} transition-colors ${
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={interactive ? () => handleRating(star) : undefined}
              onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
              onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
              disabled={isLoading}
            >
              <Star 
                className={`${sizeClasses[size]} ${
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  // 渲染评分分布
  const renderRatingDistribution = () => {
    const total = ratingData.reviewCount;
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingData.ratingDistribution[star as keyof typeof ratingData.ratingDistribution];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-2">{star}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-xs text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 用户评分区域 */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">为这个资源评分</h4>
          
          {session ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {renderStars(hoveredRating || ratingData.userRating || 0, true, 'lg')}
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                )}
              </div>
              {ratingData.userRating && (
                <p className="text-sm text-green-600">
                  ✓ 您已评分: {ratingData.userRating} 星
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {renderStars(0, false, 'lg')}
              </div>
              <button
                onClick={() => window.location.href = `/login?callbackUrl=/resources/${resourceId}`}
                className="text-sm text-blue-600 hover:text-blue-500 underline"
              >
                登录后评分
              </button>
            </div>
          )}
        </div>

        {/* 整体评分显示 */}
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2">
            {renderStars(ratingData.avgRating, false, 'sm')}
            <span className="text-sm font-medium">
              {ratingData.avgRating > 0 ? ratingData.avgRating.toFixed(1) : '暂无评分'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {ratingData.reviewCount} 人评分
          </p>
          
          {ratingData.reviewCount > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500"
            >
              <BarChart3 className="w-3 h-3" />
              {showDetails ? '收起' : '详情'}
            </button>
          )}
        </div>
      </div>

      {/* 评分详细分布 */}
      {showDetails && ratingData.reviewCount > 0 && (
        <div className="p-4 bg-white border rounded-lg">
          <h5 className="font-medium text-gray-900 mb-3">评分分布</h5>
          {renderRatingDistribution()}
        </div>
      )}
    </div>
  );
}