/**
 * Hypothesis Correlation Panel Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Lightbulb, Target } from 'lucide-react';

import { HypothesisCorrelation } from '@/lib/data-models/journey-comparison-models';

interface HypothesisCorrelationPanelProps {
  hypothesisCorrelations: HypothesisCorrelation[];
  confidenceScore: number;
}

export default function HypothesisCorrelationPanel({
  hypothesisCorrelations,
  confidenceScore
}: HypothesisCorrelationPanelProps) {
  if (hypothesisCorrelations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No hypothesis correlations found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Hypothesis Analysis
          </div>
          <Badge variant="outline">
            Confidence: {Math.round(confidenceScore * 100)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hypothesisCorrelations.map(correlation => (
            <div key={correlation.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-1">
                    Successful Hypothesis:
                  </div>
                  <div className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                    {correlation.successfulHypothesis}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">
                    Failed Hypothesis:
                  </div>
                  <div className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                    {correlation.failedHypothesis}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Correlation: {correlation.correlationStrength.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Causality: {correlation.causalityScore.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sample: {correlation.sampleSize}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}