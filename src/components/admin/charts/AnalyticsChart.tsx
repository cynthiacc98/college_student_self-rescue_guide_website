"use client";

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import BaseChart from './BaseChart';
import { DownloadIcon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartData {
  date?: string;
  label?: string;
  name?: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  title: string;
  subtitle?: string;
  data: ChartData[];
  dataKey: string;
  xAxisKey?: string;
  yAxisLabel?: string;
  loading?: boolean;
  error?: string;
  colors?: string[];
  className?: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

const defaultColors = [
  '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', 
  '#06b6d4', '#0891b2', '#0e7490', '#155e75',
  '#10b981', '#059669', '#047857', '#065f46'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl"
      >
        <p className="text-white/60 text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white text-sm font-medium">
              {entry.name}: {entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

export default function AnalyticsChart({
  type,
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey = 'date',
  yAxisLabel,
  loading = false,
  error,
  colors = defaultColors,
  className,
  onRefresh,
  onExport
}: AnalyticsChartProps) {
  const actions = (
    <div className="flex items-center gap-2">
      {onRefresh && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/60" />
        </motion.button>
      )}
      {onExport && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExport}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <DownloadIcon className="w-4 h-4 text-white/60" />
        </motion.button>
      )}
    </div>
  );

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-white/40 text-2xl">📊</span>
            </div>
            <p className="text-white/60">暂无数据</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={colors[0]}
                fillOpacity={1} 
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={dataKey} 
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <BaseChart
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      actions={actions}
      className={className}
    >
      {renderChart()}
    </BaseChart>
  );
}