"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 动态导入高级组件，避免SSR问题
const StarfieldBackground = dynamic(() => import("./StarfieldBackground"), {
  ssr: false,
  loading: () => null
});

const NeuralNetworkBackground = dynamic(() => import("./NeuralNetworkBackground"), { 
  ssr: false,
  loading: () => null
});

const QuantumWaveEffect = dynamic(() => import("./QuantumWaveEffect"), { 
  ssr: false,
  loading: () => null
});

const IntelligentCursor = dynamic(() => import("./IntelligentCursor"), { 
  ssr: false,
  loading: () => null
});

export default function AdvancedEffectsWrapper() {
  const [showEffects, setShowEffects] = useState(false);
  const [effectsLevel, setEffectsLevel] = useState<'full' | 'reduced' | 'minimal'>('full');

  useEffect(() => {
    // 检测设备性能
    const checkPerformance = () => {
      // 检查设备内存
      const memory = (navigator as any).deviceMemory;
      // 检查CPU核心数
      const cores = navigator.hardwareConcurrency;
      
      // 根据设备性能调整效果级别
      if (memory && memory < 4) {
        setEffectsLevel('minimal');
      } else if (cores && cores < 4) {
        setEffectsLevel('reduced');
      } else {
        setEffectsLevel('full');
      }
    };

    checkPerformance();

    // 延迟加载效果，优化初始渲染
    const timer = setTimeout(() => {
      setShowEffects(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!showEffects) return null;

  return (
    <>
      {/* 星空背景 - 所有设备都显示 */}
      <StarfieldBackground 
        starCount={effectsLevel === 'full' ? 200 : effectsLevel === 'reduced' ? 100 : 50}
        shootingStarInterval={3000}
        speed={0.5}
      />
      
      {/* 神经网络背景 - 中高性能设备显示 */}
      {effectsLevel !== 'minimal' && (
        <NeuralNetworkBackground 
          nodeCount={effectsLevel === 'full' ? 30 : 20}
          connectionDistance={effectsLevel === 'full' ? 200 : 150}
          pulseSpeed={0.02}
          activityDecay={0.98}
        />
      )}
      
      {/* 量子波动效果 - 仅在高性能设备显示 */}
      {effectsLevel === 'full' && (
        <QuantumWaveEffect 
          waveCount={5}
          maxWaveRadius={300}
          waveSpeed={2}
        />
      )}
      
      {/* 智能光标 - 仅在高性能设备显示 */}
      {effectsLevel === 'full' && (
        <IntelligentCursor />
      )}

      {/* 性能指示器 */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-xl rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${
            effectsLevel === 'full' ? 'bg-green-400' : 
            effectsLevel === 'reduced' ? 'bg-yellow-400' : 
            'bg-red-400'
          } animate-pulse`} />
          <span className="text-xs text-white/50">
            {effectsLevel === 'full' ? '高级效果' : 
             effectsLevel === 'reduced' ? '标准效果' : 
             '基础效果'}
          </span>
        </div>
      </div>
    </>
  );
}