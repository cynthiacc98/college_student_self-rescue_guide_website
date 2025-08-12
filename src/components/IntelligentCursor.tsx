"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, animate } from 'framer-motion';

interface CursorState {
  hover: boolean;
  click: boolean;
  text: boolean;
  link: boolean;
}

export default function IntelligentCursor() {
  const [mounted, setMounted] = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>({
    hover: false,
    click: false,
    text: false,
    link: false
  });
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; id: number }[]>([]);
  
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  const trailIdRef = useRef(0);
  const lastPointTime = useRef(Date.now());

  useEffect(() => {
    setMounted(true);

    const updateCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // 添加轨迹点
      const now = Date.now();
      if (now - lastPointTime.current > 50) {
        lastPointTime.current = now;
        const newPoint = {
          x: e.clientX,
          y: e.clientY,
          id: trailIdRef.current++
        };
        
        setTrailPoints(prev => {
          const updated = [...prev, newPoint];
          return updated.slice(-10); // 保留最后10个点
        });
      }
    };

    const handleMouseDown = () => {
      setCursorState(prev => ({ ...prev, click: true }));
      
      // 创建点击波纹效果
      animate(cursorXSpring, cursorX.get(), {
        type: "spring",
        damping: 15,
        stiffness: 400
      });
    };

    const handleMouseUp = () => {
      setCursorState(prev => ({ ...prev, click: false }));
    };

    const handleElementHover = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // 检测元素类型
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.onclick) {
        setCursorState(prev => ({ ...prev, link: true, hover: true }));
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setCursorState(prev => ({ ...prev, text: true, hover: true }));
      } else if (target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || 
                 target.tagName === 'P' || target.tagName === 'SPAN') {
        setCursorState(prev => ({ ...prev, hover: true }));
      }
    };

    const handleElementLeave = () => {
      setCursorState({ hover: false, click: false, text: false, link: false });
    };

    // 添加事件监听
    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // 监听所有元素的hover
    document.addEventListener('mouseover', handleElementHover);
    document.addEventListener('mouseout', handleElementLeave);

    // 隐藏默认光标
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleElementHover);
      document.removeEventListener('mouseout', handleElementLeave);
      document.body.style.cursor = 'auto';
    };
  }, []);

  // 自动清理过期轨迹点
  useEffect(() => {
    const interval = setInterval(() => {
      setTrailPoints(prev => prev.slice(-10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const getCursorSize = () => {
    if (cursorState.click) return 10;
    if (cursorState.link) return 40;
    if (cursorState.text) return 3;
    if (cursorState.hover) return 30;
    return 20;
  };

  const getCursorColor = () => {
    if (cursorState.link) return 'rgb(236, 72, 153)'; // pink
    if (cursorState.text) return 'rgb(16, 185, 129)'; // emerald
    if (cursorState.hover) return 'rgb(139, 92, 246)'; // purple
    return 'rgb(59, 130, 246)'; // blue
  };

  return (
    <>
      {/* 轨迹效果 */}
      {trailPoints.map((point, index) => (
        <motion.div
          key={point.id}
          className="fixed pointer-events-none"
          style={{
            left: point.x,
            top: point.y,
            x: '-50%',
            y: '-50%',
          }}
          initial={{ opacity: 0.5, scale: 0.5 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, delay: index * 0.02 }}
        >
          <div 
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: `radial-gradient(circle, ${getCursorColor()}, transparent)`,
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      ))}

      {/* 外圈光晕 */}
      <motion.div
        className="fixed pointer-events-none mix-blend-screen"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="rounded-full"
          animate={{
            width: getCursorSize() * 2,
            height: getCursorSize() * 2,
            opacity: cursorState.hover ? 0.3 : 0.1,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            background: `radial-gradient(circle, ${getCursorColor()}, transparent)`,
            filter: 'blur(10px)',
          }}
        />
      </motion.div>

      {/* 主光标 */}
      <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="relative"
          animate={{
            width: getCursorSize(),
            height: getCursorSize(),
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* 核心圆点 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: getCursorColor(),
              opacity: 0.8,
            }}
            animate={{
              scale: cursorState.click ? 0.8 : 1,
            }}
          />
          
          {/* 旋转环 */}
          {cursorState.link && (
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: getCursorColor(),
                borderStyle: 'dashed',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          
          {/* 文本模式指示器 */}
          {cursorState.text && (
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{
                width: 1,
                height: 20,
                background: getCursorColor(),
                x: '-50%',
                y: '-50%',
              }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* 点击波纹 */}
      {cursorState.click && (
        <motion.div
          className="fixed pointer-events-none"
          style={{
            left: cursorX.get(),
            top: cursorY.get(),
            x: '-50%',
            y: '-50%',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="rounded-full"
            style={{
              width: 40,
              height: 40,
              border: `2px solid ${getCursorColor()}`,
            }}
          />
        </motion.div>
      )}
    </>
  );
}