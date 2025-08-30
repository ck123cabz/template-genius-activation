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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Capture Learning Hypothesis
          </DialogTitle>
          <DialogDescription>
            Before editing the <strong>{formatPageType(pageType)}</strong> page, help us understand your reasoning. 
            This helps build conversion intelligence from every change we make.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hypothesis Input */}
          <div className="space-y-2">
            <Label htmlFor="hypothesis" className="text-sm font-medium">
              Why do you think this change will improve conversion? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="hypothesis"
              placeholder="Example: 'Simplifying the language will reduce confusion and increase client engagement because the current technical terms are creating hesitation during the decision process...'"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isPending}
            />
          </div>

          {/* Change Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="change-type" className="text-sm font-medium">
              What type of change are you making?
            </Label>
            <Select value={changeType} onValueChange={(value) => setChangeType(value as ContentChangeType)}>
              <SelectTrigger id="change-type">
                <SelectValue placeholder="Select change type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">Content Only</SelectItem>
                <SelectItem value="title">Title Only</SelectItem>
                <SelectItem value="both">Title & Content</SelectItem>
                <SelectItem value="structure">Structure/Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predicted Outcome */}
          <div className="space-y-2">
            <Label htmlFor="predicted-outcome" className="text-sm font-medium">
              What specific outcome do you expect? <span className="text-gray-400">(Optional)</span>
            </Label>
            <Textarea
              id="predicted-outcome"
              placeholder="Example: 'Expect 15-25% increase in activation rate, faster decision time, and fewer clarification questions from clients...'"
              value={predictedOutcome}
              onChange={(e) => setPredictedOutcome(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isPending}
            />
          </div>

          {/* Confidence Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Confidence Level
              </Label>
              <span className="text-sm text-gray-600 font-medium">
                {confidenceLevel[0]}/10
              </span>
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
              <span>Low Confidence</span>
              <span>High Confidence</span>
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
            >
              {isPending ? "Saving..." : "Save Hypothesis & Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}