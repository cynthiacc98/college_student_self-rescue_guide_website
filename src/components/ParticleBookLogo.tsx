"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  phase: number;
  id: number;
}

interface ParticleBookLogoProps {
  onAnimationComplete?: () => void;
  isVisible?: boolean;
  size?: number;
}

export default function ParticleBookLogo({ 
  onAnimationComplete, 
  isVisible = true,
  size = 200 
}: ParticleBookLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'gathering' | 'forming' | 'complete'>('gathering');
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const isAnimatingRef = useRef(false);
  
  // 书本Logo的像素点定义 (简化的书本形状)
  const bookShape = useMemo(() => {
    const points: Array<{x: number, y: number}> = [];
    const scale = size / 200; // 基础尺寸200px
    
    // 书本外框
    for (let x = 20; x < 180; x += 4) {
      points.push({ x: x * scale, y: 40 * scale }); // 上边
      points.push({ x: x * scale, y: 160 * scale }); // 下边
    }
    for (let y = 40; y < 160; y += 4) {
      points.push({ x: 20 * scale, y: y * scale }); // 左边
      points.push({ x: 180 * scale, y: y * scale }); // 右边
    }
    
    // 书脊
    for (let y = 45; y < 155; y += 3) {
      points.push({ x: 100 * scale, y: y * scale });
    }
    
    // 页面线条
    for (let i = 0; i < 5; i++) {
      for (let x = 30 + i * 25; x < 95; x += 4) {
        points.push({ x: x * scale, y: (60 + i * 8) * scale });
      }
      for (let x = 105 + i * 25; x < 170; x += 4) {
        points.push({ x: x * scale, y: (60 + i * 8) * scale });
      }
    }
    
    return points;
  }, [size]);

  // 颜色系统
  const colors = ['#00C2FF', '#18FF92', '#8B5CF6', '#FF66C4'];

  // 初始化粒子
  const initializeParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return newParticles;
    
    bookShape.forEach((point, index) => {
      // 粒子从随机位置开始
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      
      newParticles.push({
        x: startX,
        y: startY,
        targetX: point.x + (canvas.width - size) / 2,
        targetY: point.y + (canvas.height - size) / 2,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1,
        color: colors[index % colors.length],
        opacity: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        id: index
      });
    });

    return newParticles;
  }, [bookShape, colors, size]);

  // 鼠标跟踪
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  // 动画循环
  useEffect(() => {
    if (!isVisible) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 设置canvas尺寸
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // 重新初始化粒子位置
      if (particlesRef.current.length > 0) {
        particlesRef.current = initializeParticles();
      }
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // 初始化粒子
    particlesRef.current = initializeParticles();
    startTimeRef.current = Date.now();
    isAnimatingRef.current = true;
    
    // 动画函数
    const animate = () => {
      if (!isAnimatingRef.current) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      // 更新动画阶段
      if (elapsed > 2000 && animationPhase === 'gathering') {
        setAnimationPhase('forming');
      } else if (elapsed > 4000 && animationPhase === 'forming') {
        setAnimationPhase('complete');
        onAnimationComplete?.();
      }

      // 更新和绘制粒子
      particlesRef.current.forEach(particle => {
        // 鼠标排斥效果
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mousePosRef.current.x, 2) + 
          Math.pow(particle.y - mousePosRef.current.y, 2)
        );
        
        if (mouseDistance < 100) {
          const repelForce = (100 - mouseDistance) / 100 * 0.5;
          const angle = Math.atan2(particle.y - mousePosRef.current.y, particle.x - mousePosRef.current.x);
          particle.vx += Math.cos(angle) * repelForce;
          particle.vy += Math.sin(angle) * repelForce;
        }

        // 目标吸引力
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (animationPhase === 'gathering' || animationPhase === 'forming') {
          const attraction = Math.min(0.1, distance * 0.001);
          particle.vx += dx * attraction;
          particle.vy += dy * attraction;
        }

        // 阻尼
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 呼吸效果
        particle.phase += 0.05;
        const breathe = Math.sin(particle.phase) * 0.1 + 0.9;
        
        // 绘制粒子
        ctx.save();
        ctx.globalAlpha = particle.opacity * breathe;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * breathe, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // 开始动画
    animate();
    
    // 添加鼠标监听
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      isAnimatingRef.current = false;
      window.removeEventListener('resize', setCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, initializeParticles, handleMouseMove, animationPhase, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="relative inline-block"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: size, height: size }}
      />
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-white/60 whitespace-nowrap">
        粒子正在聚集...
      </div>
    </motion.div>
  );
}