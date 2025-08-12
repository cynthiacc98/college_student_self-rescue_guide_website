"use client";

import { useState } from "react";
import { Heart, Calendar, Filter, Grid, List, Search } from "lucide-react";
import ResourceCard from "./ResourceCard";
import toast from "react-hot-toast";

interface FavoriteResource {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  category?: {
    name: string;
    slug: string;
  } | null;
  _count?: {
    clicks?: number;    // 下载次数
    views?: number;     // 浏览次数
    favorites?: number; // 收藏次数
  };
  updatedAt: string;
  favoritedAt: string; // 收藏时间
}

interface FavoritesClientProps {
  initialResources: FavoriteResource[];
}

type ViewMode = "grid" | "list";
type SortBy = "newest" | "oldest" | "title" | "popular";

export default function FavoritesClient({ initialResources }: FavoritesClientProps) {
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [loading, setLoading] = useState(false);

  // 搜索和过滤逻辑
  const filteredResources = resources
    .filter(resource => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query)) ||
        resource.category?.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime();
        case "oldest":
          return new Date(a.favoritedAt).getTime() - new Date(b.favoritedAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "popular":
          const scoreA = (a._count?.views || 0) + (a._count?.clicks || 0) * 2 + (a._count?.favorites || 0) * 3;
          const scoreB = (b._count?.views || 0) + (b._count?.clicks || 0) * 2 + (b._count?.favorites || 0) * 3;
          return scoreB - scoreA;
        default:
          return 0;
      }
    });

  // 移除收藏
  const removeFavorite = async (resourceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}/favorite`, {
        method: "DELETE"
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r.id !== resourceId));
        toast.success("已从收藏中移除");
      } else {
        throw new Error("移除收藏失败");
      }
    } catch (error) {
      console.error("移除收藏失败:", error);
      toast.error("移除收藏失败");
    } finally {
      setLoading(false);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <Heart className="w-12 h-12 text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">还没有收藏任何资源</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          浏览资源时点击收藏按钮，喜欢的学习资料就会出现在这里
        </p>
        <a
          href="/resources"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          <Search className="w-4 h-4" />
          去资源库看看
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索收藏的资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          />
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center gap-3">
          {/* 排序选择 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
          >
            <option value="newest">最新收藏</option>
            <option value="oldest">最早收藏</option>
            <option value="title">按标题</option>
            <option value="popular">最受欢迎</option>
          </select>

          {/* 视图切换 */}
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 结果统计 */}
      {searchQuery && (
        <div className="text-center">
          <p className="text-gray-400">
            找到 <span className="text-white font-semibold">{filteredResources.length}</span> 个匹配的资源
          </p>
        </div>
      )}

      {/* 资源列表 */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">没有找到匹配的收藏资源</p>
        </div>
      ) : (
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredResources.map((resource) => (
            <div key={resource.id} className="relative group">
              <ResourceCard resource={resource} />
              
              {/* 收藏时间标签 */}
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center gap-1 px-2 py-1 bg-pink-500/20 backdrop-blur-sm rounded-full text-xs text-pink-200">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(resource.favoritedAt).toLocaleDateString('zh-CN')}收藏
                  </span>
                </div>
              </div>

              {/* 移除收藏按钮 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFavorite(resource.id);
                }}
                disabled={loading}
                className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500/20 backdrop-blur-sm rounded-full text-red-400 hover:bg-red-500/30 hover:text-red-300 disabled:opacity-50"
                title="移除收藏"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}