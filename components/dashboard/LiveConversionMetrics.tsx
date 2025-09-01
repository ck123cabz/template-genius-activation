/**
 * Live Conversion Metrics Component
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Real-time conversion rate displays with trend indicators and animations.
 * Implements AC 4: Real-time conversion rate updates with trend indicators.
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Users,
  Target,
  Clock,
  Zap,
  Activity,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { ConversionMetrics } from '../../lib/real-time/dashboard-updates';

/**
 * Extended metrics for detailed analytics
 */
export interface ExtendedConversionMetrics extends ConversionMetrics {
  hourlyBreakdown?: {
    hour: number;
    conversions: number;
    rate: number;
  }[];
  pageBreakdown?: {
    page: string;
    conversions: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}

/**
 * Metric display configuration
 */
interface MetricConfig {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  format?: 'number' | 'percentage' | 'currency' | 'time';
  target?: number;
}

export interface LiveConversionMetricsProps {
  metrics: ExtendedConversionMetrics;
  showTrends?: boolean;
  showTargets?: boolean;
  showBreakdowns?: boolean;
  compactMode?: boolean;
  animate?: boolean;
  className?: string;
}

export function LiveConversionMetrics({
  metrics,
  showTrends = true,
  showTargets = false,
  showBreakdowns = false,
  compactMode = false,
  animate = true,
  className
}: LiveConversionMetricsProps) {

  // Animation state for value changes
  const [animatingMetrics, setAnimatingMetrics] = useState<Set<string>>(new Set());
  const [previousValues, setPreviousValues] = useState<Partial<ConversionMetrics>>({});

  // Trigger animations when values change
  useEffect(() => {
    const changedMetrics = new Set<string>();

    if (previousValues.currentConversionRate !== metrics.currentConversionRate) {
      changedMetrics.add('currentConversionRate');
    }
    if (previousValues.todayConversions !== metrics.todayConversions) {
      changedMetrics.add('todayConversions');
    }
    if (previousValues.activeJourneys !== metrics.activeJourneys) {
      changedMetrics.add('activeJourneys');
    }
    if (previousValues.newPatternsToday !== metrics.newPatternsToday) {
      changedMetrics.add('newPatternsToday');
    }

    if (changedMetrics.size > 0 && animate) {
      setAnimatingMetrics(changedMetrics);
      setTimeout(() => setAnimatingMetrics(new Set()), 1500);
    }

    setPreviousValues({
      currentConversionRate: metrics.currentConversionRate,
      todayConversions: metrics.todayConversions,
      activeJourneys: metrics.activeJourneys,
      newPatternsToday: metrics.newPatternsToday
    });
  }, [metrics, animate]);

  // Generate metric configurations
  const metricConfigs: MetricConfig[] = useMemo(() => [
    {
      label: 'Current Conversion Rate',
      value: metrics.currentConversionRate,
      subtext: `${Math.abs(metrics.trendPercentage).toFixed(1)}% vs yesterday`,
      trend: metrics.trend,
      trendValue: metrics.trendPercentage,
      icon: Target,
      color: metrics.currentConversionRate >= 30 ? 'green' : 
             metrics.currentConversionRate >= 20 ? 'yellow' : 'red',
      format: 'percentage',
      target: 35 // 35% target conversion rate
    },
    {
      label: 'Today\'s Conversions',
      value: metrics.todayConversions,
      subtext: 'successful activations',
      icon: CheckCircle,
      color: 'blue',
      format: 'number'
    },
    {
      label: 'Active Journeys',
      value: metrics.activeJourneys,
      subtext: 'clients in progress',
      icon: Users,
      color: 'yellow',
      format: 'number'
    },
    {
      label: 'New Patterns Today',
      value: metrics.newPatternsToday,
      subtext: 'identified patterns',
      icon: Zap,
      color: 'green',
      format: 'number'
    }
  ], [metrics]);

  // Format value based on type
  const formatValue = (value: string | number, format?: MetricConfig['format']): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    switch (format) {
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      case 'currency':
        return `$${numValue.toLocaleString()}`;
      case 'time':
        return `${Math.round(numValue)}min`;
      case 'number':
      default:
        return numValue.toLocaleString();
    }
  };

  // Get trend icon
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  // Get color classes for metrics
  const getColorClasses = (color: MetricConfig['color']) => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'red':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  // Compact mode rendering
  if (compactMode) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
        {metricConfigs.map((config, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {config.label}
                </p>
                <p className={cn(
                  "text-lg font-bold transition-all duration-300",
                  getColorClasses(config.color),
                  animatingMetrics.has(Object.keys(previousValues)[index]) && animate && "scale-110"
                )}>
                  {formatValue(config.value, config.format)}
                </p>
              </div>
              <config.icon className="h-4 w-4 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Full mode rendering
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Conversion Metrics
          </CardTitle>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Updated {new Date(metrics.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metricConfigs.map((config, index) => {
            const metricKey = Object.keys(previousValues)[index];
            const isAnimating = animatingMetrics.has(metricKey);
            
            return (
              <div
                key={index}
                className={cn(
                  "relative p-4 rounded-lg border transition-all duration-300",
                  getColorClasses(config.color),
                  isAnimating && animate && "ring-2 ring-blue-300 scale-105"
                )}
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-2">
                  <config.icon className={cn(
                    "h-5 w-5",
                    config.color === 'green' ? 'text-green-600' :
                    config.color === 'blue' ? 'text-blue-600' :
                    config.color === 'yellow' ? 'text-yellow-600' :
                    config.color === 'red' ? 'text-red-600' : 'text-gray-600'
                  )} />
                  
                  {showTrends && config.trend && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(config.trend)}
                      {config.trendValue && (
                        <span className="text-xs font-medium">
                          {config.trendValue.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Metric Value */}
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {config.label}
                  </p>
                  <p className={cn(
                    "text-2xl font-bold transition-all duration-300",
                    isAnimating && animate && "scale-110"
                  )}>
                    {formatValue(config.value, config.format)}
                  </p>
                  {config.subtext && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {config.subtext}
                    </p>
                  )}
                </div>

                {/* Target Progress (if enabled) */}
                {showTargets && config.target && config.format === 'percentage' && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Target: {config.target}%</span>
                      <span className="text-xs font-medium">
                        {Math.round((Number(config.value) / config.target) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((Number(config.value) / config.target) * 100, 100)} 
                      className="h-1"
                    />
                  </div>
                )}

                {/* Animation Indicator */}
                {isAnimating && animate && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confidence Interval */}
        {metrics.confidenceInterval && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                95% Confidence Interval
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Conversion rate likely between {metrics.confidenceInterval.lower.toFixed(1)}% 
              and {metrics.confidenceInterval.upper.toFixed(1)}%
            </div>
            <Progress 
              value={(metrics.currentConversionRate - metrics.confidenceInterval.lower) / 
                     (metrics.confidenceInterval.upper - metrics.confidenceInterval.lower) * 100} 
              className="h-2 mt-2"
            />
          </div>
        )}

        {/* Page Breakdown */}
        {showBreakdowns && metrics.pageBreakdown && metrics.pageBreakdown.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Conversion by Page
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metrics.pageBreakdown.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{page.page}</span>
                    {getTrendIcon(page.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{page.rate.toFixed(1)}%</span>
                    <Badge variant="outline" className="text-xs">
                      {page.conversions}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Health Indicators */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time tracking active</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>Live dashboard</span>
              </div>
            </div>
            <div>
              Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}