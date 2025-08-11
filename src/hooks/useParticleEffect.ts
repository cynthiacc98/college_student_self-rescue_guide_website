/**
 * 高性能粒子效果 Hook
 * 支持 Web Workers 和 GPU 优化
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ParticlePhysics, PerformanceMonitor } from '@/utils/particlePhysics';

interface UseParticleEffectOptions {
  particleCount?: number;
  enableMouseInteraction?: boolean;
  enableAutoResize?: boolean;
  enablePerformanceMonitoring?: boolean;
  targetFPS?: number;
}

interface ParticleEffectState {
  fps: number;
  particleCount: number;
  isInitialized: boolean;
}

export function useParticleEffect(options: UseParticleEffectOptions = {}) {
  const {
    particleCount: initialParticleCount,
    enableMouseInteraction = true,
    enableAutoResize = true,
    enablePerformanceMonitoring = true,
    targetFPS = 60
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const physicsRef = useRef<ParticlePhysics>();
  const performanceMonitorRef = useRef<PerformanceMonitor>();
  const lastTimeRef = useRef<number>(0);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);
  
  const [state, setState] = useState<ParticleEffectState>({
    fps: 60,
    particleCount: 0,
    isInitialized: false
  });

  // 动态计算粒子数量（基于设备性能）
  const calculateOptimalParticleCount = useCallback((): number => {
    if (initialParticleCount) return initialParticleCount;
    
    // 基于设备性能和屏幕尺寸动态调整
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const screenArea = typeof window !== 'undefined' 
      ? window.innerWidth * window.innerHeight 
      : 800 * 600;
    
    let baseCount = Math.floor(screenArea / 10000) * 100; // 基础粒子数
    
    // 移动端优化
    if (isMobile) {
      baseCount = Math.min(baseCount * 0.3, 800);
    } else {
      baseCount = Math.min(baseCount, 2500);
    }
    
    // 高分辨率设备调整
    if (pixelRatio > 1.5) {
      baseCount *= 0.7;
    }
    
    return Math.max(500, Math.floor(baseCount));
  }, [initialParticleCount]);

  // 初始化粒子系统
  const initializeParticleSystem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置 canvas 尺寸
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
    }

    // 初始化物理引擎
    if (!physicsRef.current) {
      physicsRef.current = new ParticlePhysics();
    }

    const particleCount = calculateOptimalParticleCount();
    physicsRef.current.initializeParticles(particleCount, canvas);

    setState(prev => ({
      ...prev,
      particleCount,
      isInitialized: true
    }));

    // 启动性能监控
    if (enablePerformanceMonitoring && !performanceMonitorRef.current) {
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.startMonitoring((fps) => {
        setState(prev => ({ ...prev, fps }));
        
        // 动态性能优化
        if (fps < targetFPS * 0.8 && prev.particleCount > 200) {
          const newCount = Math.max(200, Math.floor(prev.particleCount * 0.8));
          physicsRef.current?.adjustParticleCount(newCount);
          setState(current => ({ ...current, particleCount: newCount }));
        }
      });
    }
  }, [calculateOptimalParticleCount, enablePerformanceMonitoring, targetFPS]);

  // 渲染循环
  const renderLoop = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    const physics = physicsRef.current;
    
    if (!canvas || !physics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算 delta time
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // 更新物理状态
    physics.updatePhysics(Math.min(deltaTime * 0.016, 1)); // 限制最大 deltaTime

    // 清空画布
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // 渲染粒子
    const particles = physics.getParticles();
    
    // 使用离屏渲染优化
    particles.forEach(particle => {
      ctx.save();
      
      // 设置粒子样式
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      // 渲染粒子（带光晕效果）
      const gradient = ctx.createRadialGradient(
        particle.position.x, particle.position.y, 0,
        particle.position.x, particle.position.y, particle.size * 3
      );
      
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.4, particle.color + '80');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        particle.position.x,
        particle.position.y,
        particle.size * 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // 核心亮点
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(
        particle.position.x,
        particle.position.y,
        particle.size,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      ctx.restore();
    });

    // 连线效果（仅书本粒子）
    const bookParticles = particles.filter(p => p.isBookParticle);
    if (bookParticles.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#00C2FF';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < bookParticles.length - 1; i++) {
        const p1 = bookParticles[i];
        const p2 = bookParticles[i + 1];
        const distance = Math.sqrt(
          (p1.position.x - p2.position.x) ** 2 + 
          (p1.position.y - p2.position.y) ** 2
        );
        
        if (distance < 80) {
          ctx.beginPath();
          ctx.moveTo(p1.position.x, p1.position.y);
          ctx.lineTo(p2.position.x, p2.position.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 继续动画循环
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, []);

  // 鼠标交互处理
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enableMouseInteraction || !physicsRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    mousePositionRef.current = { x, y };
    
    // 添加鼠标力场
    physicsRef.current.addForceField(x, y, 0.3, 'repel');
  }, [enableMouseInteraction]);

  const handleMouseLeave = useCallback(() => {
    if (!physicsRef.current) return;
    
    mousePositionRef.current = null;
    physicsRef.current.clearForceFields();
  }, []);

  // 触摸事件处理（移动端）
  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    if (!enableMouseInteraction || !physicsRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas || event.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    physicsRef.current.addForceField(x, y, 0.4, 'repel');
  }, [enableMouseInteraction]);

  // 窗口大小调整处理
  const handleResize = useCallback(() => {
    if (!enableAutoResize) return;
    
    // 防抖处理
    setTimeout(() => {
      initializeParticleSystem();
    }, 100);
  }, [enableAutoResize, initializeParticleSystem]);

  // 公开的控制方法
  const triggerPageFlip = useCallback(() => {
    physicsRef.current?.triggerPageFlip();
  }, []);

  const resetParticles = useCallback(() => {
    physicsRef.current?.reset();
  }, []);

  const adjustParticleCount = useCallback((count: number) => {
    physicsRef.current?.adjustParticleCount(count);
    setState(prev => ({ ...prev, particleCount: count }));
  }, []);

  // 初始化和清理
  useEffect(() => {
    initializeParticleSystem();

    // 启动渲染循环
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeParticleSystem, renderLoop]);

  // 添加事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    if (enableAutoResize) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }

      if (enableAutoResize) {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [
    enableMouseInteraction, 
    enableAutoResize, 
    handleMouseMove, 
    handleMouseLeave, 
    handleTouchMove, 
    handleResize
  ]);

  return {
    canvasRef,
    state,
    controls: {
      triggerPageFlip,
      resetParticles,
      adjustParticleCount
    }
  };
}