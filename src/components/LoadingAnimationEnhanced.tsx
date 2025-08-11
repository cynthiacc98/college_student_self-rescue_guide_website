"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LoadingAnimationEnhancedProps {
  isVisible: boolean;
  variant?: 'default' | 'book' | 'particles' | 'geometric' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  color?: 'primary' | 'neon' | 'rainbow';
}

export default function LoadingAnimationEnhanced({
  isVisible,
  variant = 'default',
  size = 'md',
  text = '加载中...',
  progress = 0,
  showProgress = false,
  color = 'primary'
}: LoadingAnimationEnhancedProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  // 尺寸配置
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-sm', dot: 'w-2 h-2' },
    md: { container: 'w-16 h-16', text: 'text-base', dot: 'w-3 h-3' },
    lg: { container: 'w-24 h-24', text: 'text-lg', dot: 'w-4 h-4' },
    xl: { container: 'w-32 h-32', text: 'text-xl', dot: 'w-5 h-5' }
  };

  const currentSize = sizes[size];

  // 颜色配置
  const colors = {
    primary: {
      main: '#6366f1',
      gradient: 'from-blue-500 to-purple-600',
      ring: 'border-blue-500',
      glow: 'shadow-blue-500/50'
    },
    neon: {
      main: '#00ffff',
      gradient: 'from-cyan-400 to-pink-400',
      ring: 'border-cyan-400',
      glow: 'shadow-cyan-400/50'
    },
    rainbow: {
      main: '#ff6b6b',
      gradient: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
      ring: 'border-pink-500',
      glow: 'shadow-pink-500/50'
    }
  };

  const currentColor = colors[color];

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 800);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // 默认螺旋加载器
  const DefaultLoader = () => (
    <div className={`relative ${currentSize.container}`}>
      <motion.div
        className={`absolute inset-0 border-4 border-transparent border-t-current rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ color: currentColor.main }}
      />
      <motion.div
        className={`absolute inset-2 border-4 border-transparent border-r-current rounded-full opacity-60`}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{ color: currentColor.main }}
      />
      <motion.div
        className={`absolute inset-4 border-4 border-transparent border-b-current rounded-full opacity-40`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ color: currentColor.main }}
      />
    </div>
  );

  // 书本翻页加载器
  const BookLoader = () => (
    <div className={`relative ${currentSize.container}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 border-current rounded-lg origin-left"
          style={{ 
            color: currentColor.main,
            zIndex: 3 - i,
            left: `${i * 2}px`,
            top: `${i * 2}px`
          }}
          animate={{
            rotateY: animationPhase === i ? [-5, 85, -5] : -5,
            scale: animationPhase === i ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.8
          }}
        />
      ))}
    </div>
  );

  // 粒子加载器
  const ParticlesLoader = () => (
    <div className={`relative ${currentSize.container} flex items-center justify-center`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${currentSize.dot} bg-current rounded-full`}
          style={{ 
            color: currentColor.main,
            transformOrigin: '0 20px' 
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.25
          }}
          initial={{
            rotate: i * 45,
            x: 20
          }}
        />
      ))}
    </div>
  );

  // 几何加载器
  const GeometricLoader = () => (
    <div className={`relative ${currentSize.container}`}>
      <motion.div
        className="absolute inset-0 border-2 border-current"
        style={{ color: currentColor.main }}
        animate={{
          rotate: [0, 90, 180, 270, 360],
          borderRadius: ['0%', '25%', '50%', '25%', '0%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-4 border-2 border-current opacity-60"
        style={{ color: currentColor.main }}
        animate={{
          rotate: [360, 270, 180, 90, 0],
          borderRadius: ['50%', '25%', '0%', '25%', '50%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </div>
  );

  // 霓虹加载器
  const NeonLoader = () => (
    <div className={`relative ${currentSize.container}`}>
      <motion.div
        className={`absolute inset-0 rounded-full border-4 border-cyan-400 shadow-lg shadow-cyan-400/50`}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
      <motion.div
        className={`absolute inset-2 rounded-full border-2 border-pink-400 shadow-md shadow-pink-400/50`}
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
      <motion.div
        className={`absolute inset-4 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 shadow-sm`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1,
          repeat: Infinity
        }}
      />
    </div>
  );

  const getLoader = () => {
    switch (variant) {
      case 'book': return <BookLoader />;
      case 'particles': return <ParticlesLoader />;
      case 'geometric': return <GeometricLoader />;
      case 'neon': return <NeonLoader />;
      default: return <DefaultLoader />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 主要加载动画 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="relative"
          >
            {getLoader()}
            
            {/* 光晕效果 */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-xl opacity-20`}
              style={{ backgroundColor: currentColor.main }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* 加载文本 */}
          <motion.div
            className={`mt-8 ${currentSize.text} font-medium text-white text-center`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {text}
          </motion.div>

          {/* 进度条 */}
          {showProgress && (
            <motion.div
              className="mt-4 w-48 h-2 bg-white/10 rounded-full overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className={`h-full bg-gradient-to-r ${currentColor.gradient} rounded-full`}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>
          )}

          {/* 进度百分比 */}
          {showProgress && (
            <motion.div
              className="mt-2 text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {Math.round(progress)}%
            </motion.div>
          )}

          {/* 背景装饰 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}