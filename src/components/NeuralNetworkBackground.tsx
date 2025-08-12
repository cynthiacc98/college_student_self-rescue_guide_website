"use client";

import { useEffect, useRef } from 'react';
import { useAnimationFrame } from 'framer-motion';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  connections: number[];
  activity: number;
}

interface NeuralNetworkBackgroundProps {
  nodeCount?: number;
  connectionDistance?: number;
  pulseSpeed?: number;
  activityDecay?: number;
}

export default function NeuralNetworkBackground({
  nodeCount = 50,
  connectionDistance = 150,
  pulseSpeed = 0.02,
  activityDecay = 0.98
}: NeuralNetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    // 初始化节点
    const initNodes = () => {
      const nodes: Node[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          pulsePhase: Math.random() * Math.PI * 2,
          connections: [],
          activity: 0
        });
      }
      nodesRef.current = nodes;
    };

    // 更新连接
    const updateConnections = () => {
      const nodes = nodesRef.current;
      nodes.forEach((node, i) => {
        node.connections = [];
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - node.x;
          const dy = nodes[j].y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < connectionDistance) {
            node.connections.push(j);
          }
        }
      });
    };

    // 鼠标移动处理
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // 激活附近的节点
      const nodes = nodesRef.current;
      nodes.forEach(node => {
        const dx = e.clientX - node.x;
        const dy = e.clientY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          node.activity = 1;
        }
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [nodeCount, connectionDistance]);

  useAnimationFrame((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nodes = nodesRef.current;
    animationRef.current += pulseSpeed;

    // 更新节点
    nodes.forEach(node => {
      // 更新位置
      node.x += node.vx;
      node.y += node.vy;

      // 边界反弹
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      // 衰减活动
      node.activity *= activityDecay;

      // 更新脉冲相位
      node.pulsePhase += pulseSpeed * (1 + node.activity * 2);
    });

    // 更新连接
    if (animationRef.current % 10 === 0) {
      updateConnections();
    }

    // 绘制连接
    nodes.forEach((node, i) => {
      node.connections.forEach(j => {
        const targetNode = nodes[j];
        const dx = targetNode.x - node.x;
        const dy = targetNode.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(node.x, node.y, targetNode.x, targetNode.y);
        const opacity = Math.max(0, 1 - distance / connectionDistance) * 0.3;
        const activity = (node.activity + targetNode.activity) / 2;
        
        // 根据活动级别改变颜色
        if (activity > 0.5) {
          gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity + activity * 0.5})`);
          gradient.addColorStop(0.5, `rgba(236, 72, 153, ${opacity + activity * 0.5})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity + activity * 0.5})`);
        } else {
          gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity})`);
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + activity * 2;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // 绘制脉冲
        if (activity > 0.1) {
          const pulseX = node.x + (targetNode.x - node.x) * ((Math.sin(animationRef.current * 3) + 1) / 2);
          const pulseY = node.y + (targetNode.y - node.y) * ((Math.sin(animationRef.current * 3) + 1) / 2);
          
          ctx.fillStyle = `rgba(236, 72, 153, ${activity})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // 绘制节点
    nodes.forEach(node => {
      const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
      const size = node.radius + pulse * 2 + node.activity * 5;
      
      // 外发光
      if (node.activity > 0.1) {
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
        glowGradient.addColorStop(0, `rgba(236, 72, 153, ${node.activity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 节点核心
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`);
      gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.6 + pulse * 0.2})`);
      gradient.addColorStop(1, `rgba(59, 130, 246, ${0.3 + pulse * 0.2})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60"
      style={{ zIndex: 1 }}
    />
  );
}