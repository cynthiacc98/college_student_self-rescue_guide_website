"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  range?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'brutal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function MagneticButton({
  children,
  strength = 0.3,
  range = 100,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md'
}: MagneticButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  // 鼠标位置转换为旋转效果
  const rotateX = useTransform(springY, [-range, range], [5, -5]);
  const rotateY = useTransform(springX, [-range, range], [-5, 5]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < range) {
      x.set(deltaX * strength);
      y.set(deltaY * strength);
    }
  }, [disabled, strength, range, x, y]);
  
  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);
  
  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  // 变体样式
  const variants = {
    primary: `
      bg-gradient-to-r from-indigo-600 to-purple-600 
      text-white border-2 border-transparent
      hover:from-indigo-700 hover:to-purple-700
      shadow-lg hover:shadow-xl
      focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    `,
    secondary: `
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-white 
      border-2 border-gray-300 dark:border-gray-600
      hover:bg-gray-50 dark:hover:bg-gray-700
      shadow-md hover:shadow-lg
    `,
    ghost: `
      bg-transparent 
      text-gray-700 dark:text-gray-300 
      border-2 border-transparent
      hover:bg-gray-100 dark:hover:bg-gray-800
      hover:text-gray-900 dark:hover:text-white
    `,
    brutal: `
      bg-yellow-400 
      text-black 
      border-4 border-black
      shadow-[6px_6px_0px_0px_#000]
      hover:shadow-[8px_8px_0px_0px_#000]
      hover:bg-yellow-300
      font-black uppercase
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative inline-flex items-center justify-center
        font-medium rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        transform-gpu perspective-1000
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={{
        x: springX,
        y: springY,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ scale: 1 }}
    >
      {/* 背景光晕效果 */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
        style={{
          background: variant === 'primary' 
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(107, 114, 128, 0.2) 0%, transparent 70%)',
          filter: 'blur(10px)',
          transform: 'scale(1.2)'
        }}
        animate={{
          opacity: isHovered && !disabled ? 1 : 0,
          scale: isHovered && !disabled ? 1.4 : 1.2
        }}
        transition={{ duration: 0.3 }}
      />

      {/* 按钮内容 */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-2"
        animate={{
          scale: isHovered && !disabled ? 1.02 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Brutal风格的纹理 */}
      {variant === 'brutal' && (
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 2px, currentColor 2px, currentColor 3px),
              repeating-linear-gradient(-45deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)
            `
          }} />
        </div>
      )}

      {/* 涟漪效果 */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
        initial={false}
        animate={{
          scale: isHovered && !disabled ? 1 : 0,
          opacity: isHovered && !disabled ? 0.1 : 0
        }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="w-full h-full bg-white"
          animate={{
            scale: isHovered ? [1, 1.5, 2] : 1,
            opacity: isHovered ? [0.3, 0.1, 0] : 0
          }}
          transition={{
            duration: 1,
            repeat: isHovered ? Infinity : 0,
            ease: "easeOut"
          }}
        />
      </motion.div>

      {/* 粒子效果 */}
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-current rounded-full opacity-30"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${20 + (i % 2 * 60)}%`
              }}
              animate={{
                y: [-5, -15, -5],
                opacity: [0.3, 0.7, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}