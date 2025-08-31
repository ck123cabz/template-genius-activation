"use client";

import { useState, useEffect } from "react";
import { ContentHypothesis, getHypothesesByPageId, getHypothesisAnalytics } from "@/app/actions/hypothesis-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  History,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  BarChart3,
  Eye,
  Lightbulb,
  Calendar,
} from "lucide-react";

interface HypothesisHistoryProps {
  journeyPageId: number;
  onHypothesisSelect?: (hypothesis: ContentHypothesis) => void;
}

export function HypothesisHistory({ journeyPageId, onHypothesisSelect }: HypothesisHistoryProps) {
  const [hypotheses, setHypotheses] = useState<ContentHypothesis[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadHypothesesData();
  }, [journeyPageId]);

  const loadHypothesesData = async () => {
    setLoading(true);
    try {
      const [hypothesesResult, analyticsResult] = await Promise.all([
        getHypothesesByPageId(journeyPageId),
        getHypothesisAnalytics(journeyPageId)
      ]);

      if (hypothesesResult.success && hypothesesResult.hypotheses) {
        setHypotheses(hypothesesResult.hypotheses);
      }

      if (analyticsResult.success && analyticsResult.analytics) {
        setAnalytics(analyticsResult.analytics);
      }
    } catch (error) {
      console.error("Error loading hypotheses data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-3 w-3 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeEmoji = (changeType: string) => {
    switch (changeType) {
      case 'content':
        return '📝';
      case 'title':
        return '🏷️';
      case 'both':
        return '📝🏷️';
      case 'structure':
        return '🏗️';
      default:
        return '✏️';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Hypothesis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Learning Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-lg">{analytics.total_hypotheses}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-lg">{analytics.active_hypotheses}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
            </div>
            
            {analytics.total_hypotheses > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Avg. Confidence:</span>
                    <Badge variant="outline">{analytics.average_confidence}/10</Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Change Types:</div>
                  {Object.entries(analytics.change_type_distribution).map(([type, count]) => (
                    count > 0 && (
                      <div key={type} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1">
                          <span>{getChangeTypeEmoji(type)}</span>
                          <span className="capitalize">{type}</span>
                        </span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    )
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hypotheses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-orange-600" />
              Recent Hypotheses
              {hypotheses.length > 0 && (
                <Badge variant="secondary">{hypotheses.length}</Badge>
              )}
            </div>
            {hypotheses.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? "Show Less" : "Show All"}
              </Button>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Track learning patterns and outcomes for this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className={expanded ? "h-96" : "h-64"}>
            {hypotheses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hypotheses yet</p>
                <p className="text-xs">Create your first hypothesis when editing content</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(expanded ? hypotheses : hypotheses.slice(0, 3)).map((hypothesis, index) => (
                  <Card 
                    key={hypothesis.id} 
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      hypothesis.status === 'active' ? 'border-blue-200 bg-blue-50/30' : ''
                    }`}
                    onClick={() => onHypothesisSelect?.(hypothesis)}
                  >
                    <CardContent className="pt-3">
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(hypothesis.status)}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusBadgeClass(hypothesis.status)}`}
                            >
                              {hypothesis.status}
                            </Badge>
                            <span className="text-xs">{getChangeTypeEmoji(hypothesis.change_type)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {hypothesis.confidence_level}/10
                            </Badge>
                            {hypothesis.status === 'active' && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Hypothesis Text */}
                        <p className="text-xs text-gray-900 leading-relaxed">
                          {hypothesis.hypothesis.length > 120
                            ? `${hypothesis.hypothesis.substring(0, 120)}...`
                            : hypothesis.hypothesis
                          }
                        </p>

                        {/* Predicted vs Actual Outcome */}
                        {(hypothesis.predicted_outcome || hypothesis.actual_outcome) && (
                          <div className="space-y-1">
                            {hypothesis.predicted_outcome && (
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <div className="flex items-center gap-1 font-medium text-blue-800">
                                  <Target className="h-3 w-3" />
                                  Predicted:
                                </div>
                                <p className="text-blue-700 mt-1">{hypothesis.predicted_outcome}</p>
                              </div>
                            )}
                            {hypothesis.actual_outcome && (
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                                <div className="flex items-center gap-1 font-medium text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Actual Outcome:
                                </div>
                                <p className="text-green-700 mt-1">{hypothesis.actual_outcome}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {hypothesis.created_at && formatTimeAgo(hypothesis.created_at)}
                            </span>
                          </div>
                          <span className="capitalize">{hypothesis.change_type} change</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!expanded && hypotheses.length > 3 && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(true)}
                      className="text-xs text-muted-foreground"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show {hypotheses.length - 3} more hypotheses
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Learning Insights */}
      {hypotheses.length > 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="p-2 bg-orange-50 border border-orange-200 rounded">
              <p className="font-medium text-orange-800">Pattern Recognition</p>
              <p className="text-orange-700 mt-1">
                You've tested {hypotheses.length} hypotheses on this page. 
                {analytics?.completed_hypotheses > 0 && (
                  <> {analytics.completed_hypotheses} have recorded outcomes.</>
                )}
              </p>
            </div>
            {analytics?.average_confidence < 6 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="font-medium text-blue-800">💡 Tip</p>
                <p className="text-blue-700 mt-1">
                  Consider gathering more data before changes - your confidence scores suggest more research might help.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}