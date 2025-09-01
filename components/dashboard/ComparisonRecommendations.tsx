/**
 * Comparison Recommendations Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shared/ui/collapsible';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Zap, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { 
  ComparisonRecommendation, 
  ComparisonInsights,
  ConfidenceAnalysis 
} from '@/lib/data-models/journey-comparison-models';

interface ComparisonRecommendationsProps {
  recommendations: ComparisonRecommendation[];
  insights: ComparisonInsights;
  confidence: ConfidenceAnalysis;
}

export default function ComparisonRecommendations({
  recommendations,
  insights,
  confidence
}: ComparisonRecommendationsProps) {
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());

  const toggleExpansion = (id: string) => {
    setExpandedRecs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Recommendations Available
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              The analysis didn't identify specific actionable improvements. 
              The journeys may be too similar or require more data points.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Optimization Recommendations</span>
            <Badge variant="outline">
              {recommendations.length} recommendations
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {recommendations.filter(r => r.priority === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.filter(r => r.implementationEffort === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Quick Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.expectedImpact, 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Total Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations
          .sort((a, b) => {
            // Sort by priority first, then by expected impact
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return b.expectedImpact - a.expectedImpact;
          })
          .map(rec => (
            <Card key={rec.id} className="transition-all duration-200 hover:shadow-md">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <div className="cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)} border`}>
                            {getPriorityIcon(rec.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">
                              {rec.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge className={getEffortColor(rec.implementationEffort)}>
                            {rec.implementationEffort} effort
                          </Badge>
                          {expandedRecs.has(rec.id) ? 
                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(rec.expectedImpact * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Expected Impact</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(rec.confidenceScore * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {rec.actionItems.length}
                          </div>
                          <div className="text-xs text-gray-600">Action Items</div>
                        </div>
                      </div>

                      {/* Action Items */}
                      {rec.actionItems.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
                          <div className="space-y-2">
                            {rec.actionItems.map((item, index) => (
                              <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.description}
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    <span>Priority: {item.priority}/10</span>
                                    <span>Effort: ~{item.estimatedEffort}h</span>
                                    {item.dependencies.length > 0 && (
                                      <span>Dependencies: {item.dependencies.length}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Validation Suggestions */}
                      {rec.validationSuggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Validation Approach</h4>
                          <div className="space-y-2">
                            {rec.validationSuggestions.map((suggestion, index) => (
                              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-blue-900 capitalize">
                                    {suggestion.method.replace('_', ' ')}
                                  </div>
                                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                                    {suggestion.expectedDuration} days
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-800 mt-1">
                                  {suggestion.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                                  <span>Sample size: {suggestion.requiredSampleSize}</span>
                                  <span>Metrics: {suggestion.successMetrics.join(', ')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supporting Evidence */}
                      {rec.basedOnEvidence.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Supporting Evidence</h4>
                          <div className="space-y-2">
                            {rec.basedOnEvidence.map((evidence, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-200">
                                <div className="font-medium capitalize">{evidence.type}</div>
                                <div>{evidence.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Strength: {Math.round(evidence.strength * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        }
      </div>
    </div>
  );
}