"use client";

import { useState, useTransition, useActionState } from "react";
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
  const [state, formAction] = useActionState(recordJourneyOutcome, initialState);
  const { toast } = useToast();

  // Calculate journey stats
  const journeyDays = Math.floor(
    (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Mock payment data for development (replace with real Stripe data in production)
  const mockPaymentData = selectedOutcome === 'paid' ? {
    stripe_session_id: 'cs_test_' + Math.random().toString(36).substr(2, 9),
    stripe_payment_intent_id: 'pi_' + Math.random().toString(36).substr(2, 16),
    amount_total: (client.revenue_amount || 50000), // in cents
    payment_method_types: ['card'],
    payment_status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    frozen_journey_content: {
      journey_hypothesis: client.hypothesis,
      frozen_at: new Date().toISOString(),
      payment_source: 'activation'
    }
  } : null;

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="outcome">Outcome</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
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

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span>Detailed Outcome Notes</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Capture comprehensive details about what actually happened during this client's journey. 
                    This rich documentation enables deep learning and pattern recognition.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Timeline of Events */}
                  <div>
                    <Label htmlFor="timeline_notes" className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Timeline of Key Events</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document the chronological sequence of important interactions and decisions
                    </p>
                    <Textarea
                      id="timeline_notes"
                      name="timeline_notes"
                      placeholder="Day 1: Initial contact, client seemed interested in senior-level candidates...
Day 3: Presented 3 candidates, client focused on technical skills over culture fit...
Day 7: Client requested salary negotiations, mentioned budget constraints...
Day 14: Final decision made, chose candidate with lowest salary requirement..."
                      rows={6}
                      disabled={isPending}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Client Behavior Observations */}
                  <div>
                    <Label htmlFor="behavior_observations" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Client Behavior & Communication Patterns</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Note communication style, response patterns, decision-making approach
                    </p>
                    <Textarea
                      id="behavior_observations"
                      name="behavior_observations"
                      placeholder="Communication style: Direct, prefers email over calls
Response time: Usually responds within 24 hours
Decision-making: Highly analytical, requests detailed comparisons
Pain points: Mentioned struggling with previous recruiting experiences
Priorities: Cost-conscious, values proven track record over innovation..."
                      rows={5}
                      disabled={isPending}
                    />
                  </div>

                  {/* Revenue Intelligence */}
                  <div>
                    <Label htmlFor="revenue_intelligence" className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Revenue Intelligence & Conversion Insights</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Detailed analysis of what drove (or prevented) revenue conversion
                    </p>
                    <Textarea
                      id="revenue_intelligence"
                      name="revenue_intelligence"
                      placeholder="Conversion drivers:
- Client had previous bad experience with competitors (mentioned 3 failed hires)
- Our candidate pipeline matched their technical requirements exactly
- Pricing was competitive but not the lowest (premium justified by quality)

Revenue blockers identified:
- Initial hesitation due to budget approval process (CFO involvement required)
- Competitor offered 15% lower fee structure
- Client needed 2 weeks longer timeline than initially projected

Key revenue lessons:
- Earlier budget qualification could have streamlined process
- Emphasizing quality over price resonated more than expected
- Follow-up frequency was optimal (every 3 days)"
                      rows={6}
                      disabled={isPending}
                    />
                  </div>

                  {/* Competitive Analysis */}
                  <div>
                    <Label htmlFor="competitive_notes" className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Competitive Landscape & Differentiation</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document competitive dynamics and how we differentiated
                    </p>
                    <Textarea
                      id="competitive_notes"
                      name="competitive_notes"
                      placeholder="Competitors involved: [Company A], [Company B]
Their positioning: Lower cost, faster turnaround
Our differentiation: 
- Higher quality candidate vetting process
- Industry-specific expertise in their sector
- Proven track record with similar companies

Client's evaluation criteria:
1. Quality of candidates (weighted 40%)
2. Price (weighted 30%)
3. Timeline (weighted 20%)
4. Relationship/trust (weighted 10%)

Competitive outcome: Won based on candidate quality despite 10% higher pricing"
                      rows={5}
                      disabled={isPending}
                    />
                  </div>

                  {/* Lessons & Action Items */}
                  <div>
                    <Label htmlFor="actionable_insights" className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Actionable Insights & Future Improvements</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Specific, actionable lessons for similar future engagements
                    </p>
                    <Textarea
                      id="actionable_insights"
                      name="actionable_insights"
                      placeholder="Process improvements for next time:
□ Implement budget qualification checklist in discovery phase
□ Create competitor comparison template for this industry vertical
□ Develop pricing justification framework for premium positioning
□ Add CFO stakeholder identification to intake process

Content/messaging updates needed:
□ Develop case studies for similar company size/industry
□ Create quality differentiation materials
□ Build cost-of-bad-hire calculator for budget conversations

System/tool enhancements:
□ Add competitive intelligence tracking to CRM
□ Create timeline expectation-setting templates
□ Implement follow-up cadence recommendations by client type"
                      rows={6}
                      disabled={isPending}
                    />
                  </div>

                  {/* Tags and Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="outcome_tags">Outcome Tags</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add searchable tags for pattern recognition
                      </p>
                      <Input
                        id="outcome_tags"
                        name="outcome_tags"
                        placeholder="budget-conscious, technical-focus, slow-decision, quality-driven"
                        disabled={isPending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="learning_priority">Learning Priority</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        How important is this case for future learning?
                      </p>
                      <Select name="learning_priority" disabled={isPending}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High - Critical insights for strategy</SelectItem>
                          <SelectItem value="medium">Medium - Useful patterns identified</SelectItem>
                          <SelectItem value="low">Low - Standard engagement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* NEW: Payment Tab - Story 2.4 */}
            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span>Payment Intelligence & Revenue Correlation</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic payment tracking and revenue correlation from Stripe integration. 
                    This data links payment events with journey outcomes for precise revenue intelligence.
                  </p>
                </div>

                {selectedOutcome === 'paid' && mockPaymentData ? (
                  <div className="space-y-6">
                    {/* Payment Status Overview */}
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-800 flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Payment Confirmed</span>
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            SUCCEEDED
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-green-600 font-medium">Amount Paid</p>
                            <p className="text-lg font-bold text-green-800">
                              ${(mockPaymentData.amount_total / 100).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium">Payment Method</p>
                            <p className="text-sm font-medium text-green-700">
                              {mockPaymentData.payment_method_types.join(', ').toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium">Processed</p>
                            <p className="text-sm font-medium text-green-700">
                              {new Date(mockPaymentData.created * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stripe Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Transaction IDs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Session ID</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">
                                {mockPaymentData.stripe_session_id}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Payment Intent</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">
                                {mockPaymentData.stripe_payment_intent_id}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Revenue Correlation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Journey Duration to Payment</Label>
                              <p className="text-sm font-medium">{journeyDays} days</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Conversion Rate</Label>
                              <p className="text-sm font-medium text-green-600">
                                {((mockPaymentData.amount_total / 100) / journeyDays).toFixed(2)} $/day
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Payment Source</Label>
                              <p className="text-sm font-medium capitalize">
                                {mockPaymentData.frozen_journey_content?.payment_source || 'activation'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Journey Content Correlation */}
                    {mockPaymentData.frozen_journey_content && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Journey-Payment Correlation</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Journey content frozen at payment time for accurate correlation analysis
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Active Hypothesis at Payment</Label>
                              <p className="text-sm bg-muted p-3 rounded">
                                {mockPaymentData.frozen_journey_content.journey_hypothesis || "No hypothesis recorded"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Content Frozen</Label>
                                <p className="text-sm font-medium">
                                  {new Date(mockPaymentData.frozen_journey_content.frozen_at).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Payment Channel</Label>
                                <p className="text-sm font-medium capitalize">
                                  {mockPaymentData.frozen_journey_content.payment_source}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Revenue Intelligence Fields */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment_correlation_notes" className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>Payment-Journey Correlation Analysis</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Analyze how journey content and timing influenced the payment decision
                        </p>
                        <Textarea
                          id="payment_correlation_notes"
                          name="payment_correlation_notes"
                          placeholder="Payment correlation insights:
- Client paid {amount} after {days} days in journey
- Active hypothesis at payment: '{hypothesis}'
- Key conversion moments: page views, content engagement
- Payment trigger: specific content, timeline pressure, offer expiry
- Revenue lessons: what content/timing drove the payment decision"
                          rows={5}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label htmlFor="revenue_optimization_notes" className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Revenue Optimization Insights</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          What can we learn to optimize revenue from similar future clients?
                        </p>
                        <Textarea
                          id="revenue_optimization_notes"
                          name="revenue_optimization_notes"
                          placeholder="Revenue optimization opportunities:
- Faster payment path: could this client have paid earlier? What would have accelerated?
- Higher value path: was there potential for upselling or premium pricing?
- Content optimization: which journey pages were most effective for conversion?
- Timeline optimization: ideal journey length for this client type?
- Payment friction: any obstacles in the payment process that could be removed?"
                          rows={5}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedOutcome === 'paid' ? (
                  // If marked as paid but no payment data
                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-sm text-amber-800 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Payment Pending Verification</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-amber-700">
                        Outcome marked as "paid" but no Stripe payment data found. 
                        This could be a manual entry or the webhook hasn't processed yet.
                      </p>
                      <div className="mt-3">
                        <Label htmlFor="manual_payment_notes">Manual Payment Notes</Label>
                        <Textarea
                          id="manual_payment_notes"
                          name="manual_payment_notes"
                          placeholder="If this was a manual payment (check, wire transfer, etc.), provide details here..."
                          rows={3}
                          disabled={isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // If not paid
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>No Payment Data</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Payment information will appear here when the outcome is marked as "paid" 
                        and processed through Stripe integration.
                      </p>
                      {selectedOutcome === 'pending' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-blue-700">
                            <strong>Revenue Intelligence Note:</strong> When this client eventually pays, 
                            their payment data will automatically correlate with the current journey hypothesis 
                            and content for accurate revenue learning.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
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