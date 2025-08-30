"use client";

import React, { useState, useTransition } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "./dialog";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Alert, AlertDescription } from "./alert";
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  HelpCircle,
  CheckCircle,
  ArrowRight,
  BarChart3
} from "lucide-react";
import { ContentChangeType } from "@/lib/supabase";
import { createContentHypothesis } from "@/app/actions/hypothesis-actions";

interface HypothesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hypothesisId: number) => void;
  journeyPageId: number;
  currentTitle: string;
  currentContent: string;
  pageType: string;
}

// Example hypotheses by page type for guidance (AC 2.1.3)
const HYPOTHESIS_EXAMPLES: Record<string, { hypothesis: string; outcome: string; context: string }[]> = {
  activation: [
    {
      hypothesis: "Simplifying the benefit descriptions will reduce decision paralysis and increase activation rate",
      outcome: "Expect 15-25% increase in activation clicks and reduced time-on-page",
      context: "Current benefits use technical jargon that might confuse non-technical decision makers"
    },
    {
      hypothesis: "Adding social proof elements will increase trust and conversion",
      outcome: "Expect higher engagement and reduced bounce rate on this page",
      context: "Users need validation that others have successfully used our service"
    }
  ],
  agreement: [
    {
      hypothesis: "Breaking down complex terms into digestible sections will improve comprehension and reduce abandonment",
      outcome: "Expect faster scroll-through and higher agreement completion rate",
      context: "Legal language can be overwhelming and cause users to abandon the process"
    },
    {
      hypothesis: "Highlighting key benefits within the agreement will maintain engagement",
      outcome: "Expect users to spend appropriate time reviewing instead of skipping",
      context: "Users often skim agreements without understanding the value propositions"
    }
  ],
  confirmation: [
    {
      hypothesis: "Adding clear next steps will reduce post-signup confusion and support tickets",
      outcome: "Expect fewer 'what happens next' inquiries and smoother onboarding",
      context: "Users are often unclear about the process after completing their agreement"
    },
    {
      hypothesis: "Emphasizing the value received will increase satisfaction and reduce buyer's remorse",
      outcome: "Expect higher Net Promoter Score and fewer refund requests",
      context: "Users may question their decision immediately after completing the purchase"
    }
  ],
  processing: [
    {
      hypothesis: "Providing detailed timeline expectations will reduce anxiety and support inquiries",
      outcome: "Expect fewer 'status update' requests and higher client satisfaction scores",
      context: "Users are anxious about delivery timelines and progress visibility"
    },
    {
      hypothesis: "Adding progress indicators will improve perceived service quality",
      outcome: "Expect higher engagement with status updates and reduced churn",
      context: "Users prefer transparency about work progress and deliverable status"
    }
  ]
};

// Hypothesis quality tips
const QUALITY_TIPS = [
  "Be specific about the user behavior or mindset you're targeting",
  "Connect the change to a measurable business outcome",
  "Consider the user's emotional state at this stage of the journey",
  "Think about what friction or confusion you're trying to remove",
  "Reference data, feedback, or observations that support your hypothesis"
];

/**
 * Enhanced HypothesisModal Component - Story 2.1 AC 2.1.3
 * 
 * Provides comprehensive guidance, examples, and UX improvements for hypothesis capture.
 * Ensures admins understand how to write effective hypotheses for conversion learning.
 */
export function HypothesisModal({
  isOpen,
  onClose,
  onSuccess,
  journeyPageId,
  currentTitle,
  currentContent,
  pageType
}: HypothesisModalProps) {
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [hypothesis, setHypothesis] = useState("");
  const [changeType, setChangeType] = useState<ContentChangeType>("content");
  const [predictedOutcome, setPredictedOutcome] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState([7]);
  const [error, setError] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hypothesis.trim()) {
      setError("Please enter your hypothesis about why this change will improve conversion.");
      return;
    }

    startTransition(async () => {
      try {
        const previousContent = JSON.stringify({
          title: currentTitle,
          content: currentContent
        });

        const result = await createContentHypothesis(
          journeyPageId,
          hypothesis.trim(),
          changeType,
          predictedOutcome.trim() || undefined,
          confidenceLevel[0],
          previousContent,
          "admin" // TODO: Get actual user ID when auth is implemented
        );

        if (result.success && result.hypothesis) {
          onSuccess(result.hypothesis.id);
          handleClose();
        } else {
          setError(result.error || "Failed to save hypothesis");
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleClose = () => {
    setHypothesis("");
    setChangeType("content");
    setPredictedOutcome("");
    setConfidenceLevel([7]);
    setError("");
    onClose();
  };

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const useExampleHypothesis = (example: { hypothesis: string; outcome: string; context: string }) => {
    setHypothesis(example.hypothesis);
    setPredictedOutcome(example.outcome);
    setShowExamples(false);
  };

  const getChangeTypeDescription = (type: ContentChangeType) => {
    switch (type) {
      case 'content':
        return 'Modifying the main body text, descriptions, or explanations';
      case 'title':
        return 'Changing headlines, page titles, or main headings';
      case 'both':
        return 'Updating both the title and content sections';
      case 'structure':
        return 'Reorganizing layout, flow, or presentation structure';
      default:
        return 'Select the type of change you plan to make';
    }
  };

  const getConfidenceLabel = (level: number) => {
    if (level <= 3) return 'Experimental - Testing an idea';
    if (level <= 6) return 'Moderate - Based on some evidence';
    if (level <= 8) return 'Confident - Supported by data/feedback';
    return 'Very Confident - Strong evidence base';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            Capture Learning Hypothesis
          </DialogTitle>
          <DialogDescription>
            Before editing the <strong>{formatPageType(pageType)}</strong> page, help us understand your reasoning. 
            This builds conversion intelligence from every change we make.
          </DialogDescription>
          
          {/* Revenue Intelligence Context Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Target className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Revenue Intelligence:</strong> Each hypothesis teaches us what drives conversion. 
              Your reasoning becomes organizational learning that improves future decisions.
            </AlertDescription>
          </Alert>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hypothesis Input with Enhanced Guidance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hypothesis" className="text-sm font-medium">
                Why do you think this change will improve conversion? <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="text-xs"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Tips
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Examples
                </Button>
              </div>
            </div>
            
            {/* Quality Tips */}
            {showTips && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Writing Effective Hypotheses</span>
                    </div>
                    <ul className="space-y-1 text-xs text-green-800">
                      {QUALITY_TIPS.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Page-Specific Examples */}
            {showExamples && HYPOTHESIS_EXAMPLES[pageType] && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">
                        Example Hypotheses for {formatPageType(pageType)} Pages
                      </span>
                    </div>
                    {HYPOTHESIS_EXAMPLES[pageType].map((example, index) => (
                      <div key={index} className="bg-white border border-orange-200 rounded-lg p-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-orange-900">{example.hypothesis}</p>
                          <p className="text-xs text-orange-700">
                            <strong>Expected:</strong> {example.outcome}
                          </p>
                          <p className="text-xs text-orange-600">
                            <strong>Context:</strong> {example.context}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => useExampleHypothesis(example)}
                            className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            Use This Example
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Textarea
              id="hypothesis"
              placeholder={`Example: "${HYPOTHESIS_EXAMPLES[pageType]?.[0]?.hypothesis || 'Simplifying the language will reduce confusion and increase client engagement because the current technical terms are creating hesitation during the decision process'}"`}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the user behavior, friction point, or opportunity you're addressing.
            </p>
          </div>

          {/* Enhanced Change Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="change-type" className="text-sm font-medium">
              What type of change are you making?
            </Label>
            <Select value={changeType} onValueChange={(value) => setChangeType(value as ContentChangeType)}>
              <SelectTrigger id="change-type">
                <SelectValue placeholder="Select change type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">
                  <div className="flex flex-col">
                    <span>Content Only</span>
                    <span className="text-xs text-muted-foreground">Body text, descriptions, explanations</span>
                  </div>
                </SelectItem>
                <SelectItem value="title">
                  <div className="flex flex-col">
                    <span>Title Only</span>
                    <span className="text-xs text-muted-foreground">Headlines, page titles, main headings</span>
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex flex-col">
                    <span>Title & Content</span>
                    <span className="text-xs text-muted-foreground">Comprehensive page updates</span>
                  </div>
                </SelectItem>
                <SelectItem value="structure">
                  <div className="flex flex-col">
                    <span>Structure/Layout</span>
                    <span className="text-xs text-muted-foreground">Organization, flow, presentation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getChangeTypeDescription(changeType)}
            </p>
          </div>

          {/* Enhanced Predicted Outcome */}
          <div className="space-y-3">
            <Label htmlFor="predicted-outcome" className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              What specific outcome do you expect? <span className="text-gray-400">(Recommended)</span>
            </Label>
            <Textarea
              id="predicted-outcome"
              placeholder={`Example: "${HYPOTHESIS_EXAMPLES[pageType]?.[0]?.outcome || 'Expect 15-25% increase in activation rate, faster decision time, and fewer clarification questions from clients'}"`}
              value={predictedOutcome}
              onChange={(e) => setPredictedOutcome(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isPending}
            />
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-700">
                <strong>💡 Pro tip:</strong> Specific, measurable predictions help you evaluate success later. 
                Consider metrics like engagement time, conversion rate, support tickets, or user feedback.
              </p>
            </div>
          </div>

          {/* Enhanced Confidence Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Confidence Level
              </Label>
              <div className="text-right">
                <span className="text-sm text-gray-900 font-medium">
                  {confidenceLevel[0]}/10
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {getConfidenceLabel(confidenceLevel[0])}
                </Badge>
              </div>
            </div>
            <div className="px-1">
              <Slider
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
                disabled={isPending}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>1-3: Experimental</span>
              <span>4-6: Moderate</span>
              <span>7-8: Confident</span>
              <span>9-10: Very Confident</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="text-xs text-purple-700">
                <strong>Confidence reflects:</strong> How much evidence (data, feedback, testing) supports your hypothesis. 
                Lower confidence = worth testing, Higher confidence = expect strong results.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !hypothesis.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving Hypothesis...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Save Hypothesis & Start Editing
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}