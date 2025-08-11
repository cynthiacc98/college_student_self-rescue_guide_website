"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BaseChartProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  actions?: ReactNode;
}

export default function BaseChart({
  title,
  subtitle,
  children,
  className = "",
  loading = false,
  error,
  actions
}: BaseChartProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 ${className}`}
      >
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">⚠</span>
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">图表加载错误</h3>
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle && (
              <p className="text-sm text-white/60 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-white/20"></div>
              <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
            </div>
            <span className="ml-3 text-white/60">数据加载中...</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}