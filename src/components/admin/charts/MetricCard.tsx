"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  format?: 'number' | 'percentage' | 'currency';
  loading?: boolean;
  gradient?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  format = 'number',
  loading = false,
  gradient = "from-purple-500/20 to-pink-500/20",
  className = ""
}: MetricCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `¥${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'decrease':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!change) return "";
    switch (change.type) {
      case 'increase':
        return "text-green-400";
      case 'decrease':
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/10 rounded-2xl p-6 group transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-black/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-white/60 mb-2">{title}</p>
        {loading ? (
          <div className="h-8 bg-white/10 rounded-lg animate-pulse"></div>
        ) : (
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-white">
              {formatValue(value)}
            </h3>
            {change && (
              <p className="text-xs text-white/50 mb-1">
                {change.period}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}