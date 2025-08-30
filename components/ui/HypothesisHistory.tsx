"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User, 
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import { ContentHypothesis } from "@/lib/supabase";
import { getContentHypothesesByPage, recordHypothesisOutcome } from "@/app/actions/hypothesis-actions";

interface HypothesisHistoryProps {
  journeyPageId: number;
  pageType: string;
  className?: string;
}

interface HypothesisWithOutcome extends ContentHypothesis {
  isExpanded?: boolean;
}

/**
 * HypothesisHistory Component - Story 2.1 AC 2.1.5
 * 
 * Displays historical hypotheses for a journey page to provide learning context.
 * Helps admins understand what changes have been tested and their outcomes.
 */
export function HypothesisHistory({ journeyPageId, pageType, className = "" }: HypothesisHistoryProps) {
  const [hypotheses, setHypotheses] = useState<HypothesisWithOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHypothesis, setSelectedHypothesis] = useState<ContentHypothesis | null>(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [recordingOutcome, setRecordingOutcome] = useState(false);

  useEffect(() => {
    loadHypotheses();
  }, [journeyPageId]);

  const loadHypotheses = async () => {
    try {
      setLoading(true);
      setError("");
      
      const result = await getContentHypothesesByPage(journeyPageId);
      
      if (result.success && result.hypotheses) {
        setHypotheses(result.hypotheses.map(h => ({ ...h, isExpanded: false })));
      } else {
        setError(result.error || "Failed to load hypothesis history");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading hypotheses");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (hypothesisId: number) => {
    setHypotheses(prev => 
      prev.map(h => 
        h.id === hypothesisId ? { ...h, isExpanded: !h.isExpanded } : h
      )
    );
  };

  const handleRecordOutcome = async () => {
    if (!selectedHypothesis || !outcomeText.trim()) return;

    try {
      setRecordingOutcome(true);
      
      const result = await recordHypothesisOutcome(
        selectedHypothesis.id,
        outcomeText.trim(),
        "completed", // Could be enhanced to support different statuses
        {} // Could include conversion metrics
      );

      if (result.success) {
        setSelectedHypothesis(null);
        setOutcomeText("");
        await loadHypotheses(); // Refresh the list
      } else {
        setError(result.error || "Failed to record outcome");
      }
    } catch (err) {
      setError("An unexpected error occurred while recording outcome");
    } finally {
      setRecordingOutcome(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invalidated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'content':
        return <BarChart3 className="h-3 w-3" />;
      case 'title':
        return <Target className="h-3 w-3" />;
      case 'both':
        return <TrendingUp className="h-3 w-3" />;
      case 'structure':
        return <History className="h-3 w-3" />;
      default:
        return <Lightbulb className="h-3 w-3" />;
    }
  };

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Learning History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading hypothesis history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Learning History
          </CardTitle>
          <CardDescription className="text-xs">
            Previous hypotheses for the {formatPageType(pageType)} page - learn from past changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hypotheses.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hypothesis history yet</p>
              <p className="text-xs">Start editing content to build learning intelligence</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hypotheses.map((hypothesis) => (
                <div
                  key={hypothesis.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(hypothesis.status)}`}>
                        {getChangeTypeIcon(hypothesis.change_type)}
                        <span className="ml-1">{hypothesis.change_type}</span>
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(hypothesis.status)}`}>
                        {hypothesis.status}
                      </Badge>
                      {hypothesis.confidence_level && (
                        <span className="text-xs text-muted-foreground">
                          Confidence: {hypothesis.confidence_level}/10
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(hypothesis.id)}
                      className="h-6 w-6 p-0"
                    >
                      {hypothesis.isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {hypothesis.hypothesis}
                    </p>
                    {hypothesis.predicted_outcome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expected: {hypothesis.predicted_outcome}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(hypothesis.created_at)}
                    </div>
                    {hypothesis.created_by && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {hypothesis.created_by}
                      </div>
                    )}
                  </div>

                  {hypothesis.isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {hypothesis.actual_outcome ? (
                        <div className="bg-gray-50 rounded p-2">
                          <Label className="text-xs font-medium text-gray-700">Recorded Outcome:</Label>
                          <p className="text-sm mt-1">{hypothesis.actual_outcome}</p>
                          {hypothesis.outcome_recorded_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Recorded: {formatDate(hypothesis.outcome_recorded_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHypothesis(hypothesis)}
                            className="text-xs"
                          >
                            Record Outcome
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outcome Recording Modal-like Card */}
      {selectedHypothesis && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-900">Record Learning Outcome</CardTitle>
            <CardDescription className="text-xs text-blue-700">
              Document the results of this hypothesis to build conversion intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded p-2 border border-blue-200">
              <Label className="text-xs font-medium text-blue-700">Original Hypothesis:</Label>
              <p className="text-sm mt-1 text-blue-900">{selectedHypothesis.hypothesis}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outcome" className="text-sm font-medium text-blue-900">
                What was the actual result?
              </Label>
              <Textarea
                id="outcome"
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                placeholder="Describe what actually happened after implementing this change. Did it improve conversion? What metrics changed?"
                rows={3}
                className="bg-white border-blue-200 focus:border-blue-300"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRecordOutcome}
                disabled={!outcomeText.trim() || recordingOutcome}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {recordingOutcome ? "Recording..." : "Record Outcome"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedHypothesis(null);
                  setOutcomeText("");
                }}
                disabled={recordingOutcome}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}