/**
 * 高性能交集显示动画组件
 * 支持多种显示效果和性能优化
 */

"use client";

import React, { memo, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'rotate';
type RevealTiming = 'fast' | 'medium' | 'slow' | 'custom';

interface IntersectionRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  timing?: RevealTiming;
  delay?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
  enableStagger?: boolean;
  staggerChildren?: number;
  customTransition?: object;
}

const IntersectionReveal = memo(function IntersectionReveal({
  children,
  className = '',
  direction = 'up',
  timing = 'medium',
  delay = 0,
  distance = 50,
  threshold = 0.1,
  once = true,
  enableStagger = false,
  staggerChildren = 0.1,
  customTransition
}: IntersectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, { once, amount: threshold });

  // 计时配置
  const timingConfig = {
    fast: { duration: 0.3, ease: "easeOut" },
    medium: { duration: 0.6, ease: "easeOut" },
    slow: { duration: 1.0, ease: "easeOut" },
    custom: customTransition || { duration: 0.6, ease: "easeOut" }
  };

  // 方向变体
  const directionVariants = {
    up: {
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0 }
    },
    down: {
      hidden: { opacity: 0, y: -distance },
      visible: { opacity: 1, y: 0 }
    },
    left: {
      hidden: { opacity: 0, x: distance },
      visible: { opacity: 1, x: 0 }
    },
    right: {
      hidden: { opacity: 0, x: -distance },
      visible: { opacity: 1, x: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    rotate: {
      hidden: { opacity: 0, rotate: -20, scale: 0.9 },
      visible: { opacity: 1, rotate: 0, scale: 1 }
    }
  };

  // 交错动画配置
  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delay
      }
    }
  };

  const variants = enableStagger ? staggerVariants : directionVariants[direction];

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once]);

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={controls}
      transition={{
        ...timingConfig[timing],
        delay: enableStagger ? 0 : delay
      }}
    >
      {enableStagger ? (
        // 为子元素应用交错效果
        <motion.div variants={directionVariants[direction]}>
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
});

// 专用的交错子项组件
export const RevealStaggerChild = memo(function RevealStaggerChild({
  children,
  className = '',
  direction = 'up',
  distance = 30
}: {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  distance?: number;
}) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      scale: direction === 'scale' ? 0.8 : 1,
      rotate: direction === 'rotate' ? -20 : 0
    },
    visible: { 
      opacity: 1, 
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0
    }
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
});

export default IntersectionReveal;