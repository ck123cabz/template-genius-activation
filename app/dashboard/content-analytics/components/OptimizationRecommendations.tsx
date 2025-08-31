/**
 * Optimization Recommendations Component for Story 3.3
 * Displays AI-powered content optimization recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Brain,
  Award
} from 'lucide-react';
import { getOptimizationRecommendations } from '@/app/actions/timing-analytics';

interface OptimizationRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'design' | 'timing' | 'targeting';
  title: string;
  description: string;
  expected_improvement: number;
  confidence_score: number;
  implementation_effort: 'low' | 'medium' | 'high';
  recommended_actions: string[];
  supporting_data: {
    current_metric: number;
    target_metric: number;
    sample_size: number;
    statistical_significance: number;
  };
  potential_risks: string[];
  success_criteria: string[];
  estimated_timeline: string;
}

export function OptimizationRecommendations() {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [implementedRecommendations, setImplementedRecommendations] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOptimizationRecommendations('month');
      
      if (result.success && result.recommendations) {
        setRecommendations(result.recommendations);
      } else {
        setError(result.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const markAsImplemented = (recommendationId: string) => {
    setImplementedRecommendations([...implementedRecommendations, recommendationId]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return <Brain className="w-4 h-4" />;
      case 'design': return <Zap className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'targeting': return <Target className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-red-600">Error loading recommendations: {error}</p>
              <Button onClick={loadRecommendations} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-green-700">Great Performance!</h3>
          <p className="text-muted-foreground mb-4">
            Your content is performing well. No critical optimizations needed at this time.
          </p>
          <Button onClick={loadRecommendations} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered insights to improve your content performance
          </p>
        </div>
        <Button onClick={loadRecommendations} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {recommendations.filter(r => r.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {recommendations.filter(r => r.priority === 'medium').length}
              </div>
              <div className="text-sm text-muted-foreground">Medium Priority</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{recommendations.reduce((sum, r) => sum + r.expected_improvement, 0).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Est. Improvement</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const isImplemented = implementedRecommendations.includes(recommendation.id);
          
          return (
            <Card key={recommendation.id} className={`${isImplemented ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getPriorityColor(recommendation.priority)} text-white`}>
                      {getCategoryIcon(recommendation.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <Badge className={`text-white ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority}
                        </Badge>
                        <Badge variant="outline" className={getEffortColor(recommendation.implementation_effort)}>
                          {recommendation.implementation_effort} effort
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      +{recommendation.expected_improvement}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recommendation.confidence_score}% confidence
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current vs Target */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current</p>
                      <p className="text-lg font-bold">
                        {recommendation.supporting_data.current_metric.toFixed(1)}
                        {recommendation.category === 'timing' ? 'min' : '%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Target</p>
                      <p className="text-lg font-bold text-green-600">
                        {recommendation.supporting_data.target_metric.toFixed(1)}
                        {recommendation.category === 'timing' ? 'min' : '%'}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions</h4>
                    <ul className="space-y-1">
                      {recommendation.recommended_actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Success Criteria & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Success Criteria
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {recommendation.success_criteria.map((criteria, index) => (
                          <li key={index} className="text-muted-foreground">
                            • {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Potential Risks
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {recommendation.potential_risks.map((risk, index) => (
                          <li key={index} className="text-muted-foreground">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  {/* Timeline & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Est. Timeline: {recommendation.estimated_timeline}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sample Size: {recommendation.supporting_data.sample_size}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isImplemented ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Implemented
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => markAsImplemented(recommendation.id)}>
                          Mark as Implemented
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Confidence Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Confidence Score</span>
                      <span className="font-medium">{recommendation.confidence_score}%</span>
                    </div>
                    <Progress value={recommendation.confidence_score} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}