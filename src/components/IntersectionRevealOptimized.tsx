"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";

interface IntersectionRevealOptimizedProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  timing?: "fast" | "medium" | "slow";
  delay?: number;
  threshold?: number;
  enableStagger?: boolean;
  staggerChildren?: number;
  className?: string;
}

interface RevealStaggerChildProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  distance?: number;
  delay?: number;
}

// 性能优化：使用 Web API 的 Intersection Observer
const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = "0px"
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 性能优化：如果已经触发过，不再监听
    if (hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
          // 性能优化：一旦触发就停止观察
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasIntersected]);

  return { ref, isIntersecting };
};

const IntersectionRevealOptimized = memo(function IntersectionRevealOptimized({
  children,
  direction = "up",
  timing = "medium",
  delay = 0,
  threshold = 0.1,
  enableStagger = false,
  staggerChildren = 0.1,
  className = "",
}: IntersectionRevealOptimizedProps) {
  const { ref, isIntersecting } = useIntersectionObserver(threshold);

  // 性能优化：简化的动画持续时间
  const getDuration = () => {
    switch (timing) {
      case "fast": return "0.4s";
      case "medium": return "0.6s";
      case "slow": return "0.8s";
      default: return "0.6s";
    }
  };

  // 性能优化：使用 CSS transform 而不是复杂的动画库
  const getTransform = () => {
    if (isIntersecting) return "translate3d(0, 0, 0)";
    
    switch (direction) {
      case "up": return "translate3d(0, 30px, 0)";
      case "down": return "translate3d(0, -30px, 0)";
      case "left": return "translate3d(-30px, 0, 0)";
      case "right": return "translate3d(30px, 0, 0)";
      case "fade": return "translate3d(0, 0, 0)";
      default: return "translate3d(0, 30px, 0)";
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isIntersecting ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${getDuration()} ease-out${delay > 0 ? ` ${delay}s` : ""}, transform ${getDuration()} ease-out${delay > 0 ? ` ${delay}s` : ""}`,
        willChange: "opacity, transform",
      }}
    >
      {enableStagger ? (
        <div
          style={{
            // 性能优化：为交错动画设置CSS变量
            "--stagger-delay": `${staggerChildren}s`,
          } as React.CSSProperties}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
});

// 优化的交错子组件
export const RevealStaggerChildOptimized = memo(function RevealStaggerChildOptimized({
  children,
  direction = "up",
  distance = 30,
  delay = 0,
}: RevealStaggerChildProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "up": return `translate3d(0, ${distance}px, 0)`;
      case "down": return `translate3d(0, -${distance}px, 0)`;
      case "left": return `translate3d(-${distance}px, 0, 0)`;
      case "right": return `translate3d(${distance}px, 0, 0)`;
      default: return `translate3d(0, ${distance}px, 0)`;
    }
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0, 0, 0)" : getInitialTransform(),
        transition: `opacity 0.5s ease-out${delay > 0 ? ` ${delay}s` : ""}, transform 0.5s ease-out${delay > 0 ? ` ${delay}s` : ""}`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
});

export default IntersectionRevealOptimized;