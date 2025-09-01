/**
 * Timing Comparison Chart Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';

import { TimingDiff } from '@/lib/data-models/journey-comparison-models';

interface TimingComparisonChartProps {
  timingDifferences: TimingDiff[];
}

export default function TimingComparisonChart({ timingDifferences }: TimingComparisonChartProps) {
  if (timingDifferences.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No timing differences found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Timing Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timingDifferences.map(diff => (
            <div key={diff.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{diff.pageType}</span>
                <Badge variant="outline">
                  {diff.timeDifferential > 0 ? '+' : ''}{diff.timeDifferential}s
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <div>Successful: {diff.successfulTiming.avgTimeOnPage}s</div>
                  <div>Engagement: {diff.successfulTiming.avgEngagementScore.toFixed(2)}</div>
                </div>
                <div>
                  <div>Failed: {diff.failedTiming.avgTimeOnPage}s</div>
                  <div>Engagement: {diff.failedTiming.avgEngagementScore.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}