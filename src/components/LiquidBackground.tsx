"use client";

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 鼠标移动监听
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 液态球体类
    class LiquidBlob {
      x: number;
      y: number;
      baseRadius: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      points: { x: number; y: number; angle: number; distance: number }[];
      mouseInfluence: number;

      constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.baseRadius = radius;
        this.radius = radius;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = color;
        this.mouseInfluence = 0;
        
        // 创建液态形状的控制点
        this.points = [];
        const numPoints = 12;
        for (let i = 0; i < numPoints; i++) {
          const angle = (Math.PI * 2 * i) / numPoints;
          this.points.push({
            x: 0,
            y: 0,
            angle: angle,
            distance: radius
          });
        }
      }

      update(mouse: { x: number; y: number }, canvas: HTMLCanvasElement) {
        // 鼠标交互
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
          const force = (200 - distance) / 200;
          this.mouseInfluence = force;
          
          // 推开效果
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 0.2;
          this.vy -= Math.sin(angle) * force * 0.2;
        } else {
          this.mouseInfluence *= 0.95;
        }

        // 更新位置
        this.x += this.vx;
        this.y += this.vy;

        // 速度衰减
        this.vx *= 0.99;
        this.vy *= 0.99;

        // 边界反弹
        if (this.x < this.radius || this.x > canvas.width - this.radius) {
          this.vx *= -0.8;
          this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > canvas.height - this.radius) {
          this.vy *= -0.8;
          this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }

        // 更新液态形状
        const time = Date.now() * 0.001;
        this.points.forEach((point, i) => {
          const noise = Math.sin(time * 2 + i) * 5;
          const influence = Math.sin(time * 3 + i * 0.5) * this.mouseInfluence * 20;
          point.distance = this.baseRadius + noise + influence;
          
          point.x = this.x + Math.cos(point.angle) * point.distance;
          point.y = this.y + Math.sin(point.angle) * point.distance;
        });
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        
        // 使用贝塞尔曲线创建平滑的液态形状
        const points = this.points;
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length; i++) {
          const next = points[(i + 1) % points.length];
          const mid = points[(i + 2) % points.length];
          
          const cp1x = (points[i].x + next.x) / 2;
          const cp1y = (points[i].y + next.y) / 2;
          const cp2x = (next.x + mid.x) / 2;
          const cp2y = (next.y + mid.y) / 2;
          
          ctx.quadraticCurveTo(cp1x, cp1y, cp2x, cp2y);
        }
        
        ctx.closePath();
        
        // 渐变填充
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 2
        );
        
        const alpha = 0.15 + this.mouseInfluence * 0.1;
        gradient.addColorStop(0, this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, this.color + '40');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 发光边缘
        ctx.strokeStyle = this.color + '60';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 创建液态球体
    const blobs: LiquidBlob[] = [
      new LiquidBlob(canvas.width * 0.3, canvas.height * 0.3, 150, '#8B5CF6'),
      new LiquidBlob(canvas.width * 0.7, canvas.height * 0.4, 120, '#00D4FF'),
      new LiquidBlob(canvas.width * 0.5, canvas.height * 0.7, 100, '#FF69B4'),
      new LiquidBlob(canvas.width * 0.2, canvas.height * 0.6, 80, '#18FF92'),
      new LiquidBlob(canvas.width * 0.8, canvas.height * 0.2, 90, '#FFB800'),
    ];

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新和绘制所有球体
      blobs.forEach(blob => {
        blob.update(mouseRef.current, canvas);
        blob.draw(ctx);
      });
      
      // 混合模式
      ctx.globalCompositeOperation = 'screen';
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        filter: 'blur(40px)',
        opacity: 0.7,
        mixBlendMode: 'screen'
      }}
    />
  );
}