"use client";

import { useState, useRef, MouseEvent } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export default function HolographicCard({ 
  children, 
  className = "",
  intensity = 1
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 鼠标位置追踪
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 3D旋转变换
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15 * intensity, -15 * intensity]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15 * intensity, 15 * intensity]));
  
  // 光晕位置
  const glowX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {/* 全息效果层 */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 彩虹渐变 */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `
              linear-gradient(
                45deg,
                transparent 30%,
                rgba(255, 0, 255, 0.1) 35%,
                rgba(0, 255, 255, 0.1) 40%,
                rgba(255, 255, 0, 0.1) 45%,
                rgba(255, 0, 255, 0.1) 50%,
                transparent 55%
              )
            `,
            backgroundSize: '200% 200%',
            animation: 'holographic 3s ease-in-out infinite',
          }}
        />
        
        {/* 扫描线 */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.03) 2px,
                rgba(255, 255, 255, 0.03) 4px
              )
            `,
          }}
        />
        
        {/* 光晕效果 */}
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
            left: glowX,
            top: glowY,
            x: '-50%',
            y: '-50%',
          }}
        />
      </motion.div>

      {/* 边框光效 */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `
            linear-gradient(
              45deg,
              #FF00FF,
              #00FFFF,
              #FFFF00,
              #FF00FF,
              #00FFFF
            )
          `,
          backgroundSize: '300% 300%',
          animation: 'gradient-shift 4s ease infinite',
        }}
      />

      {/* 内容容器 */}
      <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden">
        {/* 3D深度阴影 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-cyan-600/20 opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {children}
      </div>

      <style jsx>{`
        @keyframes holographic {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
}