"use client";

import { memo, useMemo, useCallback, useState, useRef, useEffect, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useInView, type Transition } from "framer-motion";
import { ArrowRight, Sparkles, Zap, BookOpen, Search, Grid3X3, TrendingUp, Users, Palette } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

// 性能优化：动态导入重型组件
const ParticleSystem = dynamic(() => import("@/components/ParticleSystem"), {
  ssr: false,
  loading: () => null
});

const AdvancedParticleBookAnimation = dynamic(
  () => import("@/components/AdvancedParticleBookAnimation"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[400px] h-[300px] bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-lg" />
    )
  }
);

const MagneticButtonEnhanced = dynamic(
  () => import("@/components/MagneticButtonEnhanced"),
  {
    ssr: false,
    loading: () => (
      <a
        href="/search"
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold hover:scale-105 transition-transform"
      >
        <Search className="w-5 h-5" />
        <span>立即搜索</span>
        <ArrowRight className="w-5 h-5" />
      </a>
    )
  }
);

interface HomeHeroProps {
  siteName: string;
  siteDescription: string;
}

// 防抖函数
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const HomeHeroOptimized = memo(function HomeHeroOptimized({ siteName, siteDescription }: HomeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 性能优化：减少状态数量
  const [mounted, setMounted] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isLowPerformance: false,
    enableAnimations: true
  });
  const [paletteIdx, setPaletteIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const cached = window.localStorage.getItem("hero_palette_idx");
    return cached ? Number(cached) : 0;
  });

  // 性能优化：使用 useMemo 缓存调色板
  const palettes = useMemo(() => [
    ["#00C2FF", "#18FF92", "#8B5CF6", "#FF66C4"], // Ocean Neon
    ["#FF8A00", "#FF3D54", "#5B5FFF", "#00E1FF"], // Sunset Prism
    ["#22D3EE", "#A78BFA", "#F472B6", "#34D399"],  // Aurora Soft
  ], []);
  
  const palette = useMemo(() => 
    palettes[paletteIdx % palettes.length], 
    [palettes, paletteIdx]
  );

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, deviceInfo.enableAnimations ? 100 : 0]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.98]);

  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // 设备性能检测
  useEffect(() => {
    setMounted(true);
    
    const checkDeviceCapabilities = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768 || ('ontouchstart' in window);
      
      // 检测性能能力
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const isLowPerformance = isMobileDevice || hardwareConcurrency < 4 || deviceMemory < 4;
      
      setDeviceInfo({
        isMobile: isMobileDevice,
        isLowPerformance,
        enableAnimations: !isLowPerformance
      });
      
      if (isLowPerformance) {
        console.log('检测到低性能设备，启用优化模式');
      }
    };
    
    checkDeviceCapabilities();
    const debouncedCheck = debounce(checkDeviceCapabilities, 250);
    window.addEventListener('resize', debouncedCheck);
    
    return () => {
      window.removeEventListener('resize', debouncedCheck);
    };
  }, []);

  // 记住配色
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hero_palette_idx", String(paletteIdx));
      // 同步到全局 CSS 变量
      const root = document.documentElement;
      root.style.setProperty("--brand-c1", palette[0]);
      root.style.setProperty("--brand-c2", palette[1]);
      root.style.setProperty("--brand-c3", palette[2]);
      root.style.setProperty("--brand-c4", palette[3]);
    }
  }, [paletteIdx, palette]);

  // 性能优化：动画配置根据设备能力调整
  const animationConfig = useMemo(() => ({
    pulseAnimation: {
      scale: [1, 1.02, 1],
      transition: {
        duration: deviceInfo.enableAnimations ? 3 : 6,
        ease: "easeInOut" as const,
        repeat: Infinity,
      } as Transition,
    },
    shimmerAnimation: deviceInfo.enableAnimations ? {
      x: [-100, 100],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 5,
      } as Transition,
    } : {}
  }), [deviceInfo.enableAnimations]);

  // 性能优化：使用 useCallback 缓存事件处理器
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!deviceInfo.enableAnimations || deviceInfo.isMobile) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // 使用 CSS 变量直接更新，避免状态更新
    if (containerRef.current) {
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    }
  }, [deviceInfo.enableAnimations, deviceInfo.isMobile]);

  if (!mounted) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0B1221]">
        <div className="container-fluid relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md bg-white/5 border border-white/10 mb-8">
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold text-white">
              优质学习资源
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 brand-text-gradient">
            {siteName}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-12">
            {siteDescription}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#0B1221]"
      onMouseMove={handleMouseMove}
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "50%"
      } as CSSProperties}
    >
      {/* 性能优化：条件渲染粒子系统 */}
      {deviceInfo.enableAnimations && !deviceInfo.isMobile && (
        <ParticleSystem 
          className="-z-20"
          enableMouseInteraction={false}
          enableBookAnimation={false}
          autoTriggerPageFlip={false}
          enablePerformanceDisplay={false}
          particleCount={deviceInfo.isMobile ? 300 : 600}
        />
      )}

      {/* Aurora 背景 */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ 
          y: deviceInfo.enableAnimations ? y : 0, 
          scale: deviceInfo.enableAnimations ? scale : 1, 
          ...({ 
            "--c1": palette[0],
            "--c2": palette[1],
            "--c3": palette[2],
            "--c4": palette[3],
          } as unknown as CSSProperties) 
        }}
      >
        {/* 大范围Aurora层 */}
        <div aria-hidden className="absolute inset-0 aurora-layer will-change-transform" />
        {/* 局部聚光层 */}
        <div aria-hidden className="absolute inset-0 aurora-spot will-change-transform" />
        
        {/* 性能优化：条件渲染光线扫描 */}
        {deviceInfo.enableAnimations && (
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
            }}
            animate={animationConfig.shimmerAnimation}
          />
        )}
      </motion.div>

      {/* 高级配色切换器 */}
      <motion.div
        className="absolute top-8 right-8 z-20"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.button
          onClick={() => setPaletteIdx((p) => (p + 1) % palettes.length)}
          className="relative group flex items-center gap-3 px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-xl"
          whileHover={{ scale: deviceInfo.enableAnimations ? 1.05 : 1 }}
          whileTap={{ scale: 0.98 }}
          disabled={!deviceInfo.enableAnimations}
        >
          {/* 彩虹旋转图标 */}
          <motion.div
            className="relative w-5 h-5 rounded-full"
            animate={deviceInfo.enableAnimations ? { 
              background: `conic-gradient(from 0deg, ${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]}, ${palette[0]})`
            } : {}}
          >
            <motion.div
              className="absolute inset-1 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center"
            >
              <Palette className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </motion.div>
          
          <span className="text-xs font-medium text-white/90 relative z-10">
            配色 {paletteIdx + 1}/{palettes.length}
          </span>
        </motion.button>
      </motion.div>

      {/* 性能优化：条件渲染书本动画 */}
      {deviceInfo.enableAnimations && (
        <motion.div
          className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { 
            opacity: 1, 
            scale: 1
          } : { opacity: 0, scale: 0.9 }}
          transition={{ delay: 1, duration: 1, ease: "easeOut" }}
        >
          <AdvancedParticleBookAnimation 
            width={deviceInfo.isMobile ? 300 : 400}
            height={deviceInfo.isMobile ? 200 : 250}
            particleCount={deviceInfo.isMobile ? 300 : 400}
            enableMouseInteraction={false}
          />
        </motion.div>
      )}

      {/* 浮动装饰元素 */}
      <motion.div
        className="absolute bottom-1/3 left-1/5 text-white/15"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView && deviceInfo.enableAnimations ? { 
          y: [0, -8, 0],
          opacity: 0.15, 
          scale: 1,
          transition: {
            duration: 5,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 2,
          } as Transition,
        } : { opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.7 }}
      >
        <Search size={35} />
      </motion.div>
      <motion.div
        className="absolute top-1/2 left-1/6 text-white/10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView && deviceInfo.enableAnimations ? { 
          y: [0, -12, 0],
          opacity: 0.1, 
          scale: 1,
          transition: {
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 3,
          } as Transition,
        } : { opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.9 }}
      >
        <Grid3X3 size={28} />
      </motion.div>

      <motion.div
        className="container-fluid relative z-10"
        style={{ opacity: deviceInfo.enableAnimations ? opacity : 1 }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* 徽章 */}
        <motion.div
          variants={staggerItem}
          className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md bg-white/5 border border-white/10 mb-8 shadow-2xl"
          whileHover={{ scale: deviceInfo.enableAnimations ? 1.05 : 1, y: -2 }}
        >
          <motion.span 
            className="relative flex h-3 w-3"
            animate={deviceInfo.enableAnimations ? animationConfig.pulseAnimation : {}}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg"></span>
          </motion.span>
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            优质学习资源
          </span>
          <motion.div
            animate={deviceInfo.enableAnimations ? { rotate: 360 } : {}}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-cyan-300" />
          </motion.div>
        </motion.div>

        {/* 标题 */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 relative"
        >
          <motion.span 
            className="inline-block relative"
            whileHover={{ 
              scale: deviceInfo.enableAnimations ? 1.02 : 1,
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
          >
            <span className="brand-text-gradient animate-gradient-x">
              {siteName}
            </span>
            
            {/* 动态光晕 */}
            <motion.div
              className="absolute inset-0 brand-gradient opacity-20 blur-xl -z-10"
              animate={deviceInfo.enableAnimations ? {
                opacity: [0.1, 0.2, 0.1],
                scale: [0.99, 1.01, 0.99],
                transition: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              } : {}}
            />
          </motion.span>
        </motion.h1>

        {/* 副标题 */}
        <motion.div
          variants={staggerItem}
          className="text-lg md:text-xl text-gray-200 max-w-2xl mb-12 relative"
        >
          <motion.div
            className="relative p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl"
            whileHover={{ y: deviceInfo.enableAnimations ? -2 : 0, scale: deviceInfo.enableAnimations ? 1.01 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.p className="leading-relaxed">
              <span className="text-white font-medium text-xl">{siteDescription}</span>
              <br />
              <motion.span 
                className="text-sm mt-2 block opacity-80 brand-text-gradient"
                animate={deviceInfo.enableAnimations ? {
                  opacity: [0.7, 0.9, 0.7],
                  transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {}}
              >
                🚀 更快找到 · ✨ 更可信 · 💫 更便捷
              </motion.span>
            </motion.p>
          </motion.div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-3 gap-6 mb-12 max-w-2xl"
        >
          {[ 
            { number: "10K+", label: "学习资料", icon: BookOpen, color: "from-sky-400 to-cyan-400", bgColor: "from-sky-500/10 to-cyan-500/10" },
            { number: "50K+", label: "活跃用户", icon: Users, color: "from-cyan-400 to-fuchsia-400", bgColor: "from-cyan-500/10 to-fuchsia-500/10" },
            { number: "999+", label: "每日更新", icon: TrendingUp, color: "from-fuchsia-400 to-sky-400", bgColor: "from-fuchsia-500/10 to-sky-500/10" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group cursor-pointer"
              whileHover={{ 
                scale: deviceInfo.enableAnimations ? 1.05 : 1, 
                y: deviceInfo.enableAnimations ? -4 : 0,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <motion.div
                className={`relative p-4 rounded-xl backdrop-blur-md bg-gradient-to-br ${stat.bgColor} border border-white/10 shadow-xl`}
              >
                <motion.div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 + index * 0.15, duration: 0.6 }}
                />
                
                <motion.div
                  className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: deviceInfo.enableAnimations ? 360 : 0, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </motion.div>
                
                <div className="text-xl md:text-2xl font-bold text-white mb-1 text-center">
                  {stat.number}
                </div>
                
                <div className="text-xs text-gray-300 text-center font-medium">
                  {stat.label}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA按钮组 */}
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start"
        >
          {/* 主 CTA - 磁性按钮 */}
          <MagneticButtonEnhanced
            href="/search"
            variant="primary"
            size="lg"
            strength={deviceInfo.enableAnimations ? 0.15 : 0}
            maxDistance={60}
            glowEffect={deviceInfo.enableAnimations}
            rippleEffect={false}
            className="brand-gradient text-white font-semibold shadow-2xl"
          >
            <Search className="w-5 h-5" />
            <span>立即搜索</span>
            <ArrowRight className="w-5 h-5" />
          </MagneticButtonEnhanced>

          {/* 辅助按钮 */}
          <div className="flex gap-4">
            {[
              { href: "/categories", label: "浏览分类", icon: Grid3X3 },
              { href: "/resources", label: "所有资料", icon: BookOpen }
            ].map((btn, index) => (
              <motion.div
                key={btn.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <MagneticButtonEnhanced
                  href={btn.href}
                  variant="glass"
                  size="md"
                  strength={deviceInfo.enableAnimations ? 0.1 : 0}
                  maxDistance={40}
                  glowEffect={false}
                  rippleEffect={false}
                  className="text-white border border-white/20 shadow-xl"
                >
                  <btn.icon className="w-4 h-4" />
                  <span>{btn.label}</span>
                </MagneticButtonEnhanced>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* 滚动指示器 */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <a href="#home-hot" aria-label="探索更多，跳转到热门资料" className="block">
          <motion.div
            className="flex flex-col items-center gap-2 text-white/70 cursor-pointer group"
            animate={deviceInfo.enableAnimations ? {
              y: [0, 8, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            } : {}}
            whileHover={{ scale: 1.1 }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                const el = document.getElementById("home-hot");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            <span className="text-xs uppercase tracking-wider group-hover:text-white/90 transition-colors">
              探索更多
            </span>
            <motion.div
              className="p-2 rounded-full border border-white/20 group-hover:border-white/40 transition-colors"
              animate={deviceInfo.enableAnimations ? { y: [0, 4, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4 rotate-90" />
            </motion.div>
          </motion.div>
        </a>
      </motion.div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 8s ease infinite; }
        
        .aurora-layer { 
          pointer-events: none;
          background: conic-gradient(from 0deg at var(--mouse-x,50%) var(--mouse-y,50%), var(--c1), var(--c2), var(--c3), var(--c4), var(--c1));
          filter: blur(60px) saturate(100%);
          opacity: 0.2;
          animation: aurora-rotate 40s linear infinite;
          transform: translateZ(0); /* GPU 加速 */
        }
        .aurora-spot {
          pointer-events: none;
          background: radial-gradient(600px 400px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.04), transparent 50%);
          mix-blend-mode: screen;
          transform: translateZ(0); /* GPU 加速 */
        }
        .will-change-transform {
          will-change: transform;
        }
        @keyframes aurora-rotate { 
          from { transform: rotate(0deg) translateZ(0); } 
          to { transform: rotate(360deg) translateZ(0); } 
        }
      `}</style>
    </section>
  );
});

export default HomeHeroOptimized;