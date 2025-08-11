/**
 * 粒子系统组件
 * 支持书本3D聚合动画、鼠标交互和性能优化
 */

"use client";

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParticleEffect } from '@/hooks/useParticleEffect';

interface ParticleSystemProps {
  className?: string;
  particleCount?: number;
  enableMouseInteraction?: boolean;
  enableBookAnimation?: boolean;
  enablePerformanceDisplay?: boolean;
  autoTriggerPageFlip?: boolean;
  style?: React.CSSProperties;
}

const ParticleSystem = memo(function ParticleSystem({
  className = '',
  particleCount,
  enableMouseInteraction = true,
  enableBookAnimation = true,
  enablePerformanceDisplay = false,
  autoTriggerPageFlip = true,
  style
}: ParticleSystemProps) {
  const [mounted, setMounted] = useState(false);
  const [showPerformance, setShowPerformance] = useState(enablePerformanceDisplay);

  const { canvasRef, state, controls } = useParticleEffect({
    particleCount,
    enableMouseInteraction,
    enableAutoResize: true,
    enablePerformanceMonitoring: true,
    targetFPS: 60
  });

  // 防止 SSR 问题
  useEffect(() => {
    setMounted(true);
  }, []);

  // 自动触发翻页动画
  useEffect(() => {
    if (!autoTriggerPageFlip || !enableBookAnimation) return;

    const interval = setInterval(() => {
      controls.triggerPageFlip();
    }, 8000); // 每8秒触发一次翻页

    return () => clearInterval(interval);
  }, [autoTriggerPageFlip, enableBookAnimation, controls]);

  // 性能优化：低FPS时自动降级
  useEffect(() => {
    if (state.fps < 30 && state.particleCount > 500) {
      console.log('Performance optimization: reducing particle count');
      controls.adjustParticleCount(Math.max(300, Math.floor(state.particleCount * 0.7)));
    }
  }, [state.fps, state.particleCount, controls]);

  if (!mounted) {
    return (
      <div 
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={style}
      >
        {/* Loading placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={style}
    >
      {/* 主粒子画布 */}
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-auto cursor-none"
        style={{
          width: '100%',
          height: '100%',
          mixBlendMode: 'screen' // 提升视觉效果
        }}
      />

      {/* 交互提示 */}
      {enableMouseInteraction && (
        <motion.div
          className="absolute bottom-6 right-6 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <div className="px-4 py-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
            <p className="text-xs text-white/70 flex items-center gap-2">
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ✨
              </motion.span>
              移动鼠标体验粒子交互
            </p>
          </div>
        </motion.div>
      )}

      {/* 性能显示器 */}
      {showPerformance && state.isInitialized && (
        <motion.div
          className="absolute top-6 right-6 pointer-events-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10">
            <div className="space-y-1 text-xs text-white/90">
              <div className="flex justify-between gap-3">
                <span>FPS:</span>
                <span className={state.fps >= 50 ? 'text-green-400' : state.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                  {state.fps}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>粒子数:</span>
                <span className="text-cyan-400">{state.particleCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>状态:</span>
                <span className="text-green-400">运行中</span>
              </div>
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowPerformance(false)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full text-xs text-white flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* 控制面板（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          className="absolute bottom-6 left-6 pointer-events-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10">
            <div className="flex gap-2">
              <button
                onClick={controls.triggerPageFlip}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs transition-colors"
                title="触发翻页动画"
              >
                翻页
              </button>
              <button
                onClick={controls.resetParticles}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs transition-colors"
                title="重置粒子"
              >
                重置
              </button>
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs transition-colors"
                title="切换性能显示"
              >
                {showPerformance ? '隐藏' : '性能'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 鼠标跟随光晕 */}
      {enableMouseInteraction && (
        <motion.div
          className="fixed w-32 h-32 pointer-events-none z-50"
          style={{
            background: 'radial-gradient(circle, rgba(0,194,255,0.1) 0%, transparent 70%)',
            filter: 'blur(20px)',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <style jsx>{`
        canvas {
          image-rendering: -moz-crisp-edges;
          image-rendering: -webkit-crisp-edges;
          image-rendering: pixelated;
        }
        
        @media (max-width: 768px) {
          canvas {
            touch-action: pan-x pan-y;
          }
        }
      `}</style>
    </div>
  );
});

export default ParticleSystem;