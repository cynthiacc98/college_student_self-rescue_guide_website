/**
 * 高级鼠标光标效果组件
 * 支持磁性吸附、涟漪效果和交互式光晕
 */

"use client";

import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MouseCursorProps {
  enableMagnetic?: boolean;
  enableRipple?: boolean;
  enableTrail?: boolean;
  cursorSize?: number;
  className?: string;
}

const MouseCursor = memo(function MouseCursor({
  enableMagnetic = true,
  enableRipple = true,
  enableTrail = true,
  cursorSize = 40,
  className = ''
}: MouseCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 使用弹性动画让光标跟随更自然
  const cursorX = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const cursorY = useSpring(mouseY, { stiffness: 200, damping: 20 });
  
  const trailRefs = useRef<Array<{ x: number; y: number; opacity: number }>>([]);
  const rippleIdRef = useRef(0);

  // 鼠标移动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      if (!isVisible) setIsVisible(true);
      
      // 更新拖尾
      if (enableTrail) {
        trailRefs.current = trailRefs.current.map((trail) => ({
          ...trail,
          opacity: trail.opacity * 0.9
        })).filter(trail => trail.opacity > 0.01);
        
        trailRefs.current.push({
          x: e.clientX,
          y: e.clientY,
          opacity: 1
        });
        
        if (trailRefs.current.length > 10) {
          trailRefs.current.shift();
        }
      }
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);
    
    const handleClick = (e: MouseEvent) => {
      if (enableRipple) {
        const newRipple = {
          id: rippleIdRef.current++,
          x: e.clientX,
          y: e.clientY
        };
        
        setRipples(prev => [...prev, newRipple]);
        
        // 2秒后移除涟漪
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 2000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
    };
  }, [mouseX, mouseY, enableTrail, enableRipple, isVisible]);

  // 磁性效果处理
  useEffect(() => {
    if (!enableMagnetic) return;

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        setIsHoveringLink(true);
      }
      if (target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('cursor-pointer')) {
        setIsHoveringButton(true);
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        setIsHoveringLink(false);
      }
      if (target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('cursor-pointer')) {
        setIsHoveringButton(false);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [enableMagnetic]);

  // 移动端检测，不显示自定义光标
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  if (isMobile) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9999] ${className}`}>
      {/* 主光标 */}
      <motion.div
        className="fixed pointer-events-none mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          width: cursorSize,
          height: cursorSize
        }}
        animate={{
          scale: isVisible 
            ? isHoveringButton ? 1.5 
            : isHoveringLink ? 1.2 
            : 1 
            : 0,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div 
          className="w-full h-full rounded-full border-2 border-white"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* 中心点 */}
        <div 
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>

      {/* 光晕效果 */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          x: cursorX,
          y: cursorY,
          width: cursorSize * 3,
          height: cursorSize * 3
        }}
        animate={{
          scale: isVisible ? 1 : 0,
          opacity: isVisible ? 0.1 : 0
        }}
      >
        <div 
          className="w-full h-full rounded-full bg-gradient-radial from-white to-transparent"
          style={{
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
          }}
        />
      </motion.div>

      {/* 拖尾效果 */}
      {enableTrail && trailRefs.current.map((trail, index) => (
        <motion.div
          key={index}
          className="fixed pointer-events-none w-2 h-2 bg-white rounded-full mix-blend-difference"
          style={{
            left: trail.x,
            top: trail.y,
            transform: 'translate(-50%, -50%)',
            opacity: trail.opacity * 0.3
          }}
          animate={{
            scale: [1, 0],
            opacity: [trail.opacity * 0.3, 0]
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* 点击涟漪效果 */}
      {enableRipple && ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="fixed pointer-events-none border-2 border-white rounded-full mix-blend-difference"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ 
            width: 100, 
            height: 100, 
            opacity: 0 
          }}
          transition={{ 
            duration: 1.5, 
            ease: "easeOut" 
          }}
        />
      ))}

      {/* 交互提示 */}
      {(isHoveringLink || isHoveringButton) && (
        <motion.div
          className="fixed pointer-events-none text-white text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm"
          style={{
            x: cursorX,
            y: cursorY,
            marginTop: cursorSize + 10,
            marginLeft: -20
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {isHoveringButton ? '点击' : isHoveringLink ? '访问' : ''}
        </motion.div>
      )}
    </div>
  );
});

export default MouseCursor;