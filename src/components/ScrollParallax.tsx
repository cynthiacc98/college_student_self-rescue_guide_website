/**
 * 高级滚动视差效果组件
 * 支持多层视差、交互式滚动指示器和性能优化
 */

"use client";

import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

// 滚动指示器组件
const ScrollIndicator = memo(function ScrollIndicator({ 
  scrollProgress, 
  isVisible 
}: { 
  scrollProgress: MotionValue<number>; 
  isVisible: boolean; 
}) {
  const indicatorHeight = useTransform(scrollProgress, [0, 1], ["0%", "100%"]);
  
  return (
    <motion.div
      className="fixed right-6 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-white/10 rounded-full overflow-hidden z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-full"
        style={{ height: indicatorHeight }}
      />
    </motion.div>
  );
});

interface ScrollParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  enableIndicator?: boolean;
  layers?: ParallaxLayer[];
}

interface ParallaxLayer {
  id: string;
  speed: number;
  element: React.ReactNode;
  zIndex?: number;
  opacity?: MotionValue<number>;
}

const ScrollParallax = memo(function ScrollParallax({
  children,
  className = '',
  speed = 0.5,
  enableIndicator = true,
  layers = []
}: ScrollParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // 使用弹性动画优化滚动性能
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const y = useTransform(smoothScrollProgress, [0, 1], [0, speed * -200]);
  const opacity = useTransform(smoothScrollProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // 监听元素可见性
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 多层视差背景 */}
      {layers.map((layer) => {
        // 为每个层创建独立的 transform
        const layerY = useTransform(smoothScrollProgress, [0, 1], [0, layer.speed * -100]);
        
        return (
          <motion.div
            key={layer.id}
            className="absolute inset-0 pointer-events-none"
            style={{
              y: layerY,
              zIndex: layer.zIndex || 0,
              opacity: layer.opacity || 1
            }}
          >
            {layer.element}
          </motion.div>
        );
      })}

      {/* 主内容 */}
      <motion.div
        style={{ y: isVisible ? y : 0, opacity }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* 滚动进度指示器 */}
      {enableIndicator && (
        <ScrollIndicator 
          scrollProgress={smoothScrollProgress}
          isVisible={isVisible}
        />
      )}
    </div>
  );
});

export default ScrollParallax;