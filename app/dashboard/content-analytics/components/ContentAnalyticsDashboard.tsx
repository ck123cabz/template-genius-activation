/**
 * Content Analytics Dashboard Component for Story 3.3
 * Main dashboard component showing content performance overview
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  Zap,
  Brain,
  Activity,
  RefreshCw
} from 'lucide-react';
import { 
  getContentPerformanceMetrics,
  getTimingDistributionData,
  getContentEffectivenessTrends
} from '@/app/actions/timing-analytics';

interface ContentAnalyticsData {
  average_time_to_payment: number;
  conversion_velocity_score: number;
  content_effectiveness_score: number;
  total_conversions: number;
  success_rate: number;
  engagement_metrics: {
    average_engagement_score: number;
    average_scroll_depth: number;
    average_interaction_count: number;
  };
  timing_distribution: {
    under_30_minutes: number;
    under_1_hour: number;
    under_2_hours: number;
    under_24_hours: number;
    over_24_hours: number;
  };
}

interface TimingDistributionItem {
  timeRange: string;
  count: number;
  percentage: number;
  avgConversionRate: number;
}

interface EffectivenessTrend {
  date: string;
  conversionRate: number;
  avgTimeToPayment: number;
  engagementScore: number;
  effectivenessScore: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ContentAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [analytics, setAnalytics] = useState<ContentAnalyticsData | null>(null);
  const [timingDistribution, setTimingDistribution] = useState<TimingDistributionItem[]>([]);
  const [effectivenessTrends, setEffectivenessTrends] = useState<EffectivenessTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all analytics data in parallel
      const [metricsResult, distributionResult, trendsResult] = await Promise.all([
        getContentPerformanceMetrics(timeframe),
        getTimingDistributionData(timeframe),
        getContentEffectivenessTrends(timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90)
      ]);

      if (metricsResult.success && metricsResult.metrics) {
        setAnalytics(metricsResult.metrics);
      } else {
        setError(metricsResult.error || 'Failed to load metrics');
      }

      if (distributionResult.success && distributionResult.data) {
        setTimingDistribution(distributionResult.data);
      }

      if (trendsResult.success && trendsResult.trends) {
        setEffectivenessTrends(trendsResult.trends);
      }

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance change indicators
  const getPerformanceChange = (currentValue: number, baseline: number = 0) => {
    if (baseline === 0) return { change: 0, isPositive: true };
    const change = ((currentValue - baseline) / baseline) * 100;
    return { 
      change: Math.abs(change), 
      isPositive: change >= 0 
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-red-600">Error loading analytics: {error}</p>
              <Button onClick={loadAnalyticsData} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format time display
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Performance indicators
  const velocityChange = getPerformanceChange(analytics.conversion_velocity_score, 75);
  const effectivenessChange = getPerformanceChange(analytics.content_effectiveness_score, 80);
  const conversionChange = getPerformanceChange(analytics.success_rate, 20);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Performance Overview</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive content analytics and conversion intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadAnalyticsData} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.success_rate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {conversionChange.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              <span className={conversionChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {conversionChange.change.toFixed(1)}% from baseline
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Payment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(analytics.average_time_to_payment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_conversions} conversions analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocity Score</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.conversion_velocity_score.toFixed(1)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {velocityChange.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              <span className={velocityChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {velocityChange.change.toFixed(1)}% change
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effectiveness Score</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.content_effectiveness_score.toFixed(1)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {effectivenessChange.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              <span className={effectivenessChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {effectivenessChange.change.toFixed(1)}% improvement
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Effectiveness Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Content Effectiveness Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={effectivenessTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    name === 'conversionRate' ? `${value.toFixed(1)}%` : value.toFixed(1),
                    name === 'conversionRate' ? 'Conversion Rate' : 
                    name === 'effectivenessScore' ? 'Effectiveness Score' :
                    name === 'engagementScore' ? 'Engagement Score' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Conversion Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="effectivenessScore" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Effectiveness Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="engagementScore" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Engagement Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time to Payment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Decision Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeRange" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'count' ? `${value} clients` : 
                    name === 'percentage' ? `${value}%` :
                    name === 'avgConversionRate' ? `${value}%` : value,
                    name === 'count' ? 'Count' :
                    name === 'percentage' ? 'Percentage' :
                    name === 'avgConversionRate' ? 'Avg Conversion Rate' : name
                  ]}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Conversion Rate by Decision Speed</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {timingDistribution.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{item.timeRange}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.avgConversionRate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Engagement & Interaction Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Engagement Score</p>
              <div className="text-3xl font-bold">
                {analytics.engagement_metrics.average_engagement_score.toFixed(1)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${analytics.engagement_metrics.average_engagement_score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Scroll Depth</p>
              <div className="text-3xl font-bold">
                {(analytics.engagement_metrics.average_scroll_depth * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${analytics.engagement_metrics.average_scroll_depth * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Interactions</p>
              <div className="text-3xl font-bold">
                {analytics.engagement_metrics.average_interaction_count.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per session interactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}