/**
 * Content Performance Analytics Dashboard Page for Story 3.3
 * Comprehensive content intelligence dashboard with optimization insights
 */

import { Suspense } from "react";
import { ContentAnalyticsDashboard } from "./components/ContentAnalyticsDashboard";
import { ContentInsightsPanel } from "./components/ContentInsightsPanel";
import { ABTestManagerPanel } from "./components/ABTestManagerPanel";
import { OptimizationRecommendations } from "./components/OptimizationRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target,
  Brain,
  Lightbulb
} from "lucide-react";

// Force dynamic rendering for real-time analytics
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Loading skeleton for dashboard components
 */
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Dashboard header with key metrics summary
 */
function DashboardHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Content Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Track content effectiveness, optimize conversion rates, and identify high-performing variations
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Brain className="w-4 h-4 mr-1" />
          AI-Powered Insights
        </Badge>
      </div>
    </div>
  );
}

/**
 * Main content analytics dashboard page
 */
export default function ContentAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <DashboardHeader />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<AnalyticsLoadingSkeleton />}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="abtesting" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                A/B Testing
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Optimization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <ContentAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              <ContentInsightsPanel />
            </TabsContent>

            <TabsContent value="abtesting" className="space-y-6 mt-6">
              <ABTestManagerPanel />
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6 mt-6">
              <OptimizationRecommendations />
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
}