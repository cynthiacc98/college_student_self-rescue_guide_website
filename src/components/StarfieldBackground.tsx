"use client";

import { useEffect, useRef } from 'react';
import { useAnimationFrame } from 'framer-motion';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  speed: number;
}

interface StarfieldBackgroundProps {
  starCount?: number;
  shootingStarInterval?: number;
  speed?: number;
}

export default function StarfieldBackground({
  starCount = 200,
  shootingStarInterval = 3000,
  speed = 0.5
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  const starColors = [
    'rgba(255, 255, 255, ',
    'rgba(200, 220, 255, ', // 蓝白色
    'rgba(255, 230, 200, ', // 暖白色
    'rgba(200, 255, 220, ', // 青白色
    'rgba(255, 200, 230, ', // 粉白色
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    // 初始化星星
    const initStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          size: Math.random() * 2 + 0.5,
          brightness: Math.random(),
          twinkleSpeed: Math.random() * 0.05 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
      starsRef.current = stars;
    };

    // 创建流星
    const createShootingStar = () => {
      const side = Math.random() < 0.5 ? 'left' : 'top';
      const star: ShootingStar = {
        x: side === 'left' ? 0 : Math.random() * canvas.width,
        y: side === 'top' ? 0 : Math.random() * canvas.height,
        vx: (Math.random() * 3 + 2) * (side === 'left' ? 1 : 0.5),
        vy: (Math.random() * 3 + 2) * (side === 'top' ? 1 : 0.5),
        length: Math.random() * 80 + 40,
        opacity: 1,
        speed: Math.random() * 2 + 3
      };
      shootingStarsRef.current.push(star);
    };

    // 鼠标移动处理
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resizeCanvas();
    
    // 定期创建流星
    const shootingStarTimer = setInterval(() => {
      if (Math.random() > 0.3) {
        createShootingStar();
      }
    }, shootingStarInterval);

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(shootingStarTimer);
    };
  }, [starCount, shootingStarInterval]);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.01;

    // 创建渐变背景
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    bgGradient.addColorStop(0, 'rgba(0, 0, 20, 0.95)');
    bgGradient.addColorStop(0.5, 'rgba(0, 0, 10, 0.98)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加星云效果
    const nebulaGradient = ctx.createRadialGradient(
      mouseRef.current.x, mouseRef.current.y, 0,
      mouseRef.current.x, mouseRef.current.y, 300
    );
    nebulaGradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    nebulaGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.03)');
    nebulaGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制星星
    starsRef.current.forEach(star => {
      // 更新星星位置（3D效果）
      star.z -= speed;
      if (star.z <= 0) {
        star.z = 1000;
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }

      // 计算屏幕位置
      const screenX = (star.x - canvas.width / 2) * (1000 / star.z) + canvas.width / 2;
      const screenY = (star.y - canvas.height / 2) * (1000 / star.z) + canvas.height / 2;
      const size = star.size * (1000 - star.z) / 1000;

      // 闪烁效果
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.5 + 0.5;
      const brightness = star.brightness * twinkle;

      // 绘制星星光晕
      const glowGradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, size * 4
      );
      glowGradient.addColorStop(0, star.color + brightness + ')');
      glowGradient.addColorStop(0.5, star.color + (brightness * 0.5) + ')');
      glowGradient.addColorStop(1, star.color + '0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
      ctx.fill();

      // 绘制星星核心
      ctx.fillStyle = star.color + '1)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();

      // 添加十字光芒（对于亮星）
      if (brightness > 0.7 && size > 1) {
        ctx.strokeStyle = star.color + (brightness * 0.5) + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX - size * 3, screenY);
        ctx.lineTo(screenX + size * 3, screenY);
        ctx.moveTo(screenX, screenY - size * 3);
        ctx.lineTo(screenX, screenY + size * 3);
        ctx.stroke();
      }
    });

    // 绘制流星
    shootingStarsRef.current = shootingStarsRef.current.filter(star => {
      star.x += star.vx * star.speed;
      star.y += star.vy * star.speed;
      star.opacity -= 0.01;

      if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
        return false;
      }

      // 绘制流星轨迹
      const gradient = ctx.createLinearGradient(
        star.x, star.y,
        star.x - star.vx * star.length,
        star.y - star.vy * star.length
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 220, 255, ${star.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - star.vx * star.length, star.y - star.vy * star.length);
      ctx.stroke();

      // 流星头部光晕
      const headGlow = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, 10
      );
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      headGlow.addColorStop(0.5, `rgba(200, 220, 255, ${star.opacity * 0.5})`);
      headGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 10, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });
  });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}