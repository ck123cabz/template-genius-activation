/**
 * Story 4.1: Pattern-Based Recommendation Engine Component
 * 
 * AI-powered recommendation system that suggests content optimizations
 * based on identified success patterns and confidence scoring.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Clock,
  BarChart3,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Archive
} from 'lucide-react';

import { 
  SuccessPattern,
  PatternRecommendation,
  RecommendationType,
  ActionItem,
  getRecommendationPriority
} from '@/lib/data-models/pattern-models';

interface RecommendationEngineProps {
  recommendations: PatternRecommendation[];
  patterns: SuccessPattern[];
  onRecommendationApply: (recommendation: PatternRecommendation) => void;
}

export function RecommendationEngine({ 
  recommendations, 
  patterns, 
  onRecommendationApply 
}: RecommendationEngineProps) {
  // State management
  const [selectedType, setSelectedType] = useState<RecommendationType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [newClientIndustry, setNewClientIndustry] = useState('');

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const typeMatch = selectedType === 'all' || rec.recommendationType === selectedType;
      const priority = getRecommendationPriority(rec);
      const priorityMatch = selectedPriority === 'all' || priority === selectedPriority;
      return typeMatch && priorityMatch;
    }).sort((a, b) => {
      // Sort by priority (high -> medium -> low), then by confidence
      const priorityA = getRecommendationPriority(a);
      const priorityB = getRecommendationPriority(b);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      if (priorityOrder[priorityA] !== priorityOrder[priorityB]) {
        return priorityOrder[priorityB] - priorityOrder[priorityA];
      }
      
      return b.confidenceScore - a.confidenceScore;
    });
  }, [recommendations, selectedType, selectedPriority]);

  // Generate new recommendations based on patterns
  const generateNewRecommendations = () => {
    const highConfidencePatterns = patterns.filter(p => p.confidenceScore > 0.8);
    
    const newRecommendations: PatternRecommendation[] = highConfidencePatterns.slice(0, 3).map(pattern => ({
      id: `new_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patternId: pattern.id,
      recommendationType: 'content' as RecommendationType,
      recommendationData: {
        title: `Apply High-Performance ${pattern.patternType} Pattern`,
        description: `This pattern shows ${Math.round(pattern.successRate * 100)}% success rate with ${Math.round(pattern.confidenceScore * 100)}% confidence`,
        actionItems: generateActionItemsFromPattern(pattern),
        expectedOutcome: `Expected ${Math.round((pattern.successRate - 0.5) * 100)}% improvement over baseline`,
        implementationComplexity: pattern.patternType === 'content-element' ? 'low' : 'medium',
        estimatedImpact: pattern.successRate > 0.8 ? 'high' : 'medium'
      },
      confidenceScore: pattern.confidenceScore,
      expectedImprovement: pattern.successRate - 0.5,
      targetAudience: newClientIndustry || 'General',
      useCount: 0,
      successCount: 0,
      createdAt: new Date(),
      isActive: true
    }));

    return newRecommendations;
  };

  const generateActionItemsFromPattern = (pattern: SuccessPattern): ActionItem[] => {
    const actions: ActionItem[] = [];

    if (pattern.patternData.hypothesis) {
      actions.push({
        type: 'hypothesis-test',
        description: 'Test this hypothesis with new client',
        suggestedValue: pattern.patternData.hypothesis,
        priority: 'high'
      });
    }

    if (pattern.patternData.contentElements?.headlines) {
      actions.push({
        type: 'content-change',
        description: 'Use proven high-converting headline',
        targetElement: 'headline',
        suggestedValue: pattern.patternData.contentElements.headlines[0],
        priority: 'high'
      });
    }

    if (pattern.patternData.contentElements?.callToActions) {
      actions.push({
        type: 'content-change',
        description: 'Apply successful call-to-action pattern',
        targetElement: 'cta',
        suggestedValue: pattern.patternData.contentElements.callToActions[0],
        priority: 'medium'
      });
    }

    if (pattern.patternData.timingFactors) {
      actions.push({
        type: 'timing-adjustment',
        description: `Optimize timing for ${Math.round(pattern.patternData.timingFactors.avgTimeToPayment)}s average conversion time`,
        suggestedValue: `Target ${Math.round(pattern.patternData.timingFactors.avgTimeToPayment / 60)} minute engagement duration`,
        priority: 'medium'
      });
    }

    return actions;
  };

  const getRecommendationIcon = (type: RecommendationType) => {
    const iconMap = {
      content: Target,
      hypothesis: Lightbulb,
      'ab-test': BarChart3,
      timing: Clock
    };
    return iconMap[type] || Target;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    const colorMap = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-blue-600 bg-blue-50'
    };
    return colorMap[priority];
  };

  const getImpactIcon = (impact: 'high' | 'medium' | 'low') => {
    if (impact === 'high') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (impact === 'medium') return <Target className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Recommendations</h2>
          <p className="text-muted-foreground">
            Pattern-based suggestions for optimizing client content
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="hypothesis">Hypothesis</SelectItem>
              <SelectItem value="ab-test">A/B Test</SelectItem>
              <SelectItem value="timing">Timing</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={(value: any) => setSelectedPriority(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => {
              const newRecs = generateNewRecommendations();
              console.log('Generated new recommendations:', newRecs);
            }}
            className="bg-primary text-primary-foreground"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      {/* Quick Recommendation Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Quick Recommendation Generator
          </CardTitle>
          <CardDescription>
            Generate targeted recommendations for a specific client industry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter client industry (e.g., SaaS, E-commerce, Consulting)"
              value={newClientIndustry}
              onChange={(e) => setNewClientIndustry(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => {
                const newRecs = generateNewRecommendations();
                console.log('Industry-specific recommendations:', newRecs);
              }}
            >
              Generate
            </Button>
          </div>
          
          {newClientIndustry && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Will generate recommendations optimized for <strong>{newClientIndustry}</strong> industry
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recommendations</p>
                <p className="text-2xl font-bold">{filteredRecommendations.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredRecommendations.filter(r => getRecommendationPriority(r) === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Expected Impact</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((recommendations.reduce((sum, r) => sum + (r.expectedImprovement || 0), 0) / recommendations.length) * 100)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {recommendations.length > 0 
                    ? Math.round((recommendations.reduce((sum, r) => sum + (r.useCount > 0 ? r.successCount / r.useCount : 0), 0) / recommendations.length) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or generate new recommendations based on current patterns
              </p>
              <Button onClick={() => setSelectedType('all')}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map(recommendation => {
            const priority = getRecommendationPriority(recommendation);
            const Icon = getRecommendationIcon(recommendation.recommendationType);
            const isExpanded = expandedRecommendation === recommendation.id;

            return (
              <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(priority).replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 text-')}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{recommendation.recommendationData.title}</CardTitle>
                        <CardDescription>{recommendation.recommendationData.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(priority)}
                          >
                            {priority.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge variant="secondary">
                            {recommendation.recommendationType}
                          </Badge>
                          <Badge variant="default">
                            {Math.round(recommendation.confidenceScore * 100)}% confidence
                          </Badge>
                          {recommendation.expectedImprovement && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              +{Math.round(recommendation.expectedImprovement * 100)}% expected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getImpactIcon(recommendation.recommendationData.estimatedImpact)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRecommendation(
                          isExpanded ? null : recommendation.id
                        )}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    <div className="space-y-6">
                      {/* Action Items */}
                      <div>
                        <h4 className="font-medium mb-3">Implementation Steps</h4>
                        <div className="space-y-3">
                          {recommendation.recommendationData.actionItems.map((action, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{action.description}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={getPriorityColor(action.priority)}
                                  >
                                    {action.priority}
                                  </Badge>
                                </div>
                                {action.currentValue && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Current: </span>
                                    <span className="font-mono bg-muted px-2 py-1 rounded">
                                      {action.currentValue}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Suggested: </span>
                                  <span className="font-mono bg-green-50 text-green-800 px-2 py-1 rounded">
                                    {action.suggestedValue}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-2 h-6 px-2"
                                    onClick={() => navigator.clipboard.writeText(action.suggestedValue)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expected Outcome */}
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Expected Outcome</h4>
                        <p className="text-green-700">{recommendation.recommendationData.expectedOutcome}</p>
                      </div>

                      {/* Implementation Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Implementation Complexity</p>
                          <p className="capitalize">{recommendation.recommendationData.implementationComplexity}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Estimated Impact</p>
                          <p className="capitalize">{recommendation.recommendationData.estimatedImpact}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Used {recommendation.useCount} times</span>
                          {recommendation.useCount > 0 && (
                            <span>• {Math.round((recommendation.successCount / recommendation.useCount) * 100)}% success rate</span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Pattern
                          </Button>
                          <Button 
                            onClick={() => onRecommendationApply(recommendation)}
                            className="bg-primary text-primary-foreground"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Apply Recommendation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}