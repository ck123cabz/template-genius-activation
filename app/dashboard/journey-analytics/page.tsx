/**
 * Journey Analytics Dashboard Page
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Main dashboard for journey analytics with drop-off analysis, conversion tracking,
 * and actionable recommendations for improvement.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Target,
  AlertTriangle,
  BarChart3,
  Clock,
  Activity
} from 'lucide-react';

// Import journey analytics components
import { JourneyFunnelChart } from '@/components/dashboard/JourneyFunnelChart';
import { JourneyFlow } from '@/components/dashboard/JourneyFlow';
import { DropOffAnalysis } from '@/components/dashboard/DropOffAnalysis';
import { ExitPatterns } from '@/components/dashboard/ExitPatterns';
import { TimeOnPageAnalysis } from '@/components/dashboard/TimeOnPageAnalysis';
import { ConversionRateComparison } from '@/components/dashboard/ConversionRateComparison';
import { RealtimeJourneyMetrics } from '@/components/dashboard/RealtimeJourneyMetrics';

// Import server actions for real data
import { 
  getJourneyAnalyticsOverview,
  getConversionFunnelData,
  getDropOffPatterns,
  getJourneyRecommendations 
} from '@/app/actions/journey-analytics-actions';

export const metadata: Metadata = {
  title: 'Journey Analytics - Template Genius',
  description: 'Comprehensive journey analytics with drop-off analysis and conversion optimization insights',
};

// Server-side data fetching props interface
interface JourneyAnalyticsPageProps {
  searchParams: { timeframe?: 'week' | 'month' | 'quarter' };
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading journey analytics...</p>
      </div>
    </div>
  );
}

async function OverviewMetrics({ timeframe = 'month' }: { timeframe?: string }) {
  const analyticsResult = await getJourneyAnalyticsOverview(timeframe as any);
  const analytics = analyticsResult.analytics;

  if (!analytics) {
    return <div>Unable to load analytics data</div>;
  }

  const getTrendIcon = (direction: string) => {
    return direction === 'improving' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card data-testid="total-sessions-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-3xl font-bold" data-testid="total-sessions-count">
                {analytics.totalSessions.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex items-center mt-4 text-sm">
            {getTrendIcon(analytics.trendDirection)}
            <span className={`ml-1 ${analytics.trendDirection === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.trendDirection === 'improving' ? '+' : '-'}{analytics.periodChange}%
            </span>
            <span className="ml-2 text-muted-foreground">vs last {timeframe}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-3xl font-bold">{analytics.conversionRate}%</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">
              {analytics.completedJourneys} completed journeys
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Session Time</p>
              <p className="text-3xl font-bold">
                {Math.floor(analytics.avgSessionDuration / 60)}m {analytics.avgSessionDuration % 60}s
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">Healthy engagement time</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
              <p className="text-3xl font-bold text-red-600">{analytics.criticalIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">Requires immediate attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActionsBar() {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Button variant="default" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Data
      </Button>
      <Button variant="outline" size="sm">
        <BarChart3 className="h-4 w-4 mr-2" />
        Export Report
      </Button>
      <Button variant="outline" size="sm">
        <Activity className="h-4 w-4 mr-2" />
        Live Monitor
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Last updated:</span>
        <Badge variant="secondary">2 minutes ago</Badge>
      </div>
    </div>
  );
}

async function TopDropOffPatterns({ timeframe = 'month' }: { timeframe?: string }) {
  const patternsResult = await getDropOffPatterns(timeframe as any);
  const patterns = patternsResult.patterns || [];

  const getPriorityColor = (frequency: number) => {
    if (frequency > 250) return 'destructive';
    if (frequency > 150) return 'secondary';
    return 'outline';
  };

  return (
    <Card data-testid="drop-off-analysis-card">
      <CardHeader>
        <CardTitle>Top Drop-off Patterns</CardTitle>
        <p className="text-sm text-muted-foreground">
          Most common reasons clients exit their journey
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patterns.map((pattern) => (
            <div 
              key={pattern.id} 
              className="flex items-center justify-between p-4 border rounded-lg"
              data-testid={`drop-off-point-${pattern.id}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{pattern.title}</h4>
                  <Badge variant={getPriorityColor(pattern.frequency)} data-testid="drop-off-frequency">
                    {pattern.frequency} users
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(pattern.confidenceScore * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {pattern.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span data-testid="drop-off-page">Page: {pattern.pageType}</span>
                  <span>Avg time: {pattern.avgTimeBeforeExit}s</span>
                  <span data-testid="drop-off-trigger">Trigger: {pattern.exitTrigger.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm" variant="default">
                  Fix Issue
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function ActionableRecommendations({ timeframe = 'month' }: { timeframe?: string }) {
  const recommendationsResult = await getJourneyRecommendations(timeframe as any);
  const recommendations = recommendationsResult.recommendations || [];

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return variants[priority as keyof typeof variants] || 'outline';
  };

  return (
    <Card data-testid="recommendations-section">
      <CardHeader>
        <CardTitle>Recommended Actions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Data-driven recommendations for improving conversion rates
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 border rounded-lg" data-testid={`recommendation-card-${rec.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium" data-testid="rec-title">{rec.title}</h4>
                  <Badge variant={getPriorityBadge(rec.priority)} data-testid="rec-priority">
                    {rec.priority} priority
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600" data-testid="rec-expected-improvement">
                    +{rec.expectedImprovement}% improvement
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expected impact
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {rec.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    Target: {rec.targetPage}
                  </Badge>
                  <Badge variant="outline" data-testid="rec-roi-calculation">
                    ROI: {rec.roiCalculation.roi}x
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                  <Button size="sm" variant="default">
                    Implement
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function FunnelPerformanceMetrics({ timeframe = 'month' }: { timeframe?: string }) {
  const funnelResult = await getConversionFunnelData(timeframe as any);
  const funnelSteps = funnelResult.funnel || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Performance Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown of conversion rates at each step
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelSteps.map((step, index) => (
            <div key={step.step} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium">{step.step}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.visitors.toLocaleString()} visitors
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {step.conversionRate}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {step.conversions.toLocaleString()} converted
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function JourneyAnalyticsPage({ searchParams }: JourneyAnalyticsPageProps) {
  const timeframe = searchParams.timeframe || 'month';

  return (
    <div className="space-y-8">
      <div data-testid="journey-dashboard-header">
        <h1 className="text-3xl font-bold tracking-tight">Journey Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Analyze client journey patterns, identify drop-off points, and optimize conversion rates
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <OverviewMetrics timeframe={timeframe} />
      </Suspense>
      <QuickActionsBar />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
          <TabsTrigger value="funnel" data-testid="funnel-tab">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="dropoffs" data-testid="drop-off-analysis-tab">Drop-off Patterns</TabsTrigger>
          <TabsTrigger value="timing" data-testid="time-analysis-tab">Time Analysis</TabsTrigger>
          <TabsTrigger value="flow" data-testid="journey-flow-tab">Journey Flow</TabsTrigger>
          <TabsTrigger value="realtime" data-testid="realtime-tab">Live Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6" data-testid="overview-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingState />}>
              <TopDropOffPatterns timeframe={timeframe} />
            </Suspense>
            <Suspense fallback={<LoadingState />}>
              <ActionableRecommendations timeframe={timeframe} />
            </Suspense>
          </div>
          
          <Suspense fallback={<LoadingState />}>
            <ConversionRateComparison />
          </Suspense>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6" data-testid="funnel-content">
          <Suspense fallback={<LoadingState />}>
            <JourneyFunnelChart />
          </Suspense>
          
          <Suspense fallback={<LoadingState />}>
            <FunnelPerformanceMetrics timeframe={timeframe} />
          </Suspense>
        </TabsContent>

        <TabsContent value="dropoffs" className="space-y-6" data-testid="drop-off-analysis-content">
          <Suspense fallback={<LoadingState />}>
            <DropOffAnalysis />
          </Suspense>
          
          <Suspense fallback={<LoadingState />}>
            <ExitPatterns />
          </Suspense>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6" data-testid="time-analysis-content">
          <Suspense fallback={<LoadingState />}>
            <TimeOnPageAnalysis />
          </Suspense>
        </TabsContent>

        <TabsContent value="flow" className="space-y-6" data-testid="journey-flow-content">
          <Suspense fallback={<LoadingState />}>
            <JourneyFlow />
          </Suspense>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6" data-testid="realtime-content">
          <Suspense fallback={<LoadingState />}>
            <RealtimeJourneyMetrics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}