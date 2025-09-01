/**
 * Statistical Insights Panel
 * Epic 5, Story 5.1: Journey Comparison Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';

import { JourneyComparison, ComparisonInsights } from '@/lib/data-models/journey-comparison-models';

interface StatisticalInsightsPanelProps {
  comparison: JourneyComparison;
  insights: ComparisonInsights;
}

export default function StatisticalInsightsPanel({ comparison, insights }: StatisticalInsightsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistical Significance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>P-Value</span>
                <span className="font-mono">{comparison.statisticalSignificance.pValue.toFixed(4)}</span>
              </div>
              <Progress value={(1 - comparison.statisticalSignificance.pValue) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Effect Size</span>
                <span className="font-mono">{comparison.statisticalSignificance.effectSize.toFixed(3)}</span>
              </div>
              <Progress value={comparison.statisticalSignificance.effectSize * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Target className="mr-2 h-4 w-4" />
            Key Differentiators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.primaryDifferentiators.slice(0, 3).map((diff, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{diff.type}</span>
                <Badge variant="outline" className="text-xs">
                  {(diff.impactScore * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Confidence Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Overall</span>
                <span>{(comparison.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <Progress value={comparison.confidenceScore * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}