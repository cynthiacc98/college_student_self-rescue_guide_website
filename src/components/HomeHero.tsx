"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useInView, type Transition } from "framer-motion";
import { ArrowRight, Sparkles, Zap, BookOpen, Search, Grid3X3, TrendingUp, Users, Palette } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import ParticleSystem from "@/components/ParticleSystem";
import AdvancedParticleBookAnimation from "@/components/AdvancedParticleBookAnimation";
import MagneticButtonEnhanced from "@/components/MagneticButtonEnhanced";

interface HomeHeroProps {
  siteName: string;
  siteDescription: string;
}

export default function HomeHero({ siteName, siteDescription }: HomeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const [paletteIdx, setPaletteIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const cached = window.localStorage.getItem("hero_palette_idx");
    return cached ? Number(cached) : 0;
  });
  
  const palettes: Array<[string, string, string, string]> = [
    ["#00C2FF", "#18FF92", "#8B5CF6", "#FF66C4"], // Ocean Neon
    ["#FF8A00", "#FF3D54", "#5B5FFF", "#00E1FF"], // Sunset Prism
    ["#22D3EE", "#A78BFA", "#F472B6", "#34D399"],  // Aurora Soft
  ];
  const palette = palettes[paletteIdx % palettes.length];
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // 防止水合错误
  useEffect(() => {
    setMounted(true);
    
    // 检测移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 记住配色
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hero_palette_idx", String(paletteIdx));
      // 同步到全局 CSS 变量，供 Navbar/ResourceCard 使用
      const root = document.documentElement;
      root.style.setProperty("--brand-c1", palette[0]);
      root.style.setProperty("--brand-c2", palette[1]);
      root.style.setProperty("--brand-c3", palette[2]);
      root.style.setProperty("--brand-c4", palette[3]);
    }
  }, [paletteIdx]);

  // 优化的动画配置
  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      ease: "easeInOut" as const,
      repeat: Infinity,
    } as Transition,
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 4,
      ease: "easeInOut" as const,
      repeat: Infinity,
    } as Transition,
  };

  const shimmerAnimation = {
    x: [-100, 100],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 3,
    } as Transition,
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpot({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

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
    >
      {/* 粒子系统背景 */}
      <ParticleSystem 
        className="-z-20"
        enableMouseInteraction={true}
        enableBookAnimation={true}
        autoTriggerPageFlip={true}
        enablePerformanceDisplay={false}
      />

      {/* Aurora 背景 */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y, scale, ...({ 
          "--x": `${spot.x}%`,
          "--y": `${spot.y}%`,
          "--c1": palette[0],
          "--c2": palette[1],
          "--c3": palette[2],
          "--c4": palette[3],
        } as unknown as CSSProperties) }}
      >
        {/* 大范围Aurora层 */}
        <div aria-hidden className="absolute inset-0 aurora-layer" />
        {/* 局部聚光层 */}
        <div aria-hidden className="absolute inset-0 aurora-spot" />
        
        {/* 光线扫描叠加 */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          }}
          animate={shimmerAnimation}
        />
      </motion.div>

      {/* 高级配色切换器 */}
      <motion.div
        className="absolute top-8 right-8 z-20"
        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 2.5, duration: 0.8, type: "spring", stiffness: 200 }}
      >
        <motion.button
          onClick={() => setPaletteIdx((p) => (p + 1) % palettes.length)}
          className="relative group flex items-center gap-3 px-5 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all shadow-xl overflow-hidden"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setHoveredElement('palette')}
          onHoverEnd={() => setHoveredElement(null)}
        >
          <motion.div
            className="absolute inset-0 brand-gradient opacity-0"
            whileHover={{ opacity: 0.1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* 彩虹旋转图标 */}
          <motion.div
            className="relative w-6 h-6 rounded-full"
            animate={{ 
              background: `conic-gradient(from 0deg, ${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]}, ${palette[0]})`,
              rotate: hoveredElement === 'palette' ? 360 : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-1 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center"
              animate={{ rotate: hoveredElement === 'palette' ? -360 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Palette className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
          
          <span className="text-sm font-medium text-white/90 relative z-10">
            配色 {paletteIdx + 1}/{palettes.length}
          </span>
          
          {/* 悬浮光效 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0"
            animate={hoveredElement === 'palette' ? {
              x: ["-100%", "100%"],
              opacity: [0, 1, 0],
              transition: { duration: 0.6 }
            } : {}}
          />
        </motion.button>
      </motion.div>

      {/* 震撼粒子书本动画 */}
      <motion.div
        className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10"
        initial={{ opacity: 0, scale: 0.8, x: 100 }}
        animate={isInView ? { 
          opacity: 1, 
          scale: 1,
          x: 0
        } : { opacity: 0, scale: 0.8, x: 100 }}
        transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
      >
        <AdvancedParticleBookAnimation 
          width={600}
          height={400}
          particleCount={1000}
          enableMouseInteraction={!isMobile}
          onAnimationComplete={() => {
            console.log('粒子书本动画完成！');
          }}
        />
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 left-1/5 text-white/25"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { 
          y: [0, -15, 0],
          rotate: [0, 10, 0],
          opacity: 0.25, 
          scale: 1,
          transition: {
            duration: 7,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 1,
          } as Transition,
        } : { opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.7 }}
      >
        <Search size={45} />
      </motion.div>
      <motion.div
        className="absolute top-1/2 left-1/6 text-white/20"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { 
          y: [0, -25, 0],
          x: [0, 10, 0],
          opacity: 0.2, 
          scale: 1,
          transition: {
            duration: 9,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 3,
          } as Transition,
        } : { opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.9 }}
      >
        <Grid3X3 size={35} />
      </motion.div>

      <motion.div
        className="container-fluid relative z-10"
        style={{ opacity }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* 徽章 */}
        <motion.div
          variants={staggerItem}
          className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md bg-white/5 border border-white/10 mb-8 shadow-2xl overflow-hidden"
          whileHover={{ scale: 1.05, y: -2 }}
          onHoverStart={() => setHoveredElement('badge')}
          onHoverEnd={() => setHoveredElement(null)}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.span 
            className="relative flex h-3 w-3"
            animate={pulseAnimation}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg"></span>
          </motion.span>
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent relative z-10">
            优质学习资源
          </span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-cyan-300" />
          </motion.div>
        </motion.div>

        {/* 标题 */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 relative"
          onHoverStart={() => setHoveredElement('title')}
          onHoverEnd={() => setHoveredElement(null)}
        >
          <motion.span 
            className="inline-block relative"
            whileHover={{ 
              scale: 1.05,
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
          >
            <span className="brand-text-gradient animate-gradient-x">
              {siteName}
            </span>
            
            {/* 动态光晕 */}
            <motion.div
              className="absolute inset-0 brand-gradient opacity-20 blur-xl -z-10"
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [0.98, 1.02, 0.98],
                transition: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />
            
            {/* 彩虹反射 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 opacity-0"
              animate={hoveredElement === 'title' ? {
                x: ["-100%", "100%"],
                opacity: [0, 1, 0],
                transition: { duration: 0.6 }
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
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.p className="leading-relaxed">
              <span className="text-white font-medium text-xl">{siteDescription}</span>
              <br />
              <motion.span 
                className="text-sm mt-2 block opacity-80 brand-text-gradient"
                animate={{
                  opacity: [0.6, 1, 0.6],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
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
            { number: "10K+", label: "学习资料", icon: BookOpen, color: "from-sky-400 to-cyan-400", bgColor: "from-sky-500/20 to-cyan-500/20" },
            { number: "50K+", label: "活跃用户", icon: Users, color: "from-cyan-400 to-fuchsia-400", bgColor: "from-cyan-500/20 to-fuchsia-500/20" },
            { number: "999+", label: "每日更新", icon: TrendingUp, color: "from-fuchsia-400 to-sky-400", bgColor: "from-fuchsia-500/20 to-sky-500/20" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group cursor-pointer"
              whileHover={{ 
                scale: 1.1, 
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              onHoverStart={() => setHoveredElement(`stat-${index}`)}
              onHoverEnd={() => setHoveredElement(null)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.15 }}
            >
              <motion.div
                className={`relative p-6 rounded-xl backdrop-blur-md bg-gradient-to-br ${stat.bgColor} border border-white/10 shadow-xl overflow-hidden`}
              >
                <motion.div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8 + index * 0.2, duration: 0.6 }}
                />
                
                <motion.div
                  className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                
                <motion.div 
                  className="text-2xl md:text-3xl font-bold text-white mb-1 text-center"
                  animate={{
                    scale: hoveredElement === `stat-${index}` ? [1, 1.1, 1] : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  {stat.number}
                </motion.div>
                
                <div className="text-sm text-gray-300 text-center font-medium">
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
            strength={0.4}
            maxDistance={120}
            glowEffect={true}
            rippleEffect={true}
            className="brand-gradient text-white font-semibold shadow-2xl"
          >
            <Search className="w-5 h-5" />
            <span>立即搜索</span>
            <ArrowRight className="w-5 h-5" />
          </MagneticButtonEnhanced>

          {/* 辅助按钮 - 磁性按钮 */}
          <div className="flex gap-4">
            {[
              { href: "/categories", label: "浏览分类", icon: Grid3X3 },
              { href: "/resources", label: "所有资料", icon: BookOpen }
            ].map((btn, index) => (
              <motion.div
                key={btn.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
              >
                <MagneticButtonEnhanced
                  href={btn.href}
                  variant="glass"
                  size="md"
                  strength={0.2}
                  maxDistance={80}
                  glowEffect={false}
                  rippleEffect={true}
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
            animate={{
              y: [0, 10, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
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
              animate={{ y: [0, 5, 0] }}
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
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        
        .aurora-layer { 
          pointer-events: none;
          background: conic-gradient(from 0deg at var(--x,50%) var(--y,50%), var(--c1), var(--c2), var(--c3), var(--c4), var(--c1));
          filter: blur(80px) saturate(120%);
          opacity: 0.35;
          animation: aurora-rotate 22s linear infinite;
        }
        .aurora-spot {
          pointer-events: none;
          background: radial-gradient(800px 500px at var(--x,50%) var(--y,50%), rgba(255,255,255,0.08), transparent 60%);
          mix-blend-mode: screen;
        }
        @keyframes aurora-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
