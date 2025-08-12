"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, Reply, Trash2, Star, Send, ChevronLeft, ChevronRight } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  rating?: number | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  replies: Comment[];
}

interface CommentsData {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ResourceCommentsProps {
  resourceId: string;
  session: any;
}

export default function ResourceComments({ resourceId, session }: ResourceCommentsProps) {
  const [commentsData, setCommentsData] = useState<CommentsData>({
    comments: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 加载评论
  const loadComments = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/resources/comments?resourceId=${resourceId}&page=${page}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCommentsData(data);
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [resourceId]);

  // 提交新评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      window.location.href = `/login?callbackUrl=/resources/${resourceId}`;
      return;
    }

    if (!newComment.trim()) {
      alert('请输入评论内容');
      return;
    }

    if (newComment.trim().length < 5) {
      alert('评论内容至少5个字符');
      return;
    }

    setIsSubmitting(true);

    try {
      // 获取会话ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user-session-id', sessionId);
      }

      const response = await fetch('/api/resources/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          resourceId,
          content: newComment.trim(),
          rating: newCommentRating > 0 ? newCommentRating : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNewComment('');
          setNewCommentRating(0);
          // 重新加载评论
          loadComments(1);
        } else {
          alert(data.error || '评论失败');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '评论失败');
      }
    } catch (error) {
      console.error('评论失败:', error);
      alert('评论失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=/resources/${resourceId}`;
      return;
    }

    if (!replyContent.trim()) {
      alert('请输入回复内容');
      return;
    }

    if (replyContent.trim().length < 5) {
      alert('回复内容至少5个字符');
      return;
    }

    setIsSubmitting(true);

    try {
      // 获取会话ID
      let sessionId = localStorage.getItem('user-session-id');
      if (!sessionId) {
        sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('user-session-id', sessionId);
      }

      const response = await fetch('/api/resources/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          resourceId,
          content: replyContent.trim(),
          parentId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReplyContent('');
          setReplyingTo(null);
          // 重新加载评论
          loadComments(currentPage);
        } else {
          alert(data.error || '回复失败');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '回复失败');
      }
    } catch (error) {
      console.error('回复失败:', error);
      alert('回复失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/resources/comments?commentId=${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 重新加载评论
          loadComments(currentPage);
        } else {
          alert(data.error || '删除失败');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  // 渲染星星
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`w-3 h-3 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-white">
          评论 ({commentsData.pagination.total})
        </h3>
      </div>

      {/* 发表评论 */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-white mb-4">发表评论</h4>
        
        {session ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            {/* 评分选择 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">给资源评分（可选）</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewCommentRating(star)}
                    className="transition-colors"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        star <= newCommentRating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-400 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                {newCommentRating > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewCommentRating(0)}
                    className="text-xs text-gray-400 hover:text-gray-300 ml-2"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {/* 评论内容 */}
            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的想法..."
                className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="text-xs text-gray-400 text-right">
                {newComment.length}/1000
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  发表中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  发表评论
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-300 mb-4">登录后可以发表评论</p>
            <button
              onClick={() => window.location.href = `/login?callbackUrl=/resources/${resourceId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              立即登录
            </button>
          </div>
        )}
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-400 mt-2">加载中...</p>
          </div>
        ) : commentsData.comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">还没有评论，来发表第一个吧！</p>
          </div>
        ) : (
          commentsData.comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              {/* 评论头部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{comment.user.name}</span>
                      {comment.rating && renderStars(comment.rating)}
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  {session && session.user.id === comment.user.email && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 评论内容 */}
              <p className="text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* 回复表单 */}
              {replyingTo === comment.id && (
                <div className="mt-4 space-y-3 bg-white/5 rounded-lg p-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="写下你的回复..."
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {replyContent.length}/1000
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        回复
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 回复列表 */}
              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-white/5 rounded-lg p-3 ml-4 border-l-2 border-blue-600">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {reply.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-white text-sm">{reply.user.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{formatTime(reply.createdAt)}</span>
                          </div>
                        </div>

                        {session && session.user.id === reply.user.email && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {commentsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            第 {commentsData.pagination.page} 页，共 {commentsData.pagination.totalPages} 页
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadComments(currentPage - 1)}
              disabled={!commentsData.pagination.hasPrev}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            
            <button
              onClick={() => loadComments(currentPage + 1)}
              disabled={!commentsData.pagination.hasNext}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}