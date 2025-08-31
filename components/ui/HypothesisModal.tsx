"use client";

import { useState, useTransition, useEffect } from "react";
import { ContentHypothesis, ContentChangeType, createHypothesis, getHypothesesByPageId } from "@/app/actions/hypothesis-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  History,
  Lightbulb,
  Target,
  X,
  Info,
} from "lucide-react";

interface HypothesisModalProps {
  isOpen: boolean;
  onClose: (hypothesis?: ContentHypothesis) => void;
  journeyPageId: number;
  pageTitle: string;
  previousContent?: string;
  canBypass?: boolean; // For backward compatibility, but we'll prevent bypass by default
}

export function HypothesisModal({ 
  isOpen, 
  onClose, 
  journeyPageId, 
  pageTitle, 
  previousContent,
  canBypass = false 
}: HypothesisModalProps) {
  const [isPending, startTransition] = useTransition();
  const [existingHypotheses, setExistingHypotheses] = useState<ContentHypothesis[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [hypothesis, setHypothesis] = useState("");
  const [changeType, setChangeType] = useState<ContentChangeType>("content");
  const [predictedOutcome, setPredictedOutcome] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState([7]);

  // Load existing hypotheses when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingHypotheses();
    }
  }, [isOpen, journeyPageId]);

  const loadExistingHypotheses = async () => {
    try {
      const result = await getHypothesesByPageId(journeyPageId);
      if (result.success && result.hypotheses) {
        setExistingHypotheses(result.hypotheses);
      }
    } catch (error) {
      console.error("Error loading existing hypotheses:", error);
    }
  };

  const handleSubmit = () => {
    if (hypothesis.trim().length < 20) {
      setError("Hypothesis must be at least 20 characters long");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await createHypothesis({
          journey_page_id: journeyPageId,
          hypothesis: hypothesis.trim(),
          change_type: changeType,
          predicted_outcome: predictedOutcome.trim() || undefined,
          confidence_level: confidenceLevel[0],
          previous_content: previousContent,
        });

        if (result.success && result.hypothesis) {
          onClose(result.hypothesis);
          resetForm();
        } else {
          setError(result.error || "Failed to create hypothesis");
        }
      } catch (error) {
        setError("An unexpected error occurred");
      }
    });
  };

  const handleCancel = () => {
    if (canBypass) {
      onClose();
    } else {
      setError("You must create a hypothesis before making changes to this page");
    }
    resetForm();
  };

  const resetForm = () => {
    setHypothesis("");
    setChangeType("content");
    setPredictedOutcome("");
    setConfidenceLevel([7]);
    setError(null);
  };

  const getChangeTypeDescription = (type: ContentChangeType) => {
    switch (type) {
      case 'content':
        return 'Modifying the main page content or messaging';
      case 'title':
        return 'Changing the page title or heading';
      case 'both':
        return 'Updating both title and content';
      case 'structure':
        return 'Changing layout, components, or page structure';
      default:
        return 'Content modification';
    }
  };

  const getConfidenceDescription = (level: number) => {
    if (level <= 3) return 'Low confidence - Experimental change';
    if (level <= 6) return 'Medium confidence - Based on some data/feedback';
    if (level <= 8) return 'High confidence - Strong evidence supports this change';
    return 'Very high confidence - Data-driven, tested approach';
  };

  // Prevent closing modal by clicking outside or pressing escape unless bypass is enabled
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canBypass) {
      setError("You must create a hypothesis before making changes to this page");
      return;
    }
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        onEscapeKeyDown={(e) => {
          if (!canBypass) {
            e.preventDefault();
            setError("You must create a hypothesis before making changes to this page");
          }
        }}
        onPointerDownOutside={(e) => {
          if (!canBypass) {
            e.preventDefault();
            setError("You must create a hypothesis before making changes to this page");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            Create Learning Hypothesis - {pageTitle}
          </DialogTitle>
          <DialogDescription>
            Document your hypothesis before making changes to capture learning and track what drives conversions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hypothesis Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Hypothesis Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Your Hypothesis
                </CardTitle>
                <CardDescription>
                  Describe what you believe this change will accomplish and why.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hypothesis">Hypothesis Statement *</Label>
                  <Textarea
                    id="hypothesis"
                    value={hypothesis}
                    onChange={(e) => setHypothesis(e.target.value)}
                    placeholder="I believe that changing [what] will result in [expected outcome] because [reasoning]..."
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Be specific about what you expect to happen and why</span>
                    <span className={hypothesis.length < 20 ? "text-red-500" : "text-green-600"}>
                      {hypothesis.length}/20 min
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="change-type">Change Type *</Label>
                    <Select value={changeType} onValueChange={(value) => setChangeType(value as ContentChangeType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">📝 Content Only</SelectItem>
                        <SelectItem value="title">🏷️ Title Only</SelectItem>
                        <SelectItem value="both">📝🏷️ Title & Content</SelectItem>
                        <SelectItem value="structure">🏗️ Structure/Layout</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getChangeTypeDescription(changeType)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confidence">Confidence Level: {confidenceLevel[0]}/10</Label>
                    <Slider
                      id="confidence"
                      value={confidenceLevel}
                      onValueChange={setConfidenceLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getConfidenceDescription(confidenceLevel[0])}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="predicted-outcome">Predicted Outcome (Optional)</Label>
                  <Input
                    id="predicted-outcome"
                    value={predictedOutcome}
                    onChange={(e) => setPredictedOutcome(e.target.value)}
                    placeholder="e.g., Increase conversion by 15%, Reduce drop-off rate..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    What specific result do you expect to measure?
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hypothesis Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  Good Hypothesis Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <strong>✅ Good:</strong> "I believe that adding social proof testimonials will increase conversions because prospects need validation that this solution works for similar companies."
                  </div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <strong>✅ Good:</strong> "I believe that simplifying the pricing explanation will reduce confusion and increase agreement completion because the current pricing is too complex."
                  </div>
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <strong>❌ Poor:</strong> "Testing new content" - Too vague, no reasoning or expected outcome.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isPending || hypothesis.trim().length < 20}
                className="flex-1"
              >
                {isPending ? "Creating Hypothesis..." : "Create Hypothesis & Continue"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isPending}
              >
                {canBypass ? "Cancel" : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Sidebar - Previous Hypotheses */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  Previous Hypotheses
                  {existingHypotheses.length > 0 && (
                    <Badge variant="secondary">{existingHypotheses.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Learn from past hypotheses for this page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {existingHypotheses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No previous hypotheses</p>
                      <p className="text-xs">This is your first hypothesis for this page</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {existingHypotheses.slice(0, 5).map((prevHypothesis) => (
                        <Card key={prevHypothesis.id}>
                          <CardContent className="pt-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    prevHypothesis.status === 'active' 
                                      ? 'bg-blue-100 text-blue-800'
                                      : prevHypothesis.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {prevHypothesis.status}
                                </Badge>
                                <Badge variant="secondary">
                                  {prevHypothesis.confidence_level}/10
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {prevHypothesis.hypothesis.length > 100 
                                  ? prevHypothesis.hypothesis.substring(0, 100) + "..."
                                  : prevHypothesis.hypothesis
                                }
                              </p>
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span className="capitalize">{prevHypothesis.change_type}</span>
                                <span>
                                  {prevHypothesis.created_at && 
                                    new Date(prevHypothesis.created_at).toLocaleDateString()
                                  }
                                </span>
                              </div>
                              {prevHypothesis.actual_outcome && (
                                <div className="pt-1 border-t">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-700">Outcome Recorded</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {prevHypothesis.actual_outcome.length > 80
                                      ? prevHypothesis.actual_outcome.substring(0, 80) + "..."
                                      : prevHypothesis.actual_outcome
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {existingHypotheses.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          + {existingHypotheses.length - 5} more hypotheses
                        </p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Learning Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Be specific about expected outcomes</p>
                <p>• Reference data or feedback when possible</p>
                <p>• Consider the customer's perspective</p>
                <p>• Think about measurable results</p>
                <p>• Learn from previous hypothesis outcomes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}