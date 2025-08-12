"use client";

import { useEffect } from 'react';

interface ResourceViewTrackerProps {
  resourceId: string;
}

export default function ResourceViewTracker({ resourceId }: ResourceViewTrackerProps) {
  useEffect(() => {
    // 生成会话ID（如果不存在）
    let sessionId = localStorage.getItem('user-session-id');
    if (!sessionId) {
      sessionId = 'anonymous-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user-session-id', sessionId);
    }

    // 记录浏览行为
    const trackView = async () => {
      try {
        const response = await fetch('/api/track/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId,
            sessionId,
          }),
        });

        if (!response.ok) {
          console.warn('浏览量统计失败');
        }
      } catch (error) {
        console.warn('浏览量统计失败:', error);
      }
    };

    trackView();
  }, [resourceId]);

  // 这个组件不渲染任何内容，只负责统计
  return null;
}