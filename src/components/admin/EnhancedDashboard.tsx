"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MetricCard from './charts/MetricCard';
import AnalyticsChart from './charts/AnalyticsChart';
import { 
  BookOpen, 
  Users, 
  Grid3X3, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Calendar,
  Activity,
  Download,
  UserCheck
} from 'lucide-react';

interface DashboardData {
  metrics: {
    resourceCount: number;
    userCount: number;
    categoryCount: number;
    totalViews: number;
    totalClicks: number;
    activeUsers: number;
    todayRegistrations: number;
    monthlyGrowth: number;
  };
  charts: {
    dailyStats: Array<{ date: string; views: number; clicks: number; users: number }>;
    categoryStats: Array<{ name: string; value: number; color: string }>;
    topResources: Array<{ title: string; views: number; clicks: number }>;
    userGrowth: Array<{ date: string; users: number; active: number }>;
  };
  recentActivity: Array<{
    action: string;
    resource: string;
    user: string;
    time: string;
  }>;
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`);
      if (!response.ok) throw new Error('获取数据失败');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      setError('数据加载失败，请重试');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' },
  ];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 时间范围选择器 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            数据概览
          </h1>
          <p className="text-white/60 mt-1">实时监控系统运行状态和关键指标</p>
        </div>
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
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="学习资源"
          value={data?.metrics.resourceCount || 0}
          icon={BookOpen}
          change={{
            value: 12.5,
            type: 'increase',
            period: '较上月'
          }}
          gradient="from-blue-500/20 to-blue-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="注册用户"
          value={data?.metrics.userCount || 0}
          icon={Users}
          change={{
            value: 8.3,
            type: 'increase',
            period: '较上月'
          }}
          gradient="from-green-500/20 to-green-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="总浏览量"
          value={data?.metrics.totalViews || 0}
          icon={Eye}
          change={{
            value: 15.7,
            type: 'increase',
            period: '较上周'
          }}
          gradient="from-purple-500/20 to-purple-600/20"
          loading={loading}
        />
        
        <MetricCard
          title="活跃用户"
          value={data?.metrics.activeUsers || 0}
          icon={Activity}
          change={{
            value: 5.2,
            type: 'increase',
            period: '较昨日'
          }}
          gradient="from-orange-500/20 to-orange-600/20"
          loading={loading}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 访问趋势 */}
        <AnalyticsChart
          type="area"
          title="访问趋势分析"
          subtitle="网站流量和用户活跃度变化"
          data={data?.charts.dailyStats || []}
          dataKey="views"
          xAxisKey="date"
          loading={loading}
          onRefresh={fetchDashboardData}
          onExport={() => console.log('Export trend data')}
        />

        {/* 分类统计 */}
        <AnalyticsChart
          type="pie"
          title="分类访问分布"
          subtitle="各分类的访问量占比"
          data={data?.charts.categoryStats || []}
          dataKey="value"
          loading={loading}
          onRefresh={fetchDashboardData}
        />
      </div>

      {/* 详细数据区域 */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* 用户增长 */}
        <AnalyticsChart
          type="line"
          title="用户增长趋势"
          subtitle="新用户注册和活跃用户变化"
          data={data?.charts.userGrowth || []}
          dataKey="users"
          xAxisKey="date"
          loading={loading}
          className="lg:col-span-2"
        />

        {/* 热门资源 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">热门资源</h3>
              <p className="text-sm text-white/60">点击量最高的资源</p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.charts.topResources || []).slice(0, 5).map((resource, index) => (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {resource.title}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resource.views}
                      </span>
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        {resource.clicks}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 实时活动 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">实时活动</h3>
            <p className="text-sm text-white/60">最近的系统活动和用户操作</p>
          </div>
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.recentActivity || []).slice(0, 6).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-white/60 mx-2">{activity.action}</span>
                    <span className="font-medium">{activity.resource}</span>
                  </p>
                  <p className="text-xs text-white/50 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}