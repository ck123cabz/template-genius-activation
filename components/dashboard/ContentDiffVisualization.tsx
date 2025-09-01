/**
 * Content Diff Visualization Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced visualization for content differences with change highlighting,
 * categorization, and impact scoring analysis.
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Progress } from '@/components/shared/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shared/ui/tooltip';
import { 
  FileText, 
  DollarSign, 
  List, 
  Sparkles, 
  MessageSquare, 
  Users, 
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

import {
  ContentDiff,
  DiffDetail,
  DiffCategory,
  ChangeType
} from '@/lib/data-models/journey-comparison-models';
import { JourneyPageType } from '@/lib/data-models/journey-models';

/**
 * Props for ContentDiffVisualization component
 */
interface ContentDiffVisualizationProps {
  contentDifferences: ContentDiff[];
  confidenceScore: number;
}

/**
 * Content diff filter state
 */
interface FilterState {
  selectedPageTypes: JourneyPageType[];
  selectedCategories: DiffCategory[];
  selectedChangeTypes: ChangeType[];
  minImpactScore: number;
  showMinorChanges: boolean;
}

/**
 * Main Content Diff Visualization Component
 */
export default function ContentDiffVisualization({
  contentDifferences,
  confidenceScore
}: ContentDiffVisualizationProps) {
  // Component state
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'impact'>('overview');
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    selectedPageTypes: ['activation', 'agreement', 'confirmation', 'processing'],
    selectedCategories: ['headline', 'pricing', 'benefits', 'features', 'cta', 'testimonials', 'social_proof'],
    selectedChangeTypes: ['text_change', 'structural_change', 'element_addition', 'element_removal'],
    minImpactScore: 0,
    showMinorChanges: true
  });

  // Memoized calculations
  const filteredDiffs = useMemo(() => 
    contentDifferences.filter(diff => 
      filters.selectedPageTypes.includes(diff.pageType) &&
      filters.selectedCategories.includes(diff.diffCategory) &&
      filters.selectedChangeTypes.includes(diff.changeType) &&
      diff.impactScore >= filters.minImpactScore &&
      (filters.showMinorChanges || diff.impactScore >= 0.3)
    ),
    [contentDifferences, filters]
  );

  const diffStats = useMemo(() => {
    const stats = {
      totalDiffs: filteredDiffs.length,
      highImpact: filteredDiffs.filter(d => d.impactScore >= 0.7).length,
      mediumImpact: filteredDiffs.filter(d => d.impactScore >= 0.4 && d.impactScore < 0.7).length,
      lowImpact: filteredDiffs.filter(d => d.impactScore < 0.4).length,
      avgImpactScore: filteredDiffs.length > 0 ? 
        filteredDiffs.reduce((sum, d) => sum + d.impactScore, 0) / filteredDiffs.length : 0,
      avgCorrelationStrength: filteredDiffs.length > 0 ?
        filteredDiffs.reduce((sum, d) => sum + d.correlationStrength, 0) / filteredDiffs.length : 0,
      categoryDistribution: {} as Record<DiffCategory, number>,
      pageDistribution: {} as Record<JourneyPageType, number>
    };

    // Calculate distributions
    filteredDiffs.forEach(diff => {
      stats.categoryDistribution[diff.diffCategory] = (stats.categoryDistribution[diff.diffCategory] || 0) + 1;
      stats.pageDistribution[diff.pageType] = (stats.pageDistribution[diff.pageType] || 0) + 1;
    });

    return stats;
  }, [filteredDiffs]);

  // Event handlers
  const toggleDiffExpansion = (diffId: string) => {
    setExpandedDiffs(prev => {
      const next = new Set(prev);
      if (next.has(diffId)) {
        next.delete(diffId);
      } else {
        next.add(diffId);
      }
      return next;
    });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (contentDifferences.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Content Differences Found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              The selected journeys have very similar content with no significant differences detected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Differences Analysis</span>
            <Badge variant="outline" className="text-sm">
              Confidence: {Math.round(confidenceScore * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Differences"
              value={diffStats.totalDiffs}
              icon={FileText}
              description="Significant content variations"
            />
            <StatCard
              title="High Impact"
              value={diffStats.highImpact}
              icon={TrendingUp}
              description="Strong conversion correlation"
              className="text-red-600"
            />
            <StatCard
              title="Avg Impact Score"
              value={diffStats.avgImpactScore.toFixed(2)}
              icon={TrendingUp}
              description="Average impact rating"
            />
            <StatCard
              title="Avg Correlation"
              value={diffStats.avgCorrelationStrength.toFixed(2)}
              icon={Award}
              description="Average outcome correlation"
            />
          </div>

          {/* Impact Distribution */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Impact Distribution</span>
              <span>{diffStats.totalDiffs} differences</span>
            </div>
            <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
              {diffStats.highImpact > 0 && (
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(diffStats.highImpact / diffStats.totalDiffs) * 100}%` }}
                />
              )}
              {diffStats.mediumImpact > 0 && (
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(diffStats.mediumImpact / diffStats.totalDiffs) * 100}%` }}
                />
              )}
              {diffStats.lowImpact > 0 && (
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(diffStats.lowImpact / diffStats.totalDiffs) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>High Impact ({diffStats.highImpact})</span>
              <span>Medium Impact ({diffStats.mediumImpact})</span>
              <span>Low Impact ({diffStats.lowImpact})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & View Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Impact Score Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Impact Score
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minImpactScore}
                  onChange={(e) => updateFilter('minImpactScore', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-[3ch]">
                  {filters.minImpactScore.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Show Minor Changes Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Options
              </label>
              <Button
                variant={filters.showMinorChanges ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('showMinorChanges', !filters.showMinorChanges)}
                className="w-full"
              >
                {filters.showMinorChanges ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show All Changes
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Major Changes Only
                  </>
                )}
              </Button>
            </div>

            {/* Quick Stats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtered Results
              </label>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Showing {filteredDiffs.length} of {contentDifferences.length} differences</div>
                <div>Avg Impact: {diffStats.avgImpactScore.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Diff Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab as any}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Diff</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filteredDiffs.map(diff => (
            <ContentDiffCard
              key={diff.id}
              diff={diff}
              isExpanded={expandedDiffs.has(diff.id)}
              onToggleExpansion={() => toggleDiffExpansion(diff.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {filteredDiffs.map(diff => (
            <DetailedDiffView
              key={diff.id}
              diff={diff}
            />
          ))}
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <ImpactAnalysisView diffs={filteredDiffs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Individual content diff card component
 */
interface ContentDiffCardProps {
  diff: ContentDiff;
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

function ContentDiffCard({ diff, isExpanded, onToggleExpansion }: ContentDiffCardProps) {
  const categoryIcon = getCategoryIcon(diff.diffCategory);
  const changeTypeColor = getChangeTypeColor(diff.changeType);
  const impactLevel = getImpactLevel(diff.impactScore);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {categoryIcon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {diff.diffCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Change
              </h3>
              <p className="text-sm text-gray-500">
                {diff.pageType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Page
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={changeTypeColor}>
              {diff.changeType.replace('_', ' ')}
            </Badge>
            <ImpactBadge level={impactLevel} score={diff.impactScore} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Impact Score</span>
              <div className="flex items-center space-x-2">
                <Progress value={diff.impactScore * 100} className="h-2" />
                <span className="font-medium">{diff.impactScore.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Correlation</span>
              <div className="flex items-center space-x-2">
                <Progress value={diff.correlationStrength * 100} className="h-2" />
                <span className="font-medium">{diff.correlationStrength.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Similarity</span>
              <div className="flex items-center space-x-2">
                <Progress value={diff.semanticSimilarity * 100} className="h-2" />
                <span className="font-medium">{diff.semanticSimilarity.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Diff Summary */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{diff.diffDetails.length}</span> specific changes detected
            with <span className="font-medium">{impactLevel}</span> conversion impact
          </div>

          {/* Expansion Controls */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpansion}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {diff.diffDetails.slice(0, 3).map((detail, index) => (
                <DiffDetailItem key={index} detail={detail} />
              ))}
              {diff.diffDetails.length > 3 && (
                <p className="text-sm text-gray-500">
                  And {diff.diffDetails.length - 3} more changes...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Detailed diff view component
 */
function DetailedDiffView({ diff }: { diff: ContentDiff }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {diff.pageType} - {diff.diffCategory} Differences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diff.diffDetails.map((detail, index) => (
            <DiffDetailItem key={index} detail={detail} detailed />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Impact analysis view component  
 */
function ImpactAnalysisView({ diffs }: { diffs: ContentDiff[] }) {
  const impactAnalysis = useMemo(() => {
    // Analyze impact patterns
    const byCategory = diffs.reduce((acc, diff) => {
      if (!acc[diff.diffCategory]) {
        acc[diff.diffCategory] = { count: 0, totalImpact: 0, avgImpact: 0 };
      }
      acc[diff.diffCategory].count++;
      acc[diff.diffCategory].totalImpact += diff.impactScore;
      acc[diff.diffCategory].avgImpact = acc[diff.diffCategory].totalImpact / acc[diff.diffCategory].count;
      return acc;
    }, {} as Record<string, { count: number; totalImpact: number; avgImpact: number }>);

    return byCategory;
  }, [diffs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Impact by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(impactAnalysis)
              .sort(([,a], [,b]) => b.avgImpact - a.avgImpact)
              .map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(category as DiffCategory)}
                    <span className="text-sm font-medium">
                      {category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {stats.avgImpact.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.count} changes
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>High Impact Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diffs
              .filter(diff => diff.impactScore >= 0.6)
              .sort((a, b) => b.impactScore - a.impactScore)
              .slice(0, 5)
              .map(diff => (
                <div key={diff.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {diff.diffCategory} on {diff.pageType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {diff.changeType.replace('_', ' ')}
                    </div>
                  </div>
                  <ImpactBadge 
                    level={getImpactLevel(diff.impactScore)} 
                    score={diff.impactScore}
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components and functions

function StatCard({ title, value, icon: Icon, description, className = "" }: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  className?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${className || 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <Icon className={`h-5 w-5 ${className || 'text-gray-600'}`} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function ImpactBadge({ level, score }: { level: string; score: number }) {
  const config = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800', 
    low: 'bg-green-100 text-green-800'
  };

  return (
    <Badge className={config[level as keyof typeof config] || config.low}>
      {(score * 100).toFixed(0)}%
    </Badge>
  );
}

function DiffDetailItem({ detail, detailed = false }: { 
  detail: DiffDetail; 
  detailed?: boolean; 
}) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {detail.changeDescription}
          </p>
          {detailed && (
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div>Impact: {(detail.changeIntensity * 100).toFixed(0)}%</div>
              <div>Semantic Impact: {(detail.semanticImpact * 100).toFixed(0)}%</div>
              <div>Visual Impact: {(detail.visualImpact * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
        <Badge variant="outline" className="ml-2 text-xs">
          {detail.elementType}
        </Badge>
      </div>
    </div>
  );
}

function getCategoryIcon(category: DiffCategory) {
  const icons = {
    headline: <FileText className="h-4 w-4" />,
    pricing: <DollarSign className="h-4 w-4" />,
    benefits: <List className="h-4 w-4" />,
    features: <Sparkles className="h-4 w-4" />,
    cta: <MessageSquare className="h-4 w-4" />,
    testimonials: <Users className="h-4 w-4" />,
    social_proof: <Award className="h-4 w-4" />,
    layout: <FileText className="h-4 w-4" />
  };
  return icons[category] || icons.layout;
}

function getChangeTypeColor(changeType: ChangeType): string {
  const colors = {
    text_change: 'border-blue-200 text-blue-800',
    structural_change: 'border-purple-200 text-purple-800',
    element_addition: 'border-green-200 text-green-800',
    element_removal: 'border-red-200 text-red-800'
  };
  return colors[changeType] || colors.text_change;
}

function getImpactLevel(score: number): string {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}