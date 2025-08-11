"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  phase: number;
  id: number;
  pageIndex: number; // 0=左页, 1=右页
  depth: number; // 3D深度
  rotationX: number;
  rotationY: number;
  isReturning: boolean;
}

interface AdvancedParticleBookAnimationProps {
  width?: number;
  height?: number;
  particleCount?: number;
  enableMouseInteraction?: boolean;
  onAnimationComplete?: () => void;
}

export default function AdvancedParticleBookAnimation({
  width = 800,
  height = 600,
  particleCount = 1200,
  enableMouseInteraction = true,
  onAnimationComplete
}: AdvancedParticleBookAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const isAnimatingRef = useRef(false);
  const [animationPhase, setAnimationPhase] = useState<'gathering' | 'forming' | 'opening' | 'complete'>('gathering');
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 颜色系统 - 更丰富的渐变色彩
  const colors = useMemo(() => [
    '#00C2FF', // 青蓝
    '#18FF92', // 翠绿
    '#8B5CF6', // 紫色
    '#FF66C4', // 粉色
    '#FFD700', // 金色
    '#FF6B6B', // 珊瑚红
    '#4ECDC4', // 青色
    '#45B7D1'  // 天蓝
  ], []);

  // 生成立体书本形状
  const generateBookShape = useCallback(() => {
    const points: Array<{x: number, y: number, pageIndex: number, depth: number}> = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const bookWidth = Math.min(width * 0.5, 350);
    const bookHeight = Math.min(height * 0.6, 280);
    
    // 书本厚度和页面间距
    const thickness = 15;
    const pageGap = 6;
    
    // 生成左页（更细致的分布）
    for (let row = 0; row < 18; row++) {
      for (let col = 0; col < 14; col++) {
        const x = centerX - bookWidth/2 + (col / 13) * (bookWidth/2 - pageGap);
        const y = centerY - bookHeight/2 + (row / 17) * bookHeight;
        const depth = Math.random() * thickness;
        
        // 主体点
        points.push({ x, y, pageIndex: 0, depth });
        
        // 文本线条（模拟真实书页）
        if (row > 1 && row < 16 && col > 0 && col < 12 && row % 3 === 1) {
          for (let lineCol = col; lineCol < Math.min(col + 8, 12); lineCol++) {
            const lineX = centerX - bookWidth/2 + (lineCol / 13) * (bookWidth/2 - pageGap);
            if (Math.random() > 0.3) { // 随机空白，模拟真实文本
              points.push({ x: lineX + Math.random() * 2 - 1, y: y + Math.random() * 1 - 0.5, pageIndex: 0, depth: depth + Math.random() * 3 });
            }
          }
        }
        
        // 段落间距
        if (row > 3 && row < 14 && col > 1 && col < 8 && (row - 3) % 4 === 0) {
          const paragraphY = y + 8;
          for (let pCol = col; pCol < col + 6; pCol++) {
            const pX = centerX - bookWidth/2 + (pCol / 13) * (bookWidth/2 - pageGap);
            points.push({ x: pX, y: paragraphY, pageIndex: 0, depth: depth + 2 });
          }
        }
      }
    }
    
    // 生成右页
    for (let row = 0; row < 18; row++) {
      for (let col = 0; col < 14; col++) {
        const x = centerX + pageGap + (col / 13) * (bookWidth/2 - pageGap);
        const y = centerY - bookHeight/2 + (row / 17) * bookHeight;
        const depth = Math.random() * thickness;
        
        // 主体点
        points.push({ x, y, pageIndex: 1, depth });
        
        // 文本线条
        if (row > 1 && row < 16 && col > 0 && col < 12 && row % 3 === 1) {
          for (let lineCol = col; lineCol < Math.min(col + 8, 12); lineCol++) {
            const lineX = centerX + pageGap + (lineCol / 13) * (bookWidth/2 - pageGap);
            if (Math.random() > 0.3) {
              points.push({ x: lineX + Math.random() * 2 - 1, y: y + Math.random() * 1 - 0.5, pageIndex: 1, depth: depth + Math.random() * 3 });
            }
          }
        }
        
        // 段落间距
        if (row > 3 && row < 14 && col > 1 && col < 8 && (row - 3) % 4 === 0) {
          const paragraphY = y + 8;
          for (let pCol = col; pCol < col + 6; pCol++) {
            const pX = centerX + pageGap + (pCol / 13) * (bookWidth/2 - pageGap);
            points.push({ x: pX, y: paragraphY, pageIndex: 1, depth: depth + 2 });
          }
        }
      }
    }
    
    // 书脊（更细致）
    for (let i = 0; i < 40; i++) {
      const x = centerX + Math.random() * 3 - 1.5;
      const y = centerY - bookHeight/2 + (i / 39) * bookHeight;
      const depth = thickness + Math.random() * 8;
      points.push({ x, y, pageIndex: 0.5, depth });
    }
    
    // 书本边框（增强边缘效果）
    // 上边框
    for (let i = 0; i < bookWidth; i += 3) {
      const x = centerX - bookWidth/2 + i;
      const y = centerY - bookHeight/2;
      points.push({ x, y, pageIndex: i < bookWidth/2 ? 0 : 1, depth: thickness * 0.8 });
    }
    // 下边框
    for (let i = 0; i < bookWidth; i += 3) {
      const x = centerX - bookWidth/2 + i;
      const y = centerY + bookHeight/2;
      points.push({ x, y, pageIndex: i < bookWidth/2 ? 0 : 1, depth: thickness * 0.8 });
    }
    // 左边框
    for (let i = 0; i < bookHeight; i += 3) {
      const x = centerX - bookWidth/2;
      const y = centerY - bookHeight/2 + i;
      points.push({ x, y, pageIndex: 0, depth: thickness * 0.9 });
    }
    // 右边框
    for (let i = 0; i < bookHeight; i += 3) {
      const x = centerX + bookWidth/2;
      const y = centerY - bookHeight/2 + i;
      points.push({ x, y, pageIndex: 1, depth: thickness * 0.9 });
    }
    
    return points;
  }, [width, height]);

  // 初始化粒子系统
  const initializeParticles = useCallback(() => {
    const bookPoints = generateBookShape();
    const particles: Particle[] = [];
    
    // 根据设备调整粒子数量
    const actualParticleCount = isMobile ? Math.min(particleCount * 0.6, 800) : particleCount;
    
    for (let i = 0; i < actualParticleCount; i++) {
      const targetPoint = bookPoints[i % bookPoints.length];
      
      // 粒子从四周随机位置开始
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(width, height) * 0.8;
      const startX = width/2 + Math.cos(angle) * distance;
      const startY = height/2 + Math.sin(angle) * distance;
      
      particles.push({
        x: startX,
        y: startY,
        originX: startX,
        originY: startY,
        targetX: targetPoint.x,
        targetY: targetPoint.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2.5 + 1,
        color: colors[i % colors.length],
        opacity: Math.random() * 0.4 + 0.6,
        phase: Math.random() * Math.PI * 2,
        id: i,
        pageIndex: targetPoint.pageIndex,
        depth: targetPoint.depth,
        rotationX: 0,
        rotationY: 0,
        isReturning: false
      });
    }
    
    return particles;
  }, [generateBookShape, colors, particleCount, width, height, isMobile]);

  // 鼠标交互处理
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enableMouseInteraction || isMobile) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, [enableMouseInteraction, isMobile]);

  // 主动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置canvas尺寸
    canvas.width = width;
    canvas.height = height;
    
    // 初始化粒子
    particlesRef.current = initializeParticles();
    startTimeRef.current = Date.now();
    isAnimatingRef.current = true;
    
    const animate = () => {
      if (!isAnimatingRef.current) return;
      
      // 清空画布，添加优雅的拖尾效果
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#0B1221';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      // 动画阶段控制（更精细的时间控制）
      let currentPhase = animationPhase;
      if (elapsed > 2000 && currentPhase === 'gathering') {
        currentPhase = 'forming';
        setAnimationPhase('forming');
      } else if (elapsed > 4000 && currentPhase === 'forming') {
        currentPhase = 'opening';
        setAnimationPhase('opening');
      } else if (elapsed > 6000 && currentPhase === 'opening') {
        currentPhase = 'complete';
        setAnimationPhase('complete');
        onAnimationComplete?.();
      }
      
      // 更新和渲染粒子
      particlesRef.current.forEach(particle => {
        // 鼠标排斥效果 (仅桌面端)
        if (enableMouseInteraction && !isMobile) {
          const mouseDistance = Math.sqrt(
            Math.pow(particle.x - mousePosRef.current.x, 2) + 
            Math.pow(particle.y - mousePosRef.current.y, 2)
          );
          
          if (mouseDistance < 120) {
            const repelForce = (120 - mouseDistance) / 120 * 1.2;
            const angle = Math.atan2(particle.y - mousePosRef.current.y, particle.x - mousePosRef.current.x);
            particle.vx += Math.cos(angle) * repelForce;
            particle.vy += Math.sin(angle) * repelForce;
            particle.isReturning = true;
          }
        }
        
        // 目标吸引力
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (currentPhase === 'gathering') {
          // 聚集阶段：强吸引力 + 旋转聚集
          const gatheringForce = Math.min(0.12, distance * 0.003);
          const spiralAngle = elapsed * 0.001 + particle.id * 0.1;
          const spiralRadius = distance * 0.1;
          
          particle.vx += dx * gatheringForce + Math.cos(spiralAngle) * spiralRadius * 0.001;
          particle.vy += dy * gatheringForce + Math.sin(spiralAngle) * spiralRadius * 0.001;
        } else if (currentPhase === 'forming') {
          // 成型阶段：精准定位
          const formingForce = Math.min(0.18, distance * 0.004);
          particle.vx += dx * formingForce;
          particle.vy += dy * formingForce;
        } else if (particle.isReturning) {
          // 鼠标交互后的回归
          const returnForce = Math.min(0.1, distance * 0.002);
          particle.vx += dx * returnForce;
          particle.vy += dy * returnForce;
          
          if (distance < 8) {
            particle.isReturning = false;
          }
        }
        
        // 书页打开效果（增强3D效果）
        if (currentPhase === 'opening') {
          const openingProgress = Math.min(1, (elapsed - 3000) / 1500);
          const openingAngle = openingProgress * 0.4;
          const openingDistance = openingProgress * 30;
          
          if (particle.pageIndex === 0) {
            // 左页向左打开
            particle.targetX -= openingDistance;
            particle.rotationY = -openingAngle;
            particle.rotationX = Math.sin(openingProgress * Math.PI) * 0.1;
          } else if (particle.pageIndex === 1) {
            // 右页向右打开
            particle.targetX += openingDistance;
            particle.rotationY = openingAngle;
            particle.rotationX = Math.sin(openingProgress * Math.PI) * 0.1;
          } else if (particle.pageIndex === 0.5) {
            // 书脊保持中心
            particle.rotationX = Math.sin(openingProgress * Math.PI) * 0.05;
          }
        }
        
        // 物理更新
        particle.vx *= 0.92; // 阻尼
        particle.vy *= 0.92;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 3D呼吸和闪烁效果
        particle.phase += 0.03 + Math.sin(elapsed * 0.001) * 0.02;
        const breathe = Math.sin(particle.phase) * 0.15 + 0.85;
        const sparkle = Math.sin(particle.phase * 2) * 0.1 + 0.9;
        
        // 增强3D透视计算
        const perspective = 1000;
        const rotationYSin = Math.sin(particle.rotationY);
        const rotationXSin = Math.sin(particle.rotationX);
        const rotatedX = particle.x + rotationYSin * particle.depth * 0.12;
        const rotatedY = particle.y + rotationXSin * particle.depth * 0.06;
        const scale = Math.max(0.3, perspective / (perspective + particle.depth * 1.5));
        
        // 动態3D阴影效果
        const shadowOffset = particle.depth * 0.08 + Math.sin(elapsed * 0.002) * 2;
        const shadowOpacity = Math.max(0, (0.4 - particle.depth * 0.015) * scale);
        
        // 渲染粒子
        ctx.save();
        ctx.globalAlpha = particle.opacity * breathe * sparkle;
        
        // 动態发光效果
        const glowIntensity = breathe * sparkle * scale;
        const glowSize = particle.size * glowIntensity * 5;
        
        // 增强发光渲染
        if (glowSize > 1) {
          const gradient = ctx.createRadialGradient(
            rotatedX, rotatedY, 0,
            rotatedX, rotatedY, glowSize
          );
          
          // 动态色彩微调
          const hueShift = Math.sin(elapsed * 0.0008 + particle.phase) * 15;
          const alpha = Math.floor((particle.opacity * glowIntensity) * 255);
          const coreAlpha = Math.floor(alpha * 0.8);
          const edgeAlpha = Math.floor(alpha * 0.3);
          
          gradient.addColorStop(0, particle.color + Math.max(10, coreAlpha).toString(16).padStart(2, '0'));
          gradient.addColorStop(0.3, particle.color + Math.max(5, edgeAlpha).toString(16).padStart(2, '0'));
          gradient.addColorStop(0.7, particle.color + '10');
          gradient.addColorStop(1, particle.color + '00');
          
          ctx.save();
          ctx.globalCompositeOperation = 'screen'; // 增强发光效果
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(rotatedX, rotatedY, glowSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        // 绘制动態阴影（增强3D效果）
        if (shadowOpacity > 0.05) {
          ctx.save();
          ctx.globalAlpha = shadowOpacity * 0.4;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.filter = 'blur(2px)';
          ctx.beginPath();
          ctx.arc(rotatedX + shadowOffset, rotatedY + shadowOffset, particle.size * breathe * scale * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        // 绘制高品质核心粒子
        ctx.save();
        ctx.globalAlpha = particle.opacity * sparkle * scale;
        
        // 核心发光
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 核心颜色渲变
        const coreGradient = ctx.createRadialGradient(
          rotatedX, rotatedY, 0,
          rotatedX, rotatedY, particle.size * breathe * scale
        );
        const coreIntensity = Math.floor((sparkle * 255));
        coreGradient.addColorStop(0, '#FFFFFF' + coreIntensity.toString(16).padStart(2, '0'));
        coreGradient.addColorStop(0.4, particle.color + 'FF');
        coreGradient.addColorStop(1, particle.color + '80');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(rotatedX, rotatedY, particle.size * breathe * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.restore();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // 启动动画
    animate();
    
    // 添加事件监听
    if (enableMouseInteraction && !isMobile) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      isAnimatingRef.current = false;
      if (enableMouseInteraction && !isMobile) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, initializeParticles, handleMouseMove, enableMouseInteraction, isMobile, animationPhase, onAnimationComplete]);

  // 获取动画状态文本
  const getStatusText = () => {
    switch (animationPhase) {
      case 'gathering': return '粒子汇聚中...';
      case 'forming': return '书本成型中...';
      case 'opening': return '书页展开中...';
      case 'complete': return '知识之门已开启';
      default: return '';
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block rounded-lg"
style={{ 
          background: 'transparent',
          filter: 'contrast(1.1) brightness(1.1)'
        }}
      />
      
      {/* 状态指示器 */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
        animate={{ opacity: animationPhase === 'complete' ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/10">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-sm text-white/70 font-medium">
            {getStatusText()}
          </span>
        </div>
      </motion.div>
      
      {/* 粒子计数器 (开发调试用) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 text-xs text-white/50 bg-black/20 px-2 py-1 rounded">
          {particlesRef.current.length} 粒子 | {isMobile ? '移动端' : '桌面端'}
        </div>
      )}
    </motion.div>
  );
}