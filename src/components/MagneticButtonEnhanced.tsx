"use client";

import React, { useRef, useState, useCallback } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';

interface MagneticButtonEnhancedProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number; // 磁性强度 0-1
  maxDistance?: number; // 最大吸附距离
  snapBack?: boolean; // 是否快速回弹
  glowEffect?: boolean; // 是否启用光晕效果
  rippleEffect?: boolean; // 是否启用涟漪效果
  variant?: 'primary' | 'glass' | 'brutal' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function MagneticButtonEnhanced({
  children,
  className = '',
  href,
  onClick,
  strength = 0.3,
  maxDistance = 100,
  snapBack = true,
  glowEffect = true,
  rippleEffect = true,
  variant = 'primary',
  size = 'md'
}: MagneticButtonEnhancedProps) {
  const buttonRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; scale: number }>>([]);

  // 尺寸变量
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  // 变体样式
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-purple-600 text-white
      border border-blue-400/20 shadow-lg hover:shadow-xl
      hover:from-blue-400 hover:to-purple-500
    `,
    glass: `
      backdrop-blur-xl bg-white/10 border border-white/20
      text-white hover:bg-white/20
    `,
    brutal: `
      bg-yellow-400 border-4 border-black text-black font-black
      shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000]
      hover:transform hover:-translate-x-1 hover:-translate-y-1
    `,
    neon: `
      bg-black border-2 border-cyan-400 text-cyan-400
      shadow-[0_0_20px_#00ffff40] hover:shadow-[0_0_40px_#00ffff60]
      hover:text-cyan-300 hover:border-cyan-300
    `
  };

  // 计算磁性效果
  const calculateMagneticOffset = useCallback((clientX: number, clientY: number) => {
    if (!buttonRef.current) return { x: 0, y: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > maxDistance) return { x: 0, y: 0 };
    
    const force = Math.max(0, (maxDistance - distance) / maxDistance);
    const magneticX = deltaX * force * strength;
    const magneticY = deltaY * force * strength;
    
    return { x: magneticX, y: magneticY };
  }, [maxDistance, strength]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = calculateMagneticOffset(e.clientX, e.clientY);
    setMousePosition({ x, y });
  }, [calculateMagneticOffset]);

  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (snapBack) {
      setMousePosition({ x: 0, y: 0 });
    }
  }, [snapBack]);

  // 点击涟漪效果
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (rippleEffect && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
        scale: 0
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // 移除涟漪
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    onClick?.();
  }, [rippleEffect, onClick]);

  // 动画帧更新涟漪
  useAnimationFrame((time) => {
    setRipples(prev => prev.map(ripple => ({
      ...ripple,
      scale: Math.min(ripple.scale + 0.05, 2)
    })));
  });

  const baseClasses = `
    relative inline-flex items-center justify-center
    font-semibold rounded-2xl transition-all duration-300
    cursor-pointer overflow-hidden select-none
    will-change-transform transform-gpu
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const Component = href ? 'a' : 'button';

  return (
    <motion.div
      className="relative"
      animate={{
        x: mousePosition.x,
        y: mousePosition.y
      }}
      transition={{
        type: "spring",
        stiffness: snapBack ? 300 : 150,
        damping: snapBack ? 30 : 15,
        mass: 1
      }}
    >
      <Component
        ref={buttonRef as any}
        href={href}
        className={baseClasses}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 背景光晕效果 */}
        {glowEffect && (
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, 
                ${variant === 'neon' ? '#00ffff' : 
                  variant === 'brutal' ? '#ffff00' :
                  variant === 'glass' ? '#ffffff' : '#6366f1'}20 0%, 
                transparent 70%
              )`,
              filter: 'blur(20px)',
              transform: 'scale(1.5)'
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1.8 : 1.5
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* 主要内容 */}
        <motion.div
          className="relative z-10 flex items-center justify-center gap-2"
          animate={{
            rotateX: `${mousePosition.y * -0.1}deg`,
            rotateY: `${mousePosition.x * 0.1}deg`
          }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.div>

        {/* 悬浮光扫效果 */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl"
          initial={false}
        >
          <motion.div
            className="absolute top-0 left-0 w-1 h-full bg-white/40 blur-sm"
            animate={{
              x: isHovered ? ['-100%', '100%'] : '-100%',
              opacity: isHovered ? [0, 1, 0] : 0
            }}
            transition={{
              duration: isHovered ? 0.8 : 0,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* 涟漪效果 */}
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: ripple.scale * 4,
              opacity: Math.max(0, 1 - ripple.scale)
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* 边框增强效果 */}
        {variant !== 'brutal' && (
          <motion.div
            className="absolute inset-0 rounded-2xl border pointer-events-none"
            style={{
              borderColor: variant === 'neon' ? '#00ffff' : 
                          variant === 'glass' ? 'rgba(255,255,255,0.3)' : 
                          'rgba(99,102,241,0.3)'
            }}
            animate={{
              opacity: isHovered ? 0.6 : 0,
              borderWidth: isHovered ? 2 : 1
            }}
            transition={{ duration: 0.2 }}
          />
        )}
      </Component>
    </motion.div>
  );
}