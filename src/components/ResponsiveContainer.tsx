"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Palette, Eye } from 'lucide-react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  showDevicePreview?: boolean;
  enableDeviceToggle?: boolean;
  className?: string;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceConfig {
  type: DeviceType;
  name: string;
  width: string;
  height: string;
  icon: React.ComponentType<{ className?: string }>;
  breakpoint: string;
}

const devices: DeviceConfig[] = [
  {
    type: 'mobile',
    name: '移动端',
    width: '375px',
    height: '812px', 
    icon: Smartphone,
    breakpoint: 'max-width: 768px'
  },
  {
    type: 'tablet',
    name: '平板',
    width: '768px',
    height: '1024px',
    icon: Tablet,
    breakpoint: 'min-width: 769px and max-width: 1024px'
  },
  {
    type: 'desktop',
    name: '桌面',
    width: '1200px',
    height: '800px',
    icon: Monitor,
    breakpoint: 'min-width: 1025px'
  }
];

export default function ResponsiveContainer({
  children,
  showDevicePreview = false,
  enableDeviceToggle = false,
  className = ''
}: ResponsiveContainerProps) {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [actualDevice, setActualDevice] = useState<DeviceType>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(showDevicePreview);

  // 检测实际设备类型
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 769) {
        setActualDevice('mobile');
        setCurrentDevice('mobile');
      } else if (width < 1025) {
        setActualDevice('tablet');
        setCurrentDevice('tablet');
      } else {
        setActualDevice('desktop');
        setCurrentDevice('desktop');
      }
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const getCurrentConfig = () => {
    return devices.find(d => d.type === currentDevice) || devices[2];
  };

  const config = getCurrentConfig();

  if (!enableDeviceToggle && !showDevicePreview) {
    // 正常渲染模式
    return (
      <div className={`w-full h-full ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 设备切换控制栏 */}
      {enableDeviceToggle && (
        <motion.div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl bg-black/20 border border-white/20 shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* 预览模式切换 */}
          <motion.button
            className={`p-2 rounded-xl transition-all ${
              isPreviewMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-4 h-4" />
          </motion.button>

          {/* 设备选择 */}
          <div className="flex gap-1">
            {devices.map((device) => (
              <motion.button
                key={device.type}
                className={`p-2 rounded-xl transition-all ${
                  currentDevice === device.type
                    ? 'bg-white text-black'
                    : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setCurrentDevice(device.type)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={device.name}
              >
                <device.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>

          {/* 当前设备信息 */}
          <div className="text-xs text-white/70 ml-2 hidden sm:block">
            {config.name}
          </div>
        </motion.div>
      )}

      {/* 内容渲染区域 */}
      <AnimatePresence mode="wait">
        {isPreviewMode ? (
          <motion.div
            key={`preview-${currentDevice}`}
            className="flex items-center justify-center min-h-screen p-8 bg-gray-900/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* 设备框架 */}
            <motion.div
              className="relative bg-black rounded-[2rem] p-2 shadow-2xl"
              style={{
                maxWidth: config.width,
                maxHeight: config.height
              }}
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              {/* 设备屏幕 */}
              <div
                className="relative overflow-hidden rounded-[1.5rem] bg-white"
                style={{
                  width: config.width,
                  height: config.height
                }}
              >
                {/* 内容区域 */}
                <motion.div
                  className="w-full h-full overflow-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {children}
                </motion.div>

                {/* 设备UI装饰 */}
                {currentDevice === 'mobile' && (
                  <>
                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full" />
                    {/* Notch (for iPhone-style) */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl" />
                  </>
                )}

                {/* 屏幕反光效果 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
                  animate={{
                    opacity: [0.05, 0.15, 0.05]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>

              {/* 设备按钮和端口 */}
              {currentDevice === 'mobile' && (
                <>
                  {/* 电源按钮 */}
                  <div className="absolute -right-1 top-20 w-1 h-12 bg-gray-700 rounded-l" />
                  {/* 音量按钮 */}
                  <div className="absolute -left-1 top-16 w-1 h-6 bg-gray-700 rounded-r" />
                  <div className="absolute -left-1 top-24 w-1 h-6 bg-gray-700 rounded-r" />
                </>
              )}
            </motion.div>

            {/* 设备信息标签 */}
            <motion.div
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {config.name} - {config.width} × {config.height}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="full-content"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 响应式断点指示器 */}
      {enableDeviceToggle && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 p-2 rounded-lg backdrop-blur-md bg-black/20 border border-white/20 text-white text-xs"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-3 h-3" />
            <span>实际: {actualDevice}</span>
            {isPreviewMode && (
              <>
                <span>|</span>
                <span>预览: {currentDevice}</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* CSS媒体查询样式 */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-optimized {
            font-size: 14px;
            padding: 0.75rem;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .tablet-optimized {
            font-size: 16px;
            padding: 1rem;
          }
        }
        
        @media (min-width: 1025px) {
          .desktop-optimized {
            font-size: 18px;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}