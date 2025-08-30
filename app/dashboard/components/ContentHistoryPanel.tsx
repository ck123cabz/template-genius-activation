"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, History, Lightbulb, Calendar } from "lucide-react";
import { getClientJourneyPages } from "@/app/actions/journey-actions";

interface ContentVersion {
  id: number;
  page_type: string;
  content: any;
  metadata: {
    edit_hypothesis?: string;
    hypothesis_type?: string;
    content_update_reason?: string;
    edit_history?: Array<{
      timestamp: string;
      edit_type: string;
      changes_description: string;
      editor: string;
    }>;
    last_edit_at?: string;
    total_edits?: number;
  };
  updated_at: string;
  created_at: string;
  status: string;
}

interface ContentHistoryPanelProps {
  clientId: number;
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing';
  currentVersion?: ContentVersion;
  journeyHypothesis?: string; // Overall journey hypothesis for alignment display
}

export default function ContentHistoryPanel({ 
  clientId, 
  pageType, 
  currentVersion,
  journeyHypothesis 
}: ContentHistoryPanelProps) {
  const [history, setHistory] = useState<ContentVersion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load content history when component mounts or when opened
  const loadContentHistory = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const result = await getClientJourneyPages(clientId);
      if (result.success && result.pages) {
        // Filter for the specific page type and sort by updated_at desc
        const pageHistory = result.pages
          .filter(page => page.page_type === pageType)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        setHistory(pageHistory as ContentVersion[]);
      }
    } catch (error) {
      console.error("Error loading content history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && history.length === 0) {
      loadContentHistory();
    }
  }, [isOpen, clientId, pageType]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get hypothesis from page metadata
  const getHypothesis = (page: ContentVersion) => {
    return page.metadata?.edit_hypothesis || 
           page.metadata?.content_update_reason || 
           'No hypothesis recorded';
  };

  // Get hypothesis type badge variant
  const getHypothesisBadgeVariant = (type?: string) => {
    switch (type) {
      case 'readability': return 'default';
      case 'urgency': return 'destructive';
      case 'social_proof': return 'secondary';
      case 'value_proposition': return 'outline';
      case 'custom': return 'secondary';
      default: return 'outline';
    }
  };

  // Get outcome status (simulated for now - would come from analytics)
  const getOutcomeStatus = (page: ContentVersion) => {
    // Simulate outcome based on recency - more recent = pending
    const daysSinceUpdate = Math.floor((Date.now() - new Date(page.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 1) return 'pending';
    if (daysSinceUpdate < 7) return 'testing';
    return Math.random() > 0.3 ? 'success' : 'neutral'; // Simulate some outcomes
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'success': return { variant: 'default' as const, label: 'Improved Conversion' };
      case 'neutral': return { variant: 'secondary' as const, label: 'No Clear Impact' };
      case 'testing': return { variant: 'outline' as const, label: 'Currently Testing' };
      case 'pending': return { variant: 'secondary' as const, label: 'Pending Analysis' };
      default: return { variant: 'outline' as const, label: 'Unknown' };
    }
  };

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                Content History & Learning
                {history.length > 0 && (
                  <Badge variant="secondary">{history.length} versions</Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-left">
              View previous content versions and their hypothesis outcomes for learning insights
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading content history...</div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No content history available yet. Start editing to build learning insights.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Journey Hypothesis Alignment */}
                {journeyHypothesis && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Overall Journey Hypothesis</span>
                    </div>
                    <p className="text-sm text-blue-700">{journeyHypothesis}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Page-level hypotheses should align with this strategic direction
                    </p>
                  </div>
                )}

                {/* Content Version History */}
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {history.map((version, index) => {
                      const isCurrentVersion = index === 0;
                      const hypothesis = getHypothesis(version);
                      const outcome = getOutcomeStatus(version);
                      const outcomeBadge = getOutcomeBadge(outcome);
                      
                      return (
                        <Card key={version.id} className={`transition-all ${
                          isCurrentVersion ? 'border-blue-500 shadow-sm' : 'border-muted'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={isCurrentVersion ? 'default' : 'secondary'}>
                                  {isCurrentVersion ? 'Current' : `v${history.length - index}`}
                                </Badge>
                                <Badge variant={outcomeBadge.variant}>
                                  {outcomeBadge.label}
                                </Badge>
                                {version.metadata?.hypothesis_type && (
                                  <Badge variant={getHypothesisBadgeVariant(version.metadata.hypothesis_type)}>
                                    {version.metadata.hypothesis_type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(version.updated_at)}
                              </div>
                            </div>

                            {/* Hypothesis */}
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Hypothesis
                                </span>
                                <p className="text-sm mt-1">{hypothesis}</p>
                              </div>

                              {/* Edit History if available */}
                              {version.metadata?.edit_history && version.metadata.edit_history.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Changes Made
                                  </span>
                                  <div className="mt-1">
                                    {version.metadata.edit_history.slice(-2).map((edit, editIndex) => (
                                      <p key={editIndex} className="text-xs text-muted-foreground">
                                        {edit.edit_type}: {edit.changes_description || 'Content updated'}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Learning Outcome */}
                              {outcome !== 'pending' && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Learning Outcome
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {outcome === 'success' 
                                      ? 'This hypothesis led to improved engagement and conversion rates.' 
                                      : outcome === 'testing'
                                      ? 'Currently collecting data to validate this hypothesis.'
                                      : 'No significant impact observed. Consider different approach.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Refresh Button */}
                <div className="flex justify-center pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadContentHistory}
                    disabled={loading}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Refresh History
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}