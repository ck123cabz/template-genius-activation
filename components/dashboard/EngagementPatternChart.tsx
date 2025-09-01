/**
 * Engagement Pattern Chart Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Activity, Users } from 'lucide-react';

import { EngagementDiff } from '@/lib/data-models/journey-comparison-models';

interface EngagementPatternChartProps {
  engagementDifferences: EngagementDiff[];
  detailed?: boolean;
}

export default function EngagementPatternChart({ 
  engagementDifferences, 
  detailed = false 
}: EngagementPatternChartProps) {
  if (engagementDifferences.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No engagement differences found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Engagement Patterns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {engagementDifferences.map(diff => (
            <div key={diff.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{diff.pageType}</span>
                <Badge variant="outline">
                  {diff.engagementDifferential > 0 ? '+' : ''}{diff.engagementDifferential.toFixed(2)}
                </Badge>
              </div>
              {detailed && (
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <div>Successful Score: {diff.successfulEngagement.overallScore.toFixed(2)}</div>
                    <div>Scroll Depth: {diff.successfulEngagement.scrollDepth}%</div>
                  </div>
                  <div>
                    <div>Failed Score: {diff.failedEngagement.overallScore.toFixed(2)}</div>
                    <div>Scroll Depth: {diff.failedEngagement.scrollDepth}%</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}