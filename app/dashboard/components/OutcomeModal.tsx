"use client";

import { useState, useTransition } from "react";
import { Client, JourneyOutcome } from "@/lib/supabase";
import { PaymentOutcomeCorrelation } from "@/app/actions/correlation-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Edit3,
  ExternalLink,
  History,
  MessageCircle,
  Target,
  UserX,
  Zap,
  TrendingUp,
  Activity,
  Database,
} from "lucide-react";
import { updateClientOutcome } from "@/app/actions/client-actions";
import { 
  getClientCorrelationHistory, 
  overridePaymentCorrelation,
  calculateConversionMetrics,
} from "@/app/actions/correlation-actions";

interface OutcomeModalProps {
  client: Client;
  trigger: React.ReactNode;
  correlationData?: PaymentOutcomeCorrelation[];
}

export function OutcomeModal({ client, trigger, correlationData: initialCorrelationData }: OutcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [correlationData, setCorrelationData] = useState<PaymentOutcomeCorrelation[]>(initialCorrelationData || []);
  const [conversionMetrics, setConversionMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("outcome");
  
  // Outcome update state
  const [selectedOutcome, setSelectedOutcome] = useState<JourneyOutcome>(client.journey_outcome || "pending");
  const [outcomeNotes, setOutcomeNotes] = useState(client.outcome_notes || "");
  
  // Correlation override state
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [newOutcomeType, setNewOutcomeType] = useState<"paid" | "failed" | "pending" | "cancelled">("paid");

  const handleOutcomeUpdate = () => {
    startTransition(async () => {
      await updateClientOutcome(client.id, selectedOutcome, outcomeNotes);
      setOpen(false);
    });
  };

  const handleCorrelationOverride = () => {
    if (!selectedCorrelationId) return;
    
    startTransition(async () => {
      await overridePaymentCorrelation({
        correlationId: selectedCorrelationId,
        adminId: "admin", // TODO: Get from auth context
        overrideReason,
        originalOutcome: correlationData.find(c => c.id === selectedCorrelationId)?.outcome_type || "unknown",
        notes: overrideNotes,
        newOutcomeType,
      });
      
      // Refresh correlation data
      const result = await getClientCorrelationHistory(client.id);
      if (result.success && result.correlations) {
        setCorrelationData(result.correlations);
      }
    });
  };

  const loadCorrelationData = async () => {
    const [correlationResult, metricsResult] = await Promise.all([
      getClientCorrelationHistory(client.id),
      calculateConversionMetrics(client.id),
    ]);

    if (correlationResult.success && correlationResult.correlations) {
      setCorrelationData(correlationResult.correlations);
    }

    if (metricsResult.success && metricsResult.metrics) {
      setConversionMetrics(metricsResult.metrics);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadCorrelationData();
    }
  };

  const getOutcomeBadge = (outcome: JourneyOutcome | string) => {
    switch (outcome) {
      case 'paid':
        return { icon: DollarSign, label: 'Paid', className: 'bg-green-100 text-green-800' };
      case 'responded':
        return { icon: MessageCircle, label: 'Responded', className: 'bg-blue-100 text-blue-800' };
      case 'ghosted':
        return { icon: UserX, label: 'Ghosted', className: 'bg-red-100 text-red-800' };
      case 'failed':
        return { icon: AlertTriangle, label: 'Failed', className: 'bg-red-100 text-red-800' };
      case 'cancelled':
        return { icon: UserX, label: 'Cancelled', className: 'bg-gray-100 text-gray-800' };
      default:
        return { icon: Clock, label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const formatDuration = (milliseconds: number | null) => {
    if (!milliseconds) return "N/A";
    
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Outcome Tracking - {client.company}
          </DialogTitle>
          <DialogDescription>
            Manage journey outcomes and payment correlations for comprehensive revenue intelligence.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="outcome" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Outcome
            </TabsTrigger>
            <TabsTrigger value="correlation" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Correlation
              {correlationData.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {correlationData.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Outcome Management Tab */}
          <TabsContent value="outcome" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Journey Outcome</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const badge = getOutcomeBadge(client.journey_outcome);
                      const Icon = badge.icon;
                      return (
                        <Badge className={badge.className}>
                          <Icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardTitle>
                <CardDescription>
                  Update the client's journey outcome and add learning notes for revenue intelligence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="outcome-select">Outcome Status</Label>
                    <Select value={selectedOutcome} onValueChange={(value) => setSelectedOutcome(value as JourneyOutcome)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">💰 Paid</SelectItem>
                        <SelectItem value="responded">💬 Responded</SelectItem>
                        <SelectItem value="ghosted">👻 Ghosted</SelectItem>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm text-muted-foreground pt-2">
                      {client.outcome_timestamp 
                        ? new Date(client.outcome_timestamp).toLocaleString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="outcome-notes">Learning Notes</Label>
                  <Textarea
                    id="outcome-notes"
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="What did you learn about this client's conversion drivers? What worked or didn't work?"
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Capture insights about conversion patterns, objections, or successful tactics for future learning.
                  </p>
                </div>

                {client.payment_received && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-600">Payment Received</p>
                          <p className="text-2xl font-bold">${client.payment_amount?.toFixed(2)}</p>
                          {client.payment_timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(client.payment_timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleOutcomeUpdate} disabled={isPending} className="flex-1">
                    {isPending ? "Updating..." : "Update Outcome"}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Correlation Tab */}
          <TabsContent value="correlation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Correlation History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Correlation History
                  </CardTitle>
                  <CardDescription>
                    Automatic payment-outcome correlations from Stripe webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {correlationData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No payment correlations found</p>
                        <p className="text-xs">Correlations are created automatically when payments are processed</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {correlationData.map((correlation) => {
                          const badge = getOutcomeBadge(correlation.outcome_type);
                          const Icon = badge.icon;
                          return (
                            <Card key={correlation.id}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={badge.className}>
                                        <Icon className="w-3 h-3 mr-1" />
                                        {badge.label}
                                      </Badge>
                                      {correlation.manual_override && (
                                        <Badge variant="outline" className="text-xs">
                                          <Edit3 className="w-2 h-2 mr-1" />
                                          Override
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium">
                                      {correlation.stripe_payment_intent_id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {correlation.correlation_timestamp && 
                                        new Date(correlation.correlation_timestamp).toLocaleString()
                                      }
                                    </p>
                                    {correlation.conversion_duration && (
                                      <p className="text-xs text-blue-600">
                                        Conversion: {formatDuration(correlation.conversion_duration)}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCorrelationId(correlation.id!)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Manual Override */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Manual Override
                  </CardTitle>
                  <CardDescription>
                    Override automatic correlations for edge cases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="correlation-select">Select Correlation</Label>
                    <Select value={selectedCorrelationId} onValueChange={setSelectedCorrelationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a correlation to override" />
                      </SelectTrigger>
                      <SelectContent>
                        {correlationData.map((correlation) => (
                          <SelectItem key={correlation.id} value={correlation.id!}>
                            {correlation.stripe_payment_intent_id} - {correlation.outcome_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-outcome-type">New Outcome Type</Label>
                    <Select value={newOutcomeType} onValueChange={(value) => setNewOutcomeType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">💰 Paid</SelectItem>
                        <SelectItem value="failed">❌ Failed</SelectItem>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="cancelled">🚫 Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="override-reason">Override Reason</Label>
                    <Input
                      id="override-reason"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g., Manual payment processing, Refund issued"
                    />
                  </div>

                  <div>
                    <Label htmlFor="override-notes">Override Notes</Label>
                    <Textarea
                      id="override-notes"
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder="Additional context for the override..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleCorrelationOverride}
                    disabled={!selectedCorrelationId || isPending}
                    className="w-full"
                  >
                    {isPending ? "Creating Override..." : "Create Override"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversionMetrics?.totalConversions || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Conversion Time</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversionMetrics ? formatDuration(conversionMetrics.averageConversionTime) : "N/A"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversionMetrics?.conversionRate.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {conversionMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(conversionMetrics.paymentMethods).map(([method, count]) => (
                        <div key={method} className="flex justify-between">
                          <span className="capitalize">{method}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Outcome Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(conversionMetrics.outcomeDistribution).map(([outcome, count]) => {
                        const badge = getOutcomeBadge(outcome);
                        return (
                          <div key={outcome} className="flex justify-between items-center">
                            <Badge className={badge.className}>
                              {badge.label}
                            </Badge>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}