import { Suspense } from "react";
import dynamic from "next/dynamic";
import HomeHeroWrapper from "@/components/HomeHeroWrapper";
import HomeHotResources from "@/components/HomeHotResources";
import IntersectionReveal from "@/components/IntersectionReveal";

// 性能优化：动态导入非关键组件
const MouseCursor = dynamic(() => import("@/components/MouseCursor"), {
  ssr: false,
  loading: () => null
});

const ScrollParallax = dynamic(() => import("@/components/ScrollParallax"), {
  ssr: false,
  loading: () => (
    <section id="home-hot" className="relative">
      <div className="container-fluid pb-24 pt-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 brand-text-gradient">热门资料</h2>
          <div className="h-[2px] w-20 brand-gradient rounded-full mb-2 opacity-80" />
          <p className="text-gray-300 text-sm max-w-md">基于用户点击和评分的热门学习资源推荐</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            }>
              <HomeHotResources />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
});

export default function Home() {
  return (
    <>
      {/* 性能优化：减少鼠标光标效果的开销 */}
      <MouseCursor 
        enableMagnetic={false}
        enableRipple={false}
        enableTrail={false}
        cursorSize={24}
      />
      
      <main className="min-h-screen relative overflow-hidden">
        <HomeHeroWrapper />
        
        {/* 热门资料区域 - 性能优化版本 */}
        <Suspense fallback={
          <section id="home-hot" className="relative">
            <div className="container-fluid pb-24 pt-16">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 brand-text-gradient">热门资料</h2>
                <div className="h-[2px] w-20 brand-gradient rounded-full mb-2 opacity-80" />
                <p className="text-gray-300 text-sm max-w-md">基于用户点击和评分的热门学习资源推荐</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        }>
          <ScrollParallax 
            speed={0.1}
            enableIndicator={false}
            layers={[
              {
                id: "hot-bg-layer1",
                speed: 0.3,
                element: (
                  <div 
                    className="w-full h-full opacity-40" 
                    style={{
                      background: "radial-gradient(800px 400px at 20% 0%, rgba(12,16,32,0.7), rgba(12,16,32,0.4) 40%, transparent 70%)"
                    }} 
                  />
                ),
                zIndex: -2
              }
            ]}
          >
            <section id="home-hot" className="relative">
              <div className="container-fluid pb-24 pt-16">
                <IntersectionReveal direction="up" timing="fast" delay={0.1}>
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 brand-text-gradient">热门资料</h2>
                    <div className="h-[2px] w-20 brand-gradient rounded-full mb-2 opacity-80" />
                    <p className="text-gray-300 text-sm max-w-md">基于用户点击和评分的热门学习资源推荐</p>
                  </div>
                </IntersectionReveal>
                
                <IntersectionReveal direction="up" timing="fast" delay={0.2}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
                    {/* 简化的背景装饰 */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-xl" />
                    
                    <div className="relative z-10">
                      <Suspense fallback={
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      }>
                        <HomeHotResources />
                      </Suspense>
                    </div>
                  </div>
                </IntersectionReveal>
              </div>
            </section>
          </ScrollParallax>
        </Suspense>
        
      </main>
    </>
  );
}
