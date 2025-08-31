/**
 * RevenueTracker Component for Story 3.2: Revenue Tracking Dashboard Component
 * Comprehensive revenue analytics with weekly/monthly totals and trend visualization
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/lib/supabase';
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface RevenueTrackerProps {
  clients: Client[];
  timeframe?: 'week' | 'month' | 'quarter';
}

interface RevenueAnalytics {
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  successRate: number;
  trendData: Array<{
    date: string;
    revenue: number;
    payments: number;
    successRate: number;
  }>;
  dailyBreakdown: Array<{
    day: string;
    revenue: number;
    payments: number;
  }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function RevenueTracker({ clients, timeframe = 'month' }: RevenueTrackerProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>(timeframe);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');

  // Calculate analytics based on selected timeframe
  useEffect(() => {
    const calculateAnalytics = (): RevenueAnalytics => {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (selectedTimeframe) {
        case 'week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = subDays(now, 30);
      }

      // Filter clients by timeframe
      const filteredClients = clients.filter(client => {
        if (!client.payment_timestamp) return false;
        const paymentDate = new Date(client.payment_timestamp);
        return paymentDate >= startDate && paymentDate <= endDate;
      });

      const successfulPayments = filteredClients.filter(c => c.payment_received).length;
      const failedPayments = filteredClients.filter(c => c.payment_status === 'failed').length;
      const pendingPayments = filteredClients.filter(c => c.payment_status === 'pending').length;
      const totalRevenue = filteredClients
        .filter(c => c.payment_received && c.payment_amount)
        .reduce((sum, c) => sum + (c.payment_amount || 0), 0);

      const successRate = filteredClients.length > 0 
        ? Math.round((successfulPayments / filteredClients.length) * 100)
        : 0;

      // Generate trend data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const trendData = dateRange.map(date => {
        const dayClients = filteredClients.filter(client => {
          if (!client.payment_timestamp) return false;
          const paymentDate = new Date(client.payment_timestamp);
          return format(paymentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });

        const dayRevenue = dayClients
          .filter(c => c.payment_received)
          .reduce((sum, c) => sum + (c.payment_amount || 0), 0);
        
        const daySuccessRate = dayClients.length > 0 
          ? Math.round((dayClients.filter(c => c.payment_received).length / dayClients.length) * 100)
          : 0;

        return {
          date: format(date, 'MMM d'),
          revenue: dayRevenue,
          payments: dayClients.length,
          successRate: daySuccessRate
        };
      });

      // Generate daily breakdown for chart
      const dailyBreakdown = trendData.slice(-7).map(day => ({
        day: day.date,
        revenue: day.revenue,
        payments: day.payments
      }));

      return {
        totalRevenue,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate,
        trendData,
        dailyBreakdown
      };
    };

    setAnalytics(calculateAnalytics());
  }, [clients, selectedTimeframe]);

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = [
    { name: 'Successful', value: analytics.successfulPayments, color: COLORS[0] },
    { name: 'Pending', value: analytics.pendingPayments, color: COLORS[1] },
    { name: 'Failed', value: analytics.failedPayments, color: COLORS[2] }
  ].filter(item => item.value > 0);

  const previousPeriodRevenue = 5400; // Mock data for comparison
  const revenueChange = analytics.totalRevenue - previousPeriodRevenue;
  const revenueChangePercent = previousPeriodRevenue > 0 
    ? ((revenueChange / previousPeriodRevenue) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revenue Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track payment performance and revenue trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenueChange >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              )}
              <span className={revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {revenueChangePercent}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.successfulPayments} of {analytics.successfulPayments + analytics.failedPayments + analytics.pendingPayments} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.successfulPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(analytics.totalRevenue / (analytics.successfulPayments || 1)).toFixed(0)} avg per payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.failedPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(analytics.failedPayments * 500).toLocaleString()} revenue at risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'area' && (
                <AreaChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Success Rate'
                    ]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              )}
              {chartType === 'bar' && (
                <BarChart data={analytics.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              )}
              {chartType === 'line' && (
                <LineChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" />
                  <Line type="monotone" dataKey="successRate" stroke="#3b82f6" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Payments']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <Badge variant="outline">{entry.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Average Revenue per Day</p>
              <p className="text-lg font-semibold">
                ${(analytics.totalRevenue / (selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90)).toFixed(0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-semibold">{analytics.successRate}%</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Revenue at Risk</p>
              <p className="text-lg font-semibold text-red-600">
                ${(analytics.failedPayments * 500).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Pending Revenue</p>
              <p className="text-lg font-semibold text-yellow-600">
                ${(analytics.pendingPayments * 500).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}