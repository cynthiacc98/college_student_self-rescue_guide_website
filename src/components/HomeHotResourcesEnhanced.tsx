"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Star, 
  Eye, 
  Download, 
  Heart,
  Sparkles,
  ArrowUpRight,
  Clock,
  Award,
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Resource {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  tags: string[];
  isPublic: boolean;
  rating?: number;
  updatedAt: Date;
  viewCount?: number;
  downloadCount?: number;
  favoriteCount?: number;
  isNew?: boolean;
  isHot?: boolean;
  categoryName?: string;
}

interface HomeHotResourcesEnhancedProps {
  resources: Resource[];
}

// 资源卡片组件
function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <Link href={`/resources/${resource.id}`}>
        {/* 卡片光晕效果 */}
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition-opacity duration-500"
          animate={{
            opacity: isHovered ? 0.75 : 0,
          }}
        />
        
        {/* 卡片主体 */}
        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
          {/* 图片区域 */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50">
            {resource.coverImageUrl && !imageError ? (
              <Image
                src={resource.coverImageUrl}
                alt={resource.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50"
                  />
                  <Sparkles className="relative w-12 h-12 text-white/50" />
                </div>
              </div>
            )}
            
            {/* 标签 */}
            <div className="absolute top-3 left-3 flex gap-2">
              {resource.isNew && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  NEW
                </motion.span>
              )}
              {resource.isHot && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  HOT
                </motion.span>
              )}
            </div>

            {/* 排名徽章 */}
            {index < 3 && (
              <div className="absolute top-3 right-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                    index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400" :
                    "bg-gradient-to-r from-orange-400 to-orange-500"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </motion.div>
              </div>
            )}
          </div>

          {/* 内容区域 */}
          <div className="p-5">
            {/* 标题 */}
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
              {resource.title}
            </h3>

            {/* 描述 */}
            <p className="text-sm text-white/60 line-clamp-2 mb-4">
              {resource.description}
            </p>

            {/* 分类 */}
            {resource.categoryName && (
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                  {resource.categoryName}
                </span>
              </div>
            )}

            {/* 统计数据 */}
            <div className="flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {resource.viewCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {resource.downloadCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {resource.favoriteCount || 0}
                </span>
              </div>
              
              {/* 评分 */}
              {resource.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-white/70">{resource.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 悬停时的查看按钮 */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-5 right-5"
              >
                <div className="flex items-center gap-1 text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full text-sm font-medium">
                  查看详情
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomeHotResourcesEnhanced({ resources }: HomeHotResourcesEnhancedProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredResources, setFilteredResources] = useState(resources);

  const filters = [
    { id: "all", label: "全部", icon: Sparkles },
    { id: "hot", label: "最热", icon: TrendingUp },
    { id: "new", label: "最新", icon: Clock },
    { id: "rated", label: "高分", icon: Star }
  ];

  useEffect(() => {
    let filtered = [...resources];
    
    switch (activeFilter) {
      case "hot":
        filtered = filtered.filter(r => r.isHot);
        break;
      case "new":
        filtered = filtered.filter(r => r.isNew);
        break;
      case "rated":
        filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
        break;
    }
    
    setFilteredResources(filtered);
  }, [activeFilter, resources]);

  return (
    <div className="relative">
      {/* 过滤器 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              activeFilter === filter.id
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* 资源网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource, index) => (
            <ResourceCard key={resource.id} resource={resource} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* 查看更多 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-12"
      >
        <Link href="/resources">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all"
          >
            探索更多资源
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}