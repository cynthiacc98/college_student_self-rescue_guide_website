/**
 * 3D书本动画组件
 * 支持翻页效果、知识传播动画和交互式体验
 */

"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { BookOpen, Sparkles, Star, Zap } from 'lucide-react';

interface BookAnimationProps {
  className?: string;
  autoPlay?: boolean;
  enableInteraction?: boolean;
  showKnowledgeParticles?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'gradient';
}

interface Page {
  id: number;
  content: string;
  icon: React.ReactNode;
  color: string;
}

const BookAnimation = memo(function BookAnimation({
  className = '',
  autoPlay = true,
  enableInteraction = true,
  showKnowledgeParticles = true,
  size = 'medium',
  theme = 'gradient'
}: BookAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // 书本页面内容
  const pages: Page[] = [
    {
      id: 0,
      content: "学习\n资料",
      icon: <BookOpen className="w-6 h-6" />,
      color: "#00C2FF"
    },
    {
      id: 1,
      content: "知识\n分享",
      icon: <Sparkles className="w-6 h-6" />,
      color: "#18FF92"
    },
    {
      id: 2,
      content: "技能\n提升",
      icon: <Star className="w-6 h-6" />,
      color: "#8B5CF6"
    },
    {
      id: 3,
      content: "成长\n指南",
      icon: <Zap className="w-6 h-6" />,
      color: "#FF66C4"
    }
  ];

  // 尺寸配置
  const sizeConfig = {
    small: { width: 120, height: 80, fontSize: 'text-xs' },
    medium: { width: 180, height: 120, fontSize: 'text-sm' },
    large: { width: 240, height: 160, fontSize: 'text-base' }
  };

  const config = sizeConfig[size];

  // 翻页逻辑
  const flipToNextPage = useCallback(async () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    const nextPage = (currentPage + 1) % pages.length;
    
    // 翻页动画
    await controls.start({
      rotateY: [0, -90, 0],
      scale: [1, 0.95, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        times: [0, 0.5, 1]
      }
    });
    
    setCurrentPage(nextPage);
    setIsFlipping(false);
  }, [isFlipping, currentPage, controls, pages.length]);

  // 自动翻页
  useEffect(() => {
    if (!autoPlay || !isInView) return;

    const interval = setInterval(() => {
      if (!isHovered) {
        flipToNextPage();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPlay, isInView, isHovered, flipToNextPage]);

  // 初始动画
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const handleClick = () => {
    if (enableInteraction && !isFlipping) {
      flipToNextPage();
    }
  };

  // 动画变体
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      rotateX: -30,
      y: 50 
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, rotateY: -20 },
    visible: { 
      opacity: 1, 
      rotateY: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [0, -30, -60],
      x: [-20, 0, 20],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatDelay: 1,
        ease: "easeOut"
      }
    }
  };

  const currentPageData = pages[currentPage];

  return (
    <motion.div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 知识粒子效果 */}
      {showKnowledgeParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              variants={particleVariants}
              animate="visible"
              transition={{ delay: i * 0.3 }}
            >
              <div 
                className="w-2 h-2 rounded-full blur-sm"
                style={{ backgroundColor: currentPageData.color }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* 主书本容器 */}
      <motion.div
        className={`relative cursor-pointer perspective-1000 ${enableInteraction ? 'hover:scale-105' : ''}`}
        onClick={handleClick}
        animate={controls}
        whileHover={enableInteraction ? { scale: 1.05, rotateX: 5 } : {}}
        whileTap={enableInteraction ? { scale: 0.98 } : {}}
        style={{
          width: config.width,
          height: config.height,
          perspective: '1000px'
        }}
      >
        {/* 书本阴影 */}
        <div 
          className="absolute inset-0 rounded-lg transform translate-y-2 translate-x-2"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            filter: 'blur(8px)',
            zIndex: -1
          }}
        />

        {/* 书本主体 */}
        <motion.div
          className="relative w-full h-full rounded-lg overflow-hidden transform-style-preserve-3d"
          style={{
            background: theme === 'gradient' 
              ? `linear-gradient(135deg, ${currentPageData.color}20, ${currentPageData.color}40)`
              : theme === 'dark' 
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${currentPageData.color}30`,
            boxShadow: `0 20px 40px ${currentPageData.color}20`
          }}
          variants={pageVariants}
        >
          {/* 书脊效果 */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{
              background: `linear-gradient(to bottom, ${currentPageData.color}, ${currentPageData.color}80)`,
              boxShadow: `inset -2px 0 4px rgba(0,0,0,0.2)`
            }}
          />

          {/* 页面内容 */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            {/* 图标 */}
            <motion.div
              className="mb-3"
              style={{ color: currentPageData.color }}
              animate={{
                rotateY: isFlipping ? [0, 360] : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.6 }}
            >
              {currentPageData.icon}
            </motion.div>

            {/* 文字 */}
            <motion.div
              className={`text-center font-bold leading-tight ${config.fontSize}`}
              style={{ 
                color: theme === 'light' ? '#1e293b' : '#ffffff',
                textShadow: `0 0 20px ${currentPageData.color}40`
              }}
              animate={{
                opacity: isFlipping ? [1, 0, 1] : 1
              }}
              transition={{ duration: 0.8 }}
            >
              {currentPageData.content.split('\n').map((line, index) => (
                <div key={index} className="block">
                  {line}
                </div>
              ))}
            </motion.div>

            {/* 装饰线条 */}
            <motion.div
              className="absolute bottom-4 left-4 right-4 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentPageData.color}, transparent)`
              }}
              animate={{
                scaleX: isHovered ? 1 : 0.6,
                opacity: isHovered ? 1 : 0.6
              }}
              transition={{ duration: 0.3 }}
            />

            {/* 页面指示器 */}
            <div className="absolute top-2 right-2 flex gap-1">
              {pages.map((_, index) => (
                <motion.div
                  key={index}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: index === currentPage ? currentPageData.color : 'rgba(255,255,255,0.3)'
                  }}
                  animate={{
                    scale: index === currentPage ? 1.2 : 1,
                    opacity: index === currentPage ? 1 : 0.5
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>

          {/* 光泽效果 */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
            }}
            animate={{
              opacity: isHovered ? 0.8 : 0.4
            }}
            transition={{ duration: 0.3 }}
          />

          {/* 翻页动画遮罩 */}
          {isFlipping && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${currentPageData.color}20 50%, transparent 100%)`
              }}
              animate={{
                x: [-config.width, config.width]
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* 交互提示 */}
        {enableInteraction && isHovered && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="px-2 py-1 bg-black/20 backdrop-blur-sm rounded text-xs text-white/80 whitespace-nowrap">
              点击翻页
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 环绕光晕 */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none -z-10"
        style={{
          background: `radial-gradient(circle, ${currentPageData.color}15 0%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
        animate={{
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 0.8 : 0.4
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
});

export default BookAnimation;