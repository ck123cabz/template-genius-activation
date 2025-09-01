/**
 * Journey Comparison Dashboard Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Main interactive dashboard for journey comparison analysis with
 * selection interface, side-by-side visualization, and insights.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Alert, AlertDescription } from '@/components/shared/ui/alert';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';

import JourneySelector from './JourneySelector';
import SideBySideVisualization from './SideBySideVisualization';
import ContentDiffVisualization from './ContentDiffVisualization';
import TimingComparisonChart from './TimingComparisonChart';
import EngagementPatternChart from './EngagementPatternChart';
import StatisticalInsightsPanel from './StatisticalInsightsPanel';
import HypothesisCorrelationPanel from './HypothesisCorrelationPanel';
import ComparisonRecommendations from './ComparisonRecommendations';

import { 
  JourneyComparison, 
  JourneyComparisonResult,
  ComparisonType,
  SignificanceLevel 
} from '@/lib/data-models/journey-comparison-models';
import { JourneySession } from '@/lib/data-models/journey-models';
import { useJourneyComparison } from '@/hooks/useJourneyComparison';

/**
 * Dashboard state interface
 */
interface DashboardState {
  selectedSuccessfulJourney: JourneySession | null;
  selectedFailedJourney: JourneySession | null;
  comparisonType: ComparisonType;
  analysisResults: JourneyComparisonResult | null;
  isLoading: boolean;
  error: string | null;
  activeTab: string;
}

/**
 * Main Journey Comparison Dashboard Component
 */
export default function JourneyComparisonDashboard() {
  // Component state
  const [state, setState] = useState<DashboardState>({
    selectedSuccessfulJourney: null,
    selectedFailedJourney: null,
    comparisonType: 'comprehensive',
    analysisResults: null,
    isLoading: false,
    error: null,
    activeTab: 'overview'
  });

  // Custom hooks
  const {
    compareJourneys,
    findOptimalPairs,
    isAnalyzing,
    error: comparisonError
  } = useJourneyComparison();

  // Memoized values
  const canAnalyze = useMemo(() => 
    state.selectedSuccessfulJourney && state.selectedFailedJourney && !isAnalyzing,
    [state.selectedSuccessfulJourney, state.selectedFailedJourney, isAnalyzing]
  );

  const significanceLevel = useMemo(() => {
    if (!state.analysisResults) return 'none';
    const pValue = state.analysisResults.comparison.statisticalSignificance.pValue;
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    if (pValue < 0.1) return 'low';
    return 'none';
  }, [state.analysisResults]);

  // Event handlers
  const handleJourneySelection = useCallback((
    successfulJourney: JourneySession | null,
    failedJourney: JourneySession | null
  ) => {
    setState(prev => ({
      ...prev,
      selectedSuccessfulJourney: successfulJourney,
      selectedFailedJourney: failedJourney,
      analysisResults: null,
      error: null
    }));
  }, []);

  const handleComparisonTypeChange = useCallback((type: ComparisonType) => {
    setState(prev => ({
      ...prev,
      comparisonType: type,
      analysisResults: null
    }));
  }, []);

  const handleAnalyzeJourneys = useCallback(async () => {
    if (!canAnalyze) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await compareJourneys(
        state.selectedSuccessfulJourney!,
        state.selectedFailedJourney!,
        state.comparisonType
      );

      setState(prev => ({
        ...prev,
        analysisResults: results,
        isLoading: false
      }));

    } catch (error) {
      console.error('Journey analysis failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Analysis failed',
        isLoading: false
      }));
    }
  }, [canAnalyze, compareJourneys, state.selectedSuccessfulJourney, state.selectedFailedJourney, state.comparisonType]);

  const handleFindOptimalPairs = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const pairs = await findOptimalPairs({ limit: 10 });
      
      if (pairs.length > 0) {
        const bestPair = pairs[0];
        handleJourneySelection(bestPair.successfulJourney, bestPair.failedJourney);
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to find optimal journey pairs',
        isLoading: false
      }));
    }
  }, [findOptimalPairs, handleJourneySelection]);

  // Error handling
  useEffect(() => {
    if (comparisonError) {
      setState(prev => ({
        ...prev,
        error: comparisonError,
        isLoading: false
      }));
    }
  }, [comparisonError]);

  return (
    <div className="space-y-6">
      {/* Journey Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Journey Selection & Configuration</span>
            <Button 
              variant="outline" 
              onClick={handleFindOptimalPairs}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Pairs...
                </>
              ) : (
                'Find Optimal Pairs'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journey Selector */}
            <div className="lg:col-span-2">
              <JourneySelector
                selectedSuccessfulJourney={state.selectedSuccessfulJourney}
                selectedFailedJourney={state.selectedFailedJourney}
                onSelectionChange={handleJourneySelection}
                isLoading={state.isLoading}
              />
            </div>

            {/* Analysis Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comparison Type
                </label>
                <Select 
                  value={state.comparisonType} 
                  onValueChange={handleComparisonTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    <SelectItem value="content_focused">Content Focused</SelectItem>
                    <SelectItem value="timing_focused">Timing Focused</SelectItem>
                    <SelectItem value="engagement_focused">Engagement Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAnalyzeJourneys}
                disabled={!canAnalyze}
                className="w-full"
                size="lg"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Journeys'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {state.analysisResults && (
        <div className="space-y-6">
          {/* Results Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Results Overview</span>
                <div className="flex items-center space-x-2">
                  <SignificanceBadge level={significanceLevel} />
                  <Badge variant="outline" className="text-xs">
                    Confidence: {Math.round(state.analysisResults.confidence.overall * 100)}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Statistical Significance"
                  value={`p = ${state.analysisResults.comparison.statisticalSignificance.pValue.toFixed(4)}`}
                  trend={state.analysisResults.comparison.statisticalSignificance.pValue < 0.05 ? 'up' : 'neutral'}
                  description="Overall statistical significance"
                />
                <MetricCard
                  title="Effect Size"
                  value={state.analysisResults.comparison.statisticalSignificance.effectSize.toFixed(3)}
                  trend={state.analysisResults.comparison.statisticalSignificance.effectSize > 0.5 ? 'up' : 'neutral'}
                  description="Practical significance magnitude"
                />
                <MetricCard
                  title="Content Differences"
                  value={state.analysisResults.comparison.contentDifferences.length.toString()}
                  trend={state.analysisResults.comparison.contentDifferences.length > 0 ? 'up' : 'neutral'}
                  description="Significant content variations"
                />
                <MetricCard
                  title="Timing Differences" 
                  value={state.analysisResults.comparison.timingDifferences.length.toString()}
                  trend={state.analysisResults.comparison.timingDifferences.length > 0 ? 'up' : 'neutral'}
                  description="Significant timing variations"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs value={state.activeTab} onValueChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content Diff</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="hypothesis">Hypothesis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <SideBySideVisualization
                successfulJourney={state.selectedSuccessfulJourney!}
                failedJourney={state.selectedFailedJourney!}
                comparisonResults={state.analysisResults}
              />
              <StatisticalInsightsPanel
                comparison={state.analysisResults.comparison}
                insights={state.analysisResults.insights}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentDiffVisualization
                contentDifferences={state.analysisResults.comparison.contentDifferences}
                confidenceScore={state.analysisResults.confidence.components.content}
              />
            </TabsContent>

            <TabsContent value="timing" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TimingComparisonChart
                  timingDifferences={state.analysisResults.comparison.timingDifferences}
                />
                <EngagementPatternChart
                  engagementDifferences={state.analysisResults.comparison.engagementDifferences}
                />
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <EngagementPatternChart
                engagementDifferences={state.analysisResults.comparison.engagementDifferences}
                detailed={true}
              />
            </TabsContent>

            <TabsContent value="hypothesis" className="space-y-6">
              <HypothesisCorrelationPanel
                hypothesisCorrelations={state.analysisResults.comparison.hypothesisCorrelations}
                confidenceScore={state.analysisResults.confidence.components.hypothesis}
              />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <ComparisonRecommendations
                recommendations={state.analysisResults.recommendations}
                insights={state.analysisResults.insights}
                confidence={state.analysisResults.confidence}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!state.selectedSuccessfulJourney && !state.selectedFailedJourney && !state.isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Journeys Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Select a successful and failed journey to begin your comparison analysis. 
                Use the "Find Optimal Pairs" button to automatically identify the best journeys to compare.
              </p>
              <div className="mt-6">
                <Button onClick={handleFindOptimalPairs} disabled={state.isLoading}>
                  Get Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Significance level badge component
 */
function SignificanceBadge({ level }: { level: SignificanceLevel }) {
  const config = {
    high: { label: 'Highly Significant', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    medium: { label: 'Significant', className: 'bg-blue-100 text-blue-800', icon: TrendingUp },
    low: { label: 'Marginally Significant', className: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
    none: { label: 'Not Significant', className: 'bg-gray-100 text-gray-800', icon: TrendingDown }
  };

  const { label, className, icon: Icon } = config[level];

  return (
    <Badge className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

/**
 * Metric card component
 */
interface MetricCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

function MetricCard({ title, value, trend, description }: MetricCardProps) {
  const trendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Info
  };

  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600', 
    neutral: 'text-gray-600'
  };

  const Icon = trendIcon[trend];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${trendColor[trend]}`} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}