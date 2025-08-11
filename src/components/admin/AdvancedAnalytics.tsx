"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnalyticsChart from './charts/AnalyticsChart';
import MetricCard from './charts/MetricCard';
import BaseChart from './charts/BaseChart';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalClicks: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  charts: {
    trafficTrend: Array<{ date: string; views: number; clicks: number; users: number }>;
    deviceStats: Array<{ name: string; value: number; color: string }>;
    locationStats: Array<{ country: string; users: number; sessions: number }>;
    categoryPerformance: Array<{ category: string; views: number; clicks: number; ctr: number }>;
    userBehavior: Array<{ page: string; avgTime: number; bounceRate: number }>;
    conversionFunnel: Array<{ stage: string; users: number; rate: number }>;
  };
  realtime: {
    activeUsers: number;
    currentSessions: number;
    pageViews: number;
    topPages: Array<{ page: string; views: number }>;
  };
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
    
    // 每30秒刷新实时数据
    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('获取分析数据失败');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      setError('数据加载失败，请重试');
      toast.error('获取分析数据失败');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/realtime');
      if (!response.ok) throw new Error('获取实时数据失败');
      const result = await response.json();
      if (data) {
        setData(prev => prev ? { ...prev, realtime: result.data } : null);
      }
    } catch (error) {
      console.error('Realtime data fetch error:', error);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?range=${timeRange}&format=excel`);
      if (!response.ok) throw new Error('导出失败');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `数据分析报告_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('报告导出成功');
    } catch (error) {
      toast.error('导出失败');
      console.error('Export error:', error);
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: '90d', label: '近90天' },
    { value: '1y', label: '近1年' },
  ];

  const metricOptions = [
    { value: 'views', label: '浏览量', icon: Eye },
    { value: 'clicks', label: '点击量', icon: MousePointer },
    { value: 'users', label: '用户数', icon: Users },
  ];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题和控制器 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            数据分析
          </h1>
          <p className="text-white/60 mt-1">深度洞察用户行为和系统表现</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 指标选择 */}
          <div className="flex items-center gap-2">
            {metricOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedMetric(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedMetric === option.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          
          {/* 时间范围选择 */}
          <div className="flex items-center gap-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalyticsData}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4 text-white/60 group-hover:text-white" />
            </button>
            <button
              onClick={handleExportReport}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
              title="导出报告"
            >
              <Download className="w-4 h-4 text-white/60 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 实时数据卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-white">实时数据</h3>
          </div>
          <span className="text-sm text-white/60">
            最后更新: {new Date().toLocaleTimeString('zh-CN')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{data?.realtime.activeUsers || 0}</div>
            <div className="text-sm text-white/60">在线用户</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{data?.realtime.currentSessions || 0}</div>
            <div className="text-sm text-white/60">当前会话</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{data?.realtime.pageViews || 0}</div>
            <div className="text-sm text-white/60">今日浏览</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {data?.realtime.topPages?.length || 0}
            </div>
            <div className="text-sm text-white/60">活跃页面</div>
          </div>
        </div>
      </motion.div>

      {/* 核心指标 */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="总浏览量"
          value={data?.overview.totalViews || 0}
          icon={Eye}
          change={{ value: 12.5, type: 'increase', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-blue-500/20 to-blue-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="总点击量"
          value={data?.overview.totalClicks || 0}
          icon={MousePointer}
          change={{ value: 8.3, type: 'increase', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-green-500/20 to-green-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="独立访客"
          value={data?.overview.uniqueUsers || 0}
          icon={Users}
          change={{ value: 15.7, type: 'increase', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-purple-500/20 to-purple-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="平均会话时长"
          value={`${Math.floor((data?.overview.avgSessionDuration || 0) / 60)}:${String((data?.overview.avgSessionDuration || 0) % 60).padStart(2, '0')}`}
          icon={Calendar}
          change={{ value: 5.2, type: 'increase', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-orange-500/20 to-orange-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="跳出率"
          value={(data?.overview.bounceRate || 0).toFixed(1)}
          icon={Activity}
          format="percentage"
          change={{ value: 2.1, type: 'decrease', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-red-500/20 to-red-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="转化率"
          value={(data?.overview.conversionRate || 0).toFixed(2)}
          icon={TrendingUp}
          format="percentage"
          change={{ value: 7.8, type: 'increase', period: `较上${timeRange === '7d' ? '周' : '月'}` }}
          gradient="from-pink-500/20 to-pink-600/20"
          loading={loading}
        />
      </div>

      {/* 主要图表区域 */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 流量趋势 */}
        <AnalyticsChart
          type="area"
          title="流量趋势分析"
          subtitle={`${timeRange}内的访问量变化趋势`}
          data={data?.charts.trafficTrend || []}
          dataKey={selectedMetric}
          xAxisKey="date"
          loading={loading}
          onRefresh={fetchAnalyticsData}
          onExport={handleExportReport}
        />

        {/* 设备统计 */}
        <AnalyticsChart
          type="pie"
          title="设备类型分布"
          subtitle="用户使用的设备类型统计"
          data={data?.charts.deviceStats || []}
          dataKey="value"
          loading={loading}
        />
      </div>

      {/* 详细分析区域 */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* 地理位置统计 */}
        <div className="lg:col-span-1">
          <BaseChart
            title="地理位置分布"
            subtitle="访客地理位置统计"
            loading={loading}
          >
            {loading ? null : (
              <div className="space-y-3">
                {(data?.charts.locationStats || []).slice(0, 8).map((location, index) => (
                  <div key={location.country} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{location.country}</div>
                        <div className="text-xs text-white/60">{location.sessions} 次会话</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{location.users}</div>
                      <div className="text-xs text-white/60">用户</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BaseChart>
        </div>

        {/* 分类表现 */}
        <div className="lg:col-span-2">
          <AnalyticsChart
            type="bar"
            title="分类表现分析"
            subtitle="各分类的浏览量和点击量对比"
            data={data?.charts.categoryPerformance || []}
            dataKey="views"
            xAxisKey="category"
            loading={loading}
          />
        </div>
      </div>

      {/* 用户行为分析 */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 页面表现 */}
        <BaseChart
          title="页面表现分析"
          subtitle="各页面的用户停留时间和跳出率"
          loading={loading}
        >
          {loading ? null : (
            <div className="space-y-3">
              {(data?.charts.userBehavior || []).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{page.page}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/60">
                        停留时间: {Math.floor(page.avgTime / 60)}:{String(page.avgTime % 60).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-white/60">
                        跳出率: {page.bounceRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      page.bounceRate < 40 ? 'bg-green-400' : 
                      page.bounceRate < 70 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BaseChart>

        {/* 转化漏斗 */}
        <BaseChart
          title="转化漏斗分析"
          subtitle="用户行为转化路径"
          loading={loading}
        >
          {loading ? null : (
            <div className="space-y-4">
              {(data?.charts.conversionFunnel || []).map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{stage.stage}</div>
                        <div className="text-sm text-white/60">{stage.users} 用户</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-400">
                        {stage.rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-white/60">转化率</div>
                    </div>
                  </div>
                  {index < (data?.charts.conversionFunnel.length || 0) - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-6 h-6 text-white/40">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </BaseChart>
      </div>
    </div>
  );
}