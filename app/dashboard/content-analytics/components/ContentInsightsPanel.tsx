/**
 * Content Insights Panel for Story 3.3
 * Detailed content performance insights and analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
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
  LineChart,
  Line
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Users,
  RefreshCw,
  Eye,
  MousePointer,
  Clock,
  DollarSign
} from 'lucide-react';
import { getContentInsights, compareContentVariations } from '@/app/actions/timing-analytics';

interface ContentInsights {
  overall_performance: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
  };
  top_performing_elements: Array<{
    element: string;
    impact_score: number;
    description: string;
  }>;
  improvement_opportunities: Array<{
    area: string;
    potential_gain: number;
    effort_required: 'low' | 'medium' | 'high';
  }>;
  competitive_analysis: {
    benchmark_performance: number;
    performance_gap: number;
    market_position: 'leader' | 'average' | 'lagging';
  };
}

interface VariationComparison {
  variationId: string;
  variationName: string;
  performanceScore: number;
  conversionRate: number;
  avgTimeToPayment: number;
  engagementScore: number;
  sampleSize: number;
  improvementOverBaseline: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ContentInsightsPanel() {
  const [insights, setInsights] = useState<ContentInsights | null>(null);
  const [variationComparison, setVariationComparison] = useState<VariationComparison[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [timeframe]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load content insights and variation comparisons in parallel
      const [insightsResult, comparisonResult] = await Promise.all([
        getContentInsights(timeframe),
        compareContentVariations(undefined, ['var-1', 'var-2']) // Mock variation IDs
      ]);

      if (insightsResult.success && insightsResult.insights) {
        setInsights(insightsResult.insights);
      } else {
        setError(insightsResult.error || 'Failed to load insights');
      }

      if (comparisonResult.success && comparisonResult.comparison) {
        setVariationComparison(comparisonResult.comparison);
      }

    } catch (err) {
      console.error('Error loading content insights:', err);
      setError('Failed to load content insights');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'F': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'text-green-600';
      case 'average': return 'text-yellow-600';
      case 'lagging': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
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
              <p className="text-red-600">Error loading insights: {error}</p>
              <Button onClick={loadInsights} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No insights data available</p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for performance breakdown
  const performanceBreakdown = [
    { name: 'Conversion Rate', current: 22.5, benchmark: 20.0, improvement: 12.5 },
    { name: 'Time to Decision', current: 85, benchmark: 75, improvement: 13.3 },
    { name: 'Engagement Score', current: 78, benchmark: 70, improvement: 11.4 },
    { name: 'Content Relevance', current: 82, benchmark: 75, improvement: 9.3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Performance Insights</h3>
          <p className="text-sm text-muted-foreground">
            Deep analysis of content effectiveness and user behavior patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadInsights} size="sm" variant="outline">
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

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Performance Grade</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-6xl font-bold px-4 py-2 rounded-lg border ${getGradeColor(insights.overall_performance.grade)}`}>
                {insights.overall_performance.grade}
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold mb-1">
                  {insights.overall_performance.score.toFixed(1)}%
                </div>
                <Progress value={insights.overall_performance.score} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Performance Score
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {insights.overall_performance.summary}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className={`text-2xl font-bold capitalize ${getMarketPositionColor(insights.competitive_analysis.market_position)}`}>
                  {insights.competitive_analysis.market_position}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs Industry Benchmark
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Benchmark</p>
                  <p className="font-bold">{insights.competitive_analysis.benchmark_performance}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gap</p>
                  <div className="flex items-center gap-1">
                    {insights.competitive_analysis.performance_gap > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`font-bold ${insights.competitive_analysis.performance_gap > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(insights.competitive_analysis.performance_gap).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Element</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-lg">
                  {insights.top_performing_elements[0]?.element || 'N/A'}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {insights.top_performing_elements[0]?.impact_score || 0}
                  <span className="text-sm text-muted-foreground ml-1">impact score</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {insights.top_performing_elements[0]?.description || 'No top performing element identified'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Performance vs Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}${name === 'Time to Decision' ? ' min' : '%'}`,
                  name === 'current' ? 'Current' : name === 'benchmark' ? 'Benchmark' : 'Improvement'
                ]}
              />
              <Bar dataKey="benchmark" fill="#e5e7eb" name="Benchmark" />
              <Bar dataKey="current" fill="#10b981" name="Current" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Improvement Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.improvement_opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{opportunity.area}</h4>
                  <p className="text-sm text-muted-foreground">
                    Up to {opportunity.potential_gain.toFixed(1)}% improvement potential
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={opportunity.potential_gain} className="w-24 h-2" />
                  <Badge 
                    variant="outline"
                    className={
                      opportunity.effort_required === 'low' 
                        ? 'text-green-600 border-green-600'
                        : opportunity.effort_required === 'medium'
                        ? 'text-yellow-600 border-yellow-600'
                        : 'text-red-600 border-red-600'
                    }
                  >
                    {opportunity.effort_required} effort
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variation Performance Comparison */}
      {variationComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Content Variation Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Variation</th>
                    <th className="text-right p-2">Conversion Rate</th>
                    <th className="text-right p-2">Avg Decision Time</th>
                    <th className="text-right p-2">Engagement Score</th>
                    <th className="text-right p-2">Sample Size</th>
                    <th className="text-right p-2">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {variationComparison.map((variation, index) => (
                    <tr key={variation.variationId} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{variation.variationName}</div>
                        <div className="text-xs text-muted-foreground">
                          Score: {variation.performanceScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="text-right p-2 font-mono">
                        {variation.conversionRate.toFixed(1)}%
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(variation.avgTimeToPayment / (1000 * 60))}min
                      </td>
                      <td className="text-right p-2 font-mono">
                        {variation.engagementScore.toFixed(1)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {variation.sampleSize}
                      </td>
                      <td className="text-right p-2">
                        <div className={`flex items-center gap-1 justify-end ${variation.improvementOverBaseline > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variation.improvementOverBaseline > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="font-mono">
                            {variation.improvementOverBaseline > 0 ? '+' : ''}{variation.improvementOverBaseline.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-800">Strong Conversion Performance</p>
                  <p className="text-green-700">Your conversion rate exceeds industry benchmarks by {Math.abs(insights.competitive_analysis.performance_gap).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-blue-800">Engagement Optimization</p>
                  <p className="text-blue-700">Focus on improving user engagement to drive faster decision-making</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-yellow-800">Decision Speed Opportunity</p>
                  <p className="text-yellow-700">Reducing average decision time could increase conversions by up to 15%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-purple-800">Content Effectiveness</p>
                  <p className="text-purple-700">Your top-performing elements should be replicated across variations</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}