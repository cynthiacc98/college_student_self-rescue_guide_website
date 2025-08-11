"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { ExternalLink, Clock, Tag, TrendingUp, Zap, Eye, Heart, Star } from 'lucide-react';

interface NeoBrutalCardProps {
  title: string;
  description: string;
  category?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'featured' | 'compact' | 'premium' | 'neon';
  metadata?: {
    views?: number;
    rating?: number;
    updatedAt?: string;
    tags?: string[];
    isHot?: boolean;
    isNew?: boolean;
    likes?: number;
    downloadCount?: number;
  };
  className?: string;
  children?: React.ReactNode;
  enable3D?: boolean;
  glowEffect?: boolean;
  particleEffect?: boolean;
}

export default function NeoBrutalCard({
  title,
  description,
  category,
  href,
  onClick,
  variant = 'default',
  metadata,
  className = '',
  children,
  enable3D = true,
  glowEffect = true,
  particleEffect = true
}: NeoBrutalCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D效果的弹簧动画
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(y, [-0.5, 0.5], [7.5, -7.5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-7.5, 7.5]);
  
  // 鼠标移动处理
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enable3D) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = (event.clientX - centerX) / (rect.width / 2);
    const mouseY = (event.clientY - centerY) / (rect.height / 2);
    
    x.set(mouseX);
    y.set(mouseY);
    setMousePosition({ x: mouseX, y: mouseY });
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setMousePosition({ x: 0, y: 0 });
  };
  
  const cardSizes = {
    default: 'p-6',
    featured: 'p-8',
    compact: 'p-4',
    premium: 'p-10',
    neon: 'p-6'
  };
  
  const titleSizes = {
    default: 'text-xl',
    featured: 'text-2xl',
    compact: 'text-lg',
    premium: 'text-3xl',
    neon: 'text-xl'
  };
  
  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90',
      border: 'border-4 border-black dark:border-white',
      shadow: 'shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff]',
      hoverShadow: 'hover:shadow-[12px_12px_0px_0px_#6366f1] dark:hover:shadow-[12px_12px_0px_0px_#8b5cf6]'
    },
    featured: {
      bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 to-orange-900/50',
      border: 'border-4 border-black dark:border-yellow-400',
      shadow: 'shadow-[10px_10px_0px_0px_#000] dark:shadow-[10px_10px_0px_0px_#eab308]',
      hoverShadow: 'hover:shadow-[16px_16px_0px_0px_#f59e0b] dark:hover:shadow-[16px_16px_0px_0px_#fbbf24]'
    },
    compact: {
      bg: 'bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-800/90 dark:to-gray-700/90',
      border: 'border-3 border-black dark:border-white',
      shadow: 'shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]',
      hoverShadow: 'hover:shadow-[10px_10px_0px_0px_#6366f1] dark:hover:shadow-[10px_10px_0px_0px_#8b5cf6]'
    },
    premium: {
      bg: 'bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30',
      border: 'border-4 border-black dark:border-gradient-to-r dark:from-purple-400 dark:to-pink-400',
      shadow: 'shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#a855f7]',
      hoverShadow: 'hover:shadow-[18px_18px_0px_0px_#8b5cf6] dark:hover:shadow-[18px_18px_0px_0px_#d946ef]'
    },
    neon: {
      bg: 'bg-black border-4 border-cyan-400',
      border: 'border-cyan-400',
      shadow: 'shadow-[0_0_20px_#00ffff40]',
      hoverShadow: 'hover:shadow-[0_0_40px_#00ffff80,8px_8px_0px_0px_#00ffff]'
    }
  };

  const currentStyle = variantStyles[variant];
  
  const baseCard = (
    <motion.div
      ref={cardRef}
      className={`
        relative group cursor-pointer overflow-hidden backdrop-blur-md
        ${currentStyle.bg}
        ${currentStyle.border}
        ${currentStyle.shadow}
        ${currentStyle.hoverShadow}
        transition-all duration-300 ease-out
        ${cardSizes[variant]}
        ${variant === 'neon' ? 'text-cyan-400' : 'text-black dark:text-white'}
        ${className}
      `}
      style={enable3D ? {
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        rotateX: rotateX,
        rotateY: rotateY
      } : {}}
      initial={{ 
        rotate: Math.random() * 4 - 2,
        scale: 0.95
      }}
      whileHover={{
        rotate: 0,
        scale: 1.05,
        y: -12,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
      onHoverStart={() => setIsHovered(true)}
      onClick={onClick}
    >
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: variant === 'neon' ? `
            repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 45deg, #00ffff20 45deg 90deg, transparent 90deg 135deg, #ff00ff20 135deg 180deg)
          ` : `
            repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px),
            repeating-linear-gradient(-45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)
          `
        }} />
      </div>
      
      {/* 3D Depth Layer */}
      {enable3D && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/10 pointer-events-none"
          animate={{
            opacity: isHovered ? 0.8 : 0.3,
            background: `linear-gradient(${45 + mousePosition.x * 30}deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 70%)`
          }}
          transition={{ duration: 0.3 }}
        />
      )
      }
      
      {/* Glow Effect */}
      {glowEffect && (
        <motion.div
          className="absolute -inset-2 pointer-events-none opacity-0 blur-xl"
          style={{
            background: variant === 'neon' ? 
              'linear-gradient(45deg, #00ffff40, #ff00ff40, #ffff0040)' :
              variant === 'premium' ?
              'linear-gradient(45deg, #8b5cf640, #d946ef40, #06b6d440)' :
              'linear-gradient(45deg, #6366f140, #8b5cf640, #ec489940)'
          }}
          animate={{
            opacity: isHovered ? (variant === 'neon' ? 0.6 : 0.3) : 0
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Animated Corner Accent */}
      <motion.div
        className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px]"
        style={{
          borderTopColor: isHovered ? '#6366f1' : '#000'
        }}
        animate={{
          borderTopColor: isHovered ? '#6366f1' : '#000'
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Status Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <AnimatePresence>
          {metadata?.isHot && (
            <motion.div
              key="hot-badge-unique"
              className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded border-2 border-black"
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              exit={{ scale: 0, rotate: -12 }}
              whileHover={{ rotate: -8, scale: 1.1 }}
            >
              <TrendingUp size={12} />
              HOT
            </motion.div>
          )}
          {metadata?.isNew && (
            <motion.div
              key="new-badge-unique"
              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded border-2 border-black"
              initial={{ scale: 0, rotate: 8 }}
              animate={{ scale: 1, rotate: 8 }}
              exit={{ scale: 0, rotate: 8 }}
              whileHover={{ rotate: 4, scale: 1.1 }}
            >
              <Zap size={12} />
              NEW
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tag */}
      {category && (
        <motion.div
          className="inline-block mb-3 px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-wider border-2 border-black dark:border-white"
          whileHover={{ scale: 1.05, rotate: 1 }}
        >
          {category}
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        className={`
          ${titleSizes[variant]} 
          font-black mb-3 text-black dark:text-white
          group-hover:text-indigo-600 dark:group-hover:text-purple-400
          transition-colors duration-300
          leading-tight
        `}
        animate={{
          x: isHovered ? 2 : 0,
          y: isHovered ? -1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3"
        animate={{
          x: isHovered ? 2 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.02 }}
      >
        {description}
      </motion.p>

      {/* Enhanced Metadata */}
      {metadata && (
        <motion.div 
          className="flex flex-wrap items-center gap-3 text-xs mb-4"
          style={{
            color: variant === 'neon' ? '#00ffff' : 'inherit'
          }}
        >
          {metadata.views && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-400/30"
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
            >
              <Eye size={12} className="text-blue-400" />
              <span className="font-medium">{metadata.views.toLocaleString()}</span>
            </motion.div>
          )}
          {metadata.likes && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/20 border border-pink-400/30"
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(236, 72, 153, 0.3)' }}
            >
              <Heart size={12} className="text-pink-400" />
              <span className="font-medium">{metadata.likes.toLocaleString()}</span>
            </motion.div>
          )}
          {metadata.downloadCount && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-400/30"
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
            >
              <ExternalLink size={12} className="text-green-400" />
              <span className="font-medium">{metadata.downloadCount.toLocaleString()}</span>
            </motion.div>
          )}
          {metadata.updatedAt && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 border border-gray-400/30"
              whileHover={{ scale: 1.1 }}
            >
              <Clock size={12} className="text-gray-400" />
              <span className="font-medium">{metadata.updatedAt}</span>
            </motion.div>
          )}
          {metadata.rating && (
            <motion.div 
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30"
              whileHover={{ scale: 1.1 }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full`}
                    style={{
                      backgroundColor: i < metadata.rating! ? '#fbbf24' : '#d1d5db'
                    }}
                    animate={{
                      scale: isHovered && i < metadata.rating! ? [1, 1.3, 1] : 1
                    }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  />
                ))}
              </div>
              <span className="font-medium text-yellow-600">{metadata.rating}/5</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tags */}
      {metadata?.tags && metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {metadata.tags.slice(0, 3).map((tag, index) => (
            <motion.span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-300 dark:border-gray-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1, borderColor: '#6366f1' }}
            >
              <Tag size={10} />
              {tag}
            </motion.span>
          ))}
          {metadata.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{metadata.tags.length - 3} 更多
            </span>
          )}
        </div>
      )}

      {/* Custom Content */}
      {children}

      {/* Action Indicator */}
      <motion.div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        animate={{
          x: isHovered ? -2 : 0,
          y: isHovered ? -2 : 0,
          rotate: isHovered ? -5 : 0
        }}
      >
        <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full border-2 border-black dark:border-white">
          <ExternalLink size={16} />
        </div>
      </motion.div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, 
              rgba(99, 102, 241, 0.1) 0%, 
              transparent 70%
            )
          `,
          opacity: 0
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.1 : 0.9
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Enhanced Interactive Particles */}
      <AnimatePresence>
        {isHovered && particleEffect && (
          <motion.div
            key="particle-effects"
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Floating Particles */}
            {Array.from({ length: variant === 'premium' ? 12 : 8 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  backgroundColor: variant === 'neon' ? '#00ffff' :
                                   variant === 'premium' ? '#a855f7' :
                                   variant === 'featured' ? '#f59e0b' : '#6366f1'
                }}
                animate={{
                  y: [0, -20 - Math.random() * 20, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Energy Rings */}
            {variant === 'neon' && (
              <>              
                <motion.div
                  className="absolute top-1/2 left-1/2 w-20 h-20 border border-cyan-400/30 rounded-full"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.1, 0.5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 w-32 h-32 border border-pink-400/20 rounded-full"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.05, 0.3],
                    rotate: [360, 180, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </>
            )}
            
            {/* Premium Sparkles */}
            {variant === 'premium' && (
              <>              
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute"
                    style={{
                      left: `${20 + (i * 12)}%`,
                      top: `${20 + ((i % 3) * 20)}%`
                    }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.25
                      }}
                    />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {baseCard}
      </a>
    );
  }

  return baseCard;
}