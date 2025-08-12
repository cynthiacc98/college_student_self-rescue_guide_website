"use client";

import { useEffect, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
  color: string;
}

interface QuantumWaveEffectProps {
  waveCount?: number;
  maxWaveRadius?: number;
  waveSpeed?: number;
}

export default function QuantumWaveEffect({
  waveCount = 5,
  maxWaveRadius = 300,
  waveSpeed = 2
}: QuantumWaveEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesRef = useRef<Wave[]>([]);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, clicked: false });

  const colors = [
    'rgba(139, 92, 246, ', // purple
    'rgba(236, 72, 153, ', // pink
    'rgba(59, 130, 246, ',  // blue
    'rgba(16, 185, 129, ', // emerald
    'rgba(251, 146, 60, '  // orange
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
    };

    // 创建新波
    const createWave = (x: number, y: number) => {
      if (wavesRef.current.length >= waveCount) {
        wavesRef.current.shift(); // 移除最旧的波
      }
      
      wavesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: maxWaveRadius + Math.random() * 100,
        speed: waveSpeed + Math.random() * 2,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    // 鼠标事件处理
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.clicked = true;
      createWave(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      mouseRef.current.clicked = false;
    };

    resizeCanvas();
    
    // 自动生成波
    const autoWaveInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        createWave(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        );
      }
    }, 2000);

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(autoWaveInterval);
    };
  }, [waveCount, maxWaveRadius, waveSpeed]);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.01;

    // 清空画布 - 完全透明
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 移除量子网格，保持背景干净

    // 更新和绘制波
    wavesRef.current = wavesRef.current.filter(wave => {
      wave.radius += wave.speed;
      wave.opacity = Math.max(0, 1 - wave.radius / wave.maxRadius);

      if (wave.opacity <= 0) return false;

      // 绘制多层波纹
      for (let i = 0; i < 3; i++) {
        const layerRadius = wave.radius - i * 20;
        if (layerRadius > 0) {
          const layerOpacity = wave.opacity * (1 - i * 0.3);
          
          // 波纹边界
          ctx.strokeStyle = wave.color + layerOpacity + ')';
          ctx.lineWidth = 2 - i * 0.5;
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, layerRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 内部渐变
          const innerGradient = ctx.createRadialGradient(
            wave.x, wave.y, layerRadius * 0.5,
            wave.x, wave.y, layerRadius
          );
          innerGradient.addColorStop(0, wave.color + '0)');
          innerGradient.addColorStop(0.5, wave.color + (layerOpacity * 0.1) + ')');
          innerGradient.addColorStop(1, wave.color + '0)');
          
          ctx.fillStyle = innerGradient;
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, layerRadius, 0, Math.PI * 2);
          ctx.fill();

          // 量子粒子
          const particleCount = Math.floor(layerRadius / 10);
          for (let j = 0; j < particleCount; j++) {
            const angle = (j / particleCount) * Math.PI * 2 + timeRef.current;
            const px = wave.x + Math.cos(angle) * layerRadius;
            const py = wave.y + Math.sin(angle) * layerRadius;
            
            ctx.fillStyle = wave.color + (layerOpacity * 0.5) + ')';
            ctx.beginPath();
            ctx.arc(px, py, 1 + Math.sin(timeRef.current * 10 + j) * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      return true;
    });

    // 鼠标交互效果
    if (mouseRef.current.clicked) {
      // 创建连续波
      if (Math.random() > 0.7) {
        wavesRef.current.push({
          x: mouseRef.current.x + (Math.random() - 0.5) * 50,
          y: mouseRef.current.y + (Math.random() - 0.5) * 50,
          radius: 0,
          maxRadius: 100 + Math.random() * 50,
          speed: 3 + Math.random() * 2,
          opacity: 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    // 绘制鼠标光标效果
    const cursorGradient = ctx.createRadialGradient(
      mouseRef.current.x, mouseRef.current.y, 0,
      mouseRef.current.x, mouseRef.current.y, 50
    );
    cursorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    cursorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = cursorGradient;
    ctx.beginPath();
    ctx.arc(mouseRef.current.x, mouseRef.current.y, 50, 0, Math.PI * 2);
    ctx.fill();
  });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto opacity-50"
      style={{ zIndex: 2, mixBlendMode: 'screen' }}
    />
  );
}