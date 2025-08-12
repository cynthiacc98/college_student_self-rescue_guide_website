"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
// HomeHotResourcesOptimized moved to server component
import IntersectionReveal from "@/components/IntersectionReveal";

// 性能优化：动态导入非关键组件
const MouseCursor = dynamic(() => import("@/components/MouseCursor"), {
  ssr: false,
  loading: () => null
});

// ScrollParallax将在父组件中直接使用

interface ClientComponentsProps {
  children?: React.ReactNode;
}

export default function ClientComponents({ children }: ClientComponentsProps) {
  return (
    <>
      {/* 性能优化：减少鼠标光标效果的开销 */}
      <MouseCursor 
        enableMagnetic={false}
        enableRipple={false}
        enableTrail={false}
        cursorSize={24}
      />
      
      {children}
    </>
  );
}