"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useAnimationFrame } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Zap,
  Star,
  Heart,
  Trophy,
  Target,
  Rocket,
  ChevronDown,
  ArrowRight,
  Globe,
  GraduationCap,
  Library
} from "lucide-react";
import Link from "next/link";
import InteractiveParticleBackground from "./InteractiveParticleBackground";
import LiquidBackground from "./LiquidBackground";
import HolographicCard from "./HolographicCard";

interface HomeHeroUltraProps {
  siteName: string;
  siteDescription: string;
}


// 智能色彩系统
function DynamicColorSystem() {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-yellow-500 to-amber-500"
  ];
  
  const [currentColor, setCurrentColor] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColor((prev) => (prev + 1) % colors.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-br ${colors[currentColor]} opacity-10`}
      animate={{ opacity: [0.05, 0.15, 0.05] }}
      transition={{ duration: 5, repeat: Infinity }}
    />
  );
}

// 增强统计数据
const enhancedStats = [
  { 
    label: "学习资源", 
    value: "1000+", 
    icon: BookOpen, 
    color: "from-cyan-400 to-blue-500",
    description: "精选优质内容"
  },
  { 
    label: "活跃用户", 
    value: "5000+", 
    icon: Users, 
    color: "from-purple-400 to-pink-500",
    description: "共同成长社区"
  },
  { 
    label: "每日更新", 
    value: "50+", 
    icon: TrendingUp, 
    color: "from-green-400 to-emerald-500",
    description: "持续新增资源"
  },
  {
    label: "精品分类",
    value: "20+",
    icon: Library,
    color: "from-orange-400 to-red-500",
    description: "细分专业领域"
  }
];

export default function HomeHeroUltra({ siteName, siteDescription }: HomeHeroUltraProps) {
  const [mounted, setMounted] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // 增强视差效果
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
  const blur = useTransform(scrollY, [0, 300], [0, 5]);
  
  // 动态文字切换
  const dynamicTexts = [
    "发现优质学习资源",
    "精选专业学习资源",
    "打造知识共享社区",
    "助力学业成功之路"
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % dynamicTexts.length);
    }, 3000);
    
    // 延迟显示徽章
    setTimeout(() => setShowBadge(true), 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <motion.section
      ref={containerRef}
      style={{ y, opacity, scale }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 多层背景效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
      
      {/* 液态背景 */}
      <LiquidBackground />
      
      {/* 动态色彩系统 */}
      <DynamicColorSystem />
      
      {/* 动态网格背景 */}
      <motion.div 
        className="absolute inset-0"
        style={{ filter: blur }}
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </motion.div>
      
      {/* 交互式粒子背景 - 增加粒子数量 */}
      <InteractiveParticleBackground 
        particleCount={60}
        connectionDistance={150}
        mouseRepelDistance={120}
        mouseRepelForce={0.5}
      />
      
      {/* 动态光线效果 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"
          animate={{ x: [-500, 500, -500] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"
          animate={{ x: [500, -500, 500] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* 优质资源标签 */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-full text-sm text-white/80">
                  <GraduationCap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  大学生学习资源平台
                  <Library className="w-4 h-4 text-purple-400 animate-pulse" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-gradient bg-[length:200%_auto]">
              {siteName}
            </h1>
          </motion.div>

          {/* 动态副标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-3xl text-white/80 mb-8 h-10"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={textIndex}
                initial={{ opacity: 0, y: 20, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: 90 }}
                transition={{ duration: 0.5 }}
                className="block"
                style={{ transformStyle: "preserve-3d" }}
              >
                {dynamicTexts[textIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* 描述 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/60 mb-12 max-w-3xl mx-auto"
          >
            {siteDescription}
          </motion.p>

          {/* 增强CTA按钮组 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <HolographicCard intensity={0.5}>
              <Link href="/search">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 text-white font-semibold overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    开始探索
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </span>
                </motion.button>
              </Link>
            </HolographicCard>

            <Link href="/resources">
              <motion.button
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white font-semibold hover:bg-white/20 transition-all"
                style={{ transformStyle: "preserve-3d" }}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  浏览资源
                </span>
              </motion.button>
            </Link>

            <Link href="/categories">
              <motion.button
                whileHover={{ scale: 1.05, rotateY: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-full text-white font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                style={{ transformStyle: "preserve-3d" }}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  探索分类
                </span>
              </motion.button>
            </Link>
          </motion.div>

          {/* 增强统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {enhancedStats.map((stat, index) => (
              <HolographicCard key={index} intensity={0.3}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="p-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <stat.icon className={`w-10 h-10 mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </motion.div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60 mb-1">{stat.label}</div>
                  <div className="text-xs text-white/40">{stat.description}</div>
                </motion.div>
              </HolographicCard>
            ))}
          </motion.div>
        </div>

        {/* 增强滚动提示 - 调整位置 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ 
              y: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full">
              <span className="text-sm text-white/60">向下滚动探索更多</span>
            </div>
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </motion.section>
  );
}