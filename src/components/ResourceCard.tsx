"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Lock, Eye, Download, Star, Clock, TrendingUp } from "lucide-react";
import { useState, useRef } from "react";

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
  };
  index?: number;
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Generate random gradient for cards without images
  const gradients = [
    "from-purple-600 via-pink-600 to-red-600",
    "from-blue-600 via-cyan-600 to-teal-600",
    "from-green-600 via-emerald-600 to-cyan-600",
    "from-orange-600 via-red-600 to-pink-600",
    "from-indigo-600 via-purple-600 to-pink-600",
  ];
  const defaultGradient = gradients[index % gradients.length];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      className="relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        animate={{
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      
      {/* Card Container */}
      <div className="relative h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {/* Gradient Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br">
          {resource.coverImageUrl ? (
            <Image
              src={resource.coverImageUrl}
              alt={resource.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${defaultGradient} opacity-80`}>
              <div className="absolute inset-0 bg-black/20" />
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                    "radial-gradient(circle at 80% 50%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                    "radial-gradient(circle at 20% 50%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`
                px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5
                ${resource.isPublic 
                  ? "bg-green-500/20 border border-green-500/30 text-green-300" 
                  : "bg-orange-500/20 border border-orange-500/30 text-orange-300"
                }
              `}
            >
              {resource.isPublic ? (
                <>
                  <Eye className="w-3 h-3" />
                  <span className="text-xs font-medium">公开</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span className="text-xs font-medium">私密</span>
                </>
              )}
            </motion.div>
          </div>
          
          {/* Category Badge */}
          {resource.category && (
            <div className="absolute top-3 left-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full"
              >
                <span className="text-xs font-medium text-white/90">
                  {resource.category.name}
                </span>
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
            {resource.title}
          </h3>
          
          {/* Description */}
          {resource.description && (
            <p className="text-sm text-white/60 line-clamp-2 mb-3">
              {resource.description}
            </p>
          )}
          
          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {resource.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70"
                >
                  #{tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-white/50">
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {resource._count?.clicks !== undefined && (
                <div className="flex items-center gap-1 text-white/50">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">{resource._count.clicks} 次浏览</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-white/50">
                <Clock className="w-3 h-3" />
                <span className="text-xs">最近更新</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < 4 ? "text-yellow-500 fill-yellow-500" : "text-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Action Button */}
          <Link href={`/resources/${resource.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>查看详情</span>
              <Download className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
        
        {/* Animated Border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "200% 0%"] : "0% 0%",
          }}
          transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
        />
      </div>
    </motion.div>
  );
}
