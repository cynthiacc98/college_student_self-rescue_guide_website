"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Users, 
  Calendar,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Globe
} from 'lucide-react';

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
}

export default function DevAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/dev/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('获取分析数据失败');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      setError('数据加载失败，请重试');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: '90d', label: '近90天' },
    { value: '1y', label: '近1年' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors text-white"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题和控制器 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              数据分析测试页面
            </h1>
            <p className="text-white/60 mt-1">验证UserActivity数据生成和分析API功能</p>
          </div>
          
          <div className="flex items-center gap-4">
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
            
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl transition-colors text-white"
            >
              刷新数据
            </button>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            title="总浏览量"
            value={data?.overview.totalViews || 0}
            icon={Eye}
            gradient="from-blue-500/20 to-blue-600/20"
            loading={loading}
          />
          
          <MetricCard
            title="总点击量"
            value={data?.overview.totalClicks || 0}
            icon={MousePointer}
            gradient="from-green-500/20 to-green-600/20"
            loading={loading}
          />
          
          <MetricCard
            title="独立访客"
            value={data?.overview.uniqueUsers || 0}
            icon={Users}
            gradient="from-purple-500/20 to-purple-600/20"
            loading={loading}
          />
          
          <MetricCard
            title="平均会话时长"
            value={`${Math.floor((data?.overview.avgSessionDuration || 0) / 60)}:${String((data?.overview.avgSessionDuration || 0) % 60).padStart(2, '0')}`}
            icon={Calendar}
            gradient="from-orange-500/20 to-orange-600/20"
            loading={loading}
          />
          
          <MetricCard
            title="跳出率"
            value={`${(data?.overview.bounceRate || 0).toFixed(1)}%`}
            icon={Activity}
            gradient="from-red-500/20 to-red-600/20"
            loading={loading}
          />
          
          <MetricCard
            title="转化率"
            value={`${(data?.overview.conversionRate || 0).toFixed(2)}%`}
            icon={TrendingUp}
            gradient="from-pink-500/20 to-pink-600/20"
            loading={loading}
          />
        </div>

        {/* 设备统计 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            设备类型分布
          </h3>
          {loading ? (
            <div className="text-white/60">加载中...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {data?.charts.deviceStats.map((device) => (
                <div key={device.name} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: device.color }}
                    ></div>
                    <span className="text-white capitalize">{device.name}</span>
                  </div>
                  <div className="text-white font-semibold">{device.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 地理位置统计 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            地理位置分布 (Top 10)
          </h3>
          {loading ? (
            <div className="text-white/60">加载中...</div>
          ) : (
            <div className="space-y-3">
              {data?.charts.locationStats.slice(0, 10).map((location, index) => (
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
        </div>

        {/* 分类表现 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            分类表现分析
          </h3>
          {loading ? (
            <div className="text-white/60">加载中...</div>
          ) : (
            <div className="space-y-3">
              {data?.charts.categoryPerformance.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white font-medium">{category.category}</div>
                    <div className="text-sm text-white/60">点击率: {category.ctr.toFixed(1)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{category.views} 浏览</div>
                    <div className="text-sm text-white/60">{category.clicks} 点击</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 转化漏斗 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            转化漏斗分析
          </h3>
          {loading ? (
            <div className="text-white/60">加载中...</div>
          ) : (
            <div className="space-y-4">
              {data?.charts.conversionFunnel.map((stage, index) => (
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
                      <div className="w-6 h-6 text-white/40 text-center">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 原始数据JSON */}
        <details className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <summary className="text-white font-medium cursor-pointer">查看原始数据 (JSON)</summary>
          <pre className="text-xs text-white/80 mt-4 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  loading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<any>; 
  gradient: string; 
  loading: boolean;
}) {
  return (
    <div className={`bg-gradient-to-r ${gradient} backdrop-blur-xl border border-white/10 rounded-2xl p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/10 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white">
        {loading ? '...' : value}
      </div>
    </div>
  );
}