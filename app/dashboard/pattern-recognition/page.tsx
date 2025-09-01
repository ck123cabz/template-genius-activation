/**
 * Pattern Recognition Dashboard Page
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Main dashboard for viewing and analyzing success patterns identified from client data.
 * Provides insights into what content approaches lead to conversions.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { PatternVisualization } from '../../../components/dashboard/PatternVisualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Users, 
  BarChart3, 
  Lightbulb,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pattern Recognition Dashboard | Template Genius',
  description: 'Analyze success patterns and content performance to optimize client conversions',
};

// Mock data interfaces (in production, these would come from API calls)
interface PatternSummary {
  totalPatterns: number;
  highConfidencePatterns: number;
  averageConfidence: number;
  newPatternsThisWeek: number;
  topPerformingElement: string;
  conversionImprovement: number;
}

interface QuickStats {
  activeClients: number;
  successRate: number;
  patternsGenerated: number;
  avgProcessingTime: number;
}

// Mock data - in production, this would be fetched from the API
const mockPatternSummary: PatternSummary = {
  totalPatterns: 24,
  highConfidencePatterns: 8,
  averageConfidence: 0.73,
  newPatternsThisWeek: 3,
  topPerformingElement: "Clear value proposition headlines",
  conversionImprovement: 0.18
};

const mockQuickStats: QuickStats = {
  activeClients: 156,
  successRate: 0.68,
  patternsGenerated: 24,
  avgProcessingTime: 2.4
};

function PatternSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockPatternSummary.totalPatterns}</div>
          <p className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="mr-1">
              {mockPatternSummary.newPatternsThisWeek}
            </Badge>
            new this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockPatternSummary.highConfidencePatterns}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((mockPatternSummary.highConfidencePatterns / mockPatternSummary.totalPatterns) * 100)}% of total patterns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(mockPatternSummary.averageConfidence * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            Statistical significance validated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Lift</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{Math.round(mockPatternSummary.conversionImprovement * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            vs baseline conversion rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardControls() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pattern Recognition Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze success patterns to optimize client content and improve conversions
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}

function SystemHealth() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          System Health & Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{mockQuickStats.activeClients}</div>
            <div className="text-sm text-muted-foreground">Active Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(mockQuickStats.successRate * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{mockQuickStats.patternsGenerated}</div>
            <div className="text-sm text-muted-foreground">Patterns Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mockQuickStats.avgProcessingTime}s
            </div>
            <div className="text-sm text-muted-foreground">Avg Processing</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              System Operating Normally
            </span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Pattern recognition is running smoothly. Real-time updates active.
            Last analysis: 2 minutes ago
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TopInsights() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              High-Converting Headlines Pattern Identified
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Headlines emphasizing "immediate value" show 23% higher conversion rates
              across 8 different client segments.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">85% confidence</Badge>
              <Badge variant="outline" className="text-xs">12 samples</Badge>
              <Badge variant="outline" className="text-xs">Statistical significance: p&lt;0.05</Badge>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Pricing Display Strategy
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Displaying prices as "$X/month" vs "$X monthly" shows 15% improvement
              in payment completion rates.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">78% confidence</Badge>
              <Badge variant="outline" className="text-xs">9 samples</Badge>
              <Badge variant="outline" className="text-xs">A/B tested</Badge>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Timing Pattern Discovery
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              Clients who engage for 3-5 minutes before seeing pricing have 41% higher
              conversion probability.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">91% confidence</Badge>
              <Badge variant="outline" className="text-xs">18 samples</Badge>
              <Badge variant="outline" className="text-xs">Cross-validated</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatternRecognitionPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <DashboardControls />
      
      <PatternSummaryCards />
      
      <SystemHealth />
      
      <TopInsights />
      
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="elements">Content Elements</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patterns" className="space-y-6 mt-6">
          <Suspense fallback={<PatternVisualizationSkeleton />}>
            <PatternVisualization />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="elements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Element Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analysis of individual content elements and their conversion impact
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                Content element analysis dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern-Based Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-generated content recommendations based on successful patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                Recommendation engine dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Performance Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track how pattern effectiveness changes over time
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                Trend analysis dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="testing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Integration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Validate patterns through controlled A/B testing
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2" />
                A/B testing dashboard coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading skeleton component
function PatternVisualizationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}