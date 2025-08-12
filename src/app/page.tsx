import { Suspense } from "react";
import HomeHeroWrapper from "@/components/HomeHeroWrapper";
import HomeHotResourcesOptimized from "@/components/HomeHotResourcesOptimized";
import AdvancedEffectsWrapper from "@/components/AdvancedEffectsWrapper";

export default function Home() {
  return (
    <main className="min-h-screen relative bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
      {/* 高级视觉效果层 */}
      <AdvancedEffectsWrapper />
      
      {/* 首页英雄区 */}
      <HomeHeroWrapper />
      
      {/* 热门资料区域 */}
      <section id="home-hot" className="relative py-24 overflow-hidden">
        {/* 多层背景效果 */}
        <div className="absolute inset-0">
          {/* 动态光晕 */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: "30s" }} />
          
          {/* 网格背景 */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          {/* 增强标题区 */}
          <div className="text-center mb-16">
            {/* 动态标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-full text-sm text-white/80 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              实时更新
              <span className="text-white/60">•</span>
              精选推荐
            </div>
            
            {/* 3D标题 */}
            <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ perspective: "1000px" }}>
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-gradient bg-[length:200%_auto]" style={{ transformStyle: "preserve-3d", transform: "rotateX(10deg)" }}>
                热门学习资源
              </span>
            </h2>
            
            {/* 描述 */}
            <p className="text-white/70 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              基于AI智能推荐系统，为你精选最适合的高质量学习资料
            </p>
            
            {/* 动态分隔线 */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-purple-500/50"></div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></span>
              </div>
              <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-purple-500/50"></div>
            </div>
          </div>
          
          {/* 资源展示容器 */}
          <div className="relative">
            {/* 装饰框 */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-2xl" />
            
            {/* 资源网格 */}
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 animate-pulse">
                    <div className="p-6">
                      <div className="h-48 bg-white/10 rounded-xl mb-4"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <HomeHotResourcesOptimized />
            </Suspense>
          </div>
          
          {/* 查看更多按钮 */}
          <div className="text-center mt-16">
            <a 
              href="/resources" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
            >
              探索更多资源
              <span className="text-xl">→</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
