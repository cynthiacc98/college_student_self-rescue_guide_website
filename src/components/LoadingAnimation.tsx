/**
 * 创意Loading动画组件
 * 支持多种样式和书本主题动画
 */

"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Zap, Star } from 'lucide-react';

type LoadingStyle = 'particles' | 'book' | 'pulse' | 'orbit' | 'typewriter';

interface LoadingAnimationProps {
  style?: LoadingStyle;
  size?: 'small' | 'medium' | 'large';
  message?: string;
  color?: string;
  className?: string;
}

const LoadingAnimation = memo(function LoadingAnimation({
  style = 'book',
  size = 'medium',
  message = '正在加载...',
  color = '#00C2FF',
  className = ''
}: LoadingAnimationProps) {
  
  // 尺寸配置
  const sizeConfig = {
    small: { container: 'w-16 h-16', icon: 24, text: 'text-sm' },
    medium: { container: 'w-24 h-24', icon: 32, text: 'text-base' },
    large: { container: 'w-32 h-32', icon: 48, text: 'text-lg' }
  };

  const config = sizeConfig[size];

  // 粒子Loading
  const ParticlesLoading = () => (
    <div className="relative">
      <div className={`relative ${config.container} mx-auto mb-4`}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: color,
              left: '50%',
              top: '50%',
              transformOrigin: `0 ${config.container.includes('16') ? '32px' : config.container.includes('24') ? '48px' : '64px'}`
            }}
            animate={{
              rotate: 360,
              opacity: [0.2, 1, 0.2]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <TypewriterText text={message} />
    </div>
  );

  // 书本Loading
  const BookLoading = () => (
    <div className="relative">
      <div className={`relative ${config.container} mx-auto mb-4`}>
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={{
            rotateY: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <BookOpen size={config.icon} color={color} />
        </motion.div>
        
        {/* 知识粒子 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              x: [0, Math.cos(i * 60 * Math.PI / 180) * 30, 0],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * 30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
      <TypewriterText text={message} />
    </div>
  );

  // 脉冲Loading
  const PulseLoading = () => (
    <div className="relative">
      <div className={`relative ${config.container} mx-auto mb-4`}>
        <motion.div
          className="w-full h-full rounded-full border-4 border-transparent"
          style={{ borderTopColor: color }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            scale: [0.6, 1, 0.6],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <TypewriterText text={message} />
    </div>
  );

  // 轨道Loading
  const OrbitLoading = () => (
    <div className="relative">
      <div className={`relative ${config.container} mx-auto mb-4`}>
        <motion.div
          className="absolute inset-0 border-2 border-transparent rounded-full"
          style={{ borderTopColor: color }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {[Sparkles, Zap, Star].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transformOrigin: `0 ${config.container.includes('16') ? '32px' : config.container.includes('24') ? '48px' : '64px'}`
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear"
            }}
          >
            <Icon size={16} color={color} />
          </motion.div>
        ))}
      </div>
      <TypewriterText text={message} />
    </div>
  );

  // 打字机文字效果
  const TypewriterText = ({ text }: { text: string }) => {
    return (
      <div className={`text-center ${config.text} text-white/80`}>
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.1,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 2,
              repeatType: "reverse"
            }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="ml-1"
        >
          |
        </motion.span>
      </div>
    );
  };

  // 打字机Loading
  const TypewriterLoading = () => (
    <div className="text-center">
      <div className={`${config.container} mx-auto mb-4 flex items-center justify-center`}>
        <motion.div
          className="w-8 h-8 border-2 border-transparent rounded-sm"
          style={{ borderLeftColor: color }}
          animate={{
            scaleY: [1, 0.8, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <TypewriterText text={message} />
    </div>
  );

  const loadingComponents = {
    particles: ParticlesLoading,
    book: BookLoading,
    pulse: PulseLoading,
    orbit: OrbitLoading,
    typewriter: TypewriterLoading
  };

  const LoadingComponent = loadingComponents[style];

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingComponent />
      
      {/* 背景光晕 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
            `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            `radial-gradient(circle, ${color}10 0%, transparent 70%)`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
});

// 全屏Loading遮罩
export const LoadingOverlay = memo(function LoadingOverlay({
  isLoading,
  style = 'book',
  message = '正在加载精彩内容...'
}: {
  isLoading: boolean;
  style?: LoadingStyle;
  message?: string;
}) {
  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <LoadingAnimation 
          style={style}
          size="large"
          message={message}
        />
      </motion.div>
    </motion.div>
  );
});

export default LoadingAnimation;