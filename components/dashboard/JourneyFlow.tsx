/**
 * Journey Flow Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Interactive journey flow visualization with path analysis.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getJourneyFlowData } from '@/app/actions/journey-analytics-actions';

interface JourneyFlowProps {
  timeframe?: 'week' | 'month' | 'quarter';
}

export async function JourneyFlow({ timeframe = 'month' }: JourneyFlowProps = {}) {
  const flowResult = await getJourneyFlowData(timeframe);
  const flowData = flowResult.flowData;

  if (!flowData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Journey Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load journey flow data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="journey-flow-diagram">
      <CardHeader>
        <CardTitle>Journey Flow Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Client path analysis through journey stages
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="transition-metrics">
          {flowData.nodes.map((node, index) => (
            <div 
              key={node.id} 
              className="flex items-center justify-between p-4 border rounded-lg"
              data-testid={`flow-node-${node.id}`}
            >
              <div>
                <h4 className="font-medium">{node.label}</h4>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{node.visitors.toLocaleString()} visitors</span>
                  <span>Avg time: {node.avgTimeOnPage}s</span>
                  <span>Engagement: {Math.round(node.engagementScore * 100)}%</span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary">
                  {Math.round(node.conversionRate)}% conversion
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {node.completions.toLocaleString()} completed
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {flowData.transitions && flowData.transitions.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Transition Analysis</h4>
            <div className="space-y-2" data-testid="flow-path-1">
              {flowData.transitions.map((transition, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {transition.from} → {transition.to}
                  </span>
                  <div className="flex gap-4">
                    <span>{transition.count.toLocaleString()} users</span>
                    <span>{transition.conversionRate}%</span>
                    <span>{transition.avgTransitionTime}s avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}