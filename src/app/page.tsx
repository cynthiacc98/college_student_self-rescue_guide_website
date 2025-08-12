import { Suspense } from "react";
import HomeHeroWrapper from "@/components/HomeHeroWrapper";
import HomeHotResourcesOptimized from "@/components/HomeHotResourcesOptimized";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen relative bg-gray-900">
      {/* 首页英雄区 */}
      <HomeHeroWrapper />
      
      {/* 热门资料区域 */}
      <section id="home-hot" className="relative py-20 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          {/* 标题区 */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                热门学习资源
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              精选高质量学习资料，助力你的学业成功
            </p>
          </div>
          
          {/* 资源展示 */}
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white/5 backdrop-blur-xl rounded-2xl animate-pulse" />
              ))}
            </div>
          }>
            <HomeHotResourcesOptimized />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
