"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  BarChart3,
  DollarSign,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { OutcomeStatusBadge, QuickOutcomeSelector } from "./OutcomeStatusBadge";
import { recordJourneyOutcome, OutcomeFormState } from "@/app/actions/outcome-actions";
import { useToast } from "@/components/ui/use-toast";
import { Client } from "@/lib/supabase";

type JourneyOutcome = 'paid' | 'ghosted' | 'pending' | 'negotiating' | 'declined';

interface OutcomeModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

const initialState: OutcomeFormState = { success: false };

export function OutcomeModal({ client, isOpen, onClose }: OutcomeModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<JourneyOutcome>(
    (client.journey_outcome || 'pending') as JourneyOutcome
  );
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(recordJourneyOutcome, initialState);
  const { toast } = useToast();

  // Calculate journey stats
  const journeyDays = Math.floor(
    (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      // Add client_id and selected outcome to form data
      formData.append("client_id", client.id.toString());
      formData.append("journey_outcome", selectedOutcome);
      
      const result = await formAction(formData);
      
      if (result.success) {
        toast({
          title: "Outcome recorded successfully",
          description: `Journey outcome for ${client.company} has been updated`,
        });
        onClose();
      } else if (result.error) {
        toast({
          title: "Failed to record outcome",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Journey Outcome Analysis</span>
          </DialogTitle>
          <DialogDescription>
            Record and analyze the outcome of {client.company}'s journey to capture learning insights
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <Tabs defaultValue="outcome" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="outcome">Outcome</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            {/* Client Context Card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-3 text-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    {client.logo ? (
                      <img
                        src={client.logo}
                        alt={client.company}
                        className="w-8 h-8 rounded"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span>{client.company}</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {client.contact} • {client.position}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Journey Duration</p>
                      <p className="text-sm font-medium">{journeyDays} days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={client.status === "activated" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salary Range</p>
                      <p className="text-sm font-medium">{client.salary}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Current Outcome</p>
                      <OutcomeStatusBadge 
                        outcome={(client.journey_outcome || 'pending') as JourneyOutcome}
                        revenue={client.revenue_amount}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                {client.hypothesis && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Original Journey Hypothesis:</p>
                    <p className="text-sm text-muted-foreground">{client.hypothesis}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <TabsContent value="outcome" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Journey Outcome</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the final outcome of this client's journey
                  </p>
                  <QuickOutcomeSelector
                    currentOutcome={selectedOutcome}
                    onOutcomeSelect={setSelectedOutcome}
                    disabled={isPending}
                  />
                </div>

                {selectedOutcome === 'paid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="revenue_amount">Revenue Amount</Label>
                      <Input
                        id="revenue_amount"
                        name="revenue_amount"
                        type="number"
                        step="0.01"
                        placeholder="5000.00"
                        disabled={isPending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Select name="payment_terms" disabled={isPending}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment structure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placement_fee">25% Placement Fee</SelectItem>
                          <SelectItem value="monthly_retainer">Monthly Retainer</SelectItem>
                          <SelectItem value="custom">Custom Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="outcome_notes">Outcome Details</Label>
                  <Textarea
                    id="outcome_notes"
                    name="outcome_notes"
                    placeholder="Describe what happened, key events, timeline, etc..."
                    rows={4}
                    disabled={isPending}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="conversion_factors" className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Conversion Factors</span>
                  </Label>
                  <Textarea
                    id="conversion_factors"
                    name="conversion_factors"
                    placeholder="What factors led to this outcome? E.g., pricing, timing, competitor comparison, specific benefits..."
                    rows={3}
                    disabled={isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="missed_opportunities" className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Missed Opportunities</span>
                  </Label>
                  <Textarea
                    id="missed_opportunities"
                    name="missed_opportunities"
                    placeholder="What could have been done differently? Missed signals, better timing, different approach..."
                    rows={3}
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="confidence_in_analysis">Confidence in Analysis</Label>
                    <Select name="confidence_in_analysis" disabled={isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate your confidence (1-10)" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} - {i < 3 ? "Low" : i < 7 ? "Medium" : "High"} Confidence
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primary_decision_factor">Primary Decision Factor</Label>
                    <Select name="primary_decision_factor" disabled={isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="What drove the decision?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price/Cost</SelectItem>
                        <SelectItem value="timeline">Timeline/Speed</SelectItem>
                        <SelectItem value="quality">Service Quality</SelectItem>
                        <SelectItem value="trust">Trust/Relationship</SelectItem>
                        <SelectItem value="features">Features/Benefits</SelectItem>
                        <SelectItem value="competitor">Competitor Comparison</SelectItem>
                        <SelectItem value="timing">Market Timing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hypothesis_accuracy" className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Hypothesis Accuracy</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    How accurate was the original journey hypothesis?
                  </p>
                  <Select name="hypothesis_accuracy" disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assess hypothesis accuracy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accurate">Accurate - Hypothesis matched outcome</SelectItem>
                      <SelectItem value="partially_accurate">Partially Accurate - Some aspects correct</SelectItem>
                      <SelectItem value="inaccurate">Inaccurate - Hypothesis was wrong</SelectItem>
                      <SelectItem value="unknown">Unknown - Insufficient data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hypothesis_validation">Hypothesis Validation Notes</Label>
                  <Textarea
                    id="hypothesis_validation"
                    name="hypothesis_validation"
                    placeholder="Explain how the outcome validates or contradicts the original hypothesis..."
                    rows={3}
                    disabled={isPending}
                  />
                </div>

                {client.hypothesis && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Original Hypothesis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{client.hypothesis}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="next_time_improvements" className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Next Time Improvements</span>
                  </Label>
                  <Textarea
                    id="next_time_improvements"
                    name="next_time_improvements"
                    placeholder="What would you do differently for similar clients? Process improvements, better qualification, different approach..."
                    rows={4}
                    disabled={isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="pattern_insights">Pattern Insights</Label>
                  <Textarea
                    id="pattern_insights"
                    name="pattern_insights"
                    placeholder="What patterns do you see? Industry-specific insights, client type behaviors, seasonal trends..."
                    rows={3}
                    disabled={isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="future_hypothesis">Future Client Hypothesis</Label>
                  <Textarea
                    id="future_hypothesis"
                    name="future_hypothesis"
                    placeholder="Based on this learning, what would be your hypothesis for similar future clients?"
                    rows={3}
                    disabled={isPending}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {state?.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {state.error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
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
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? "Recording..." : "Record Outcome"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}