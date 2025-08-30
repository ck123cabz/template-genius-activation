"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, UserX, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Client } from "@/lib/supabase";

interface OutcomeModalProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOutcomeRecorded: () => void;
}

type JourneyOutcome = "paid" | "ghosted" | "pending";

export function OutcomeModal({ client, isOpen, onOpenChange, onOutcomeRecorded }: OutcomeModalProps) {
  const [outcome, setOutcome] = useState<JourneyOutcome>("paid");
  const [notes, setNotes] = useState("");
  const [revenue, setRevenue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    startTransition(async () => {
      try {
        const { recordClientOutcome } = await import("@/app/actions/client-actions");
        
        const outcomeData = {
          outcome,
          notes: notes.trim(),
          revenue: outcome === "paid" && revenue ? parseFloat(revenue) : null,
          recorded_at: new Date().toISOString()
        };

        const result = await recordClientOutcome(client.id, outcomeData);
        
        if (result.success) {
          setOutcome("paid");
          setNotes("");
          setRevenue("");
          onOpenChange(false);
          onOutcomeRecorded();
        }
      } catch (error) {
        console.error("Error recording outcome:", error);
      }
    });
  };

  const getOutcomeIcon = (outcomeType: JourneyOutcome) => {
    switch (outcomeType) {
      case "paid":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "ghosted":
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getOutcomeColor = (outcomeType: JourneyOutcome) => {
    switch (outcomeType) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "ghosted":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Record Journey Outcome
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Company:</span>
                  <p className="font-medium">{client.company}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Contact:</span>
                  <p className="font-medium">{client.contact}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Token:</span>
                  <Badge variant="outline" className="font-mono">
                    {client.token}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <Badge className={client.status === "activated" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {client.status}
                  </Badge>
                </div>
              </div>
              
              {client.hypothesis && (
                <div className="pt-2">
                  <span className="font-medium text-muted-foreground">Journey Hypothesis:</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{client.hypothesis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Outcome Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Outcome Selection */}
            <div className="space-y-2">
              <Label htmlFor="outcome">Journey Outcome *</Label>
              <Select value={outcome} onValueChange={(value) => setOutcome(value as JourneyOutcome)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Paid - Client converted to revenue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ghosted" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-600" />
                      <span>Ghosted - No response or engagement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Pending - Still in progress</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Outcome Preview */}
              <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                {getOutcomeIcon(outcome)}
                <Badge className={getOutcomeColor(outcome)}>
                  {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  This outcome will be used for pattern recognition analysis
                </span>
              </div>
            </div>

            {/* Revenue Input (only for paid outcomes) */}
            {outcome === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue Amount (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    id="revenue"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="pl-10 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue data helps with conversion value analysis
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Outcome Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what happened in this client journey. What worked? What didn't? Key learnings for pattern recognition..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Detailed notes help identify patterns across client journeys
              </p>
            </div>

            {/* Pattern Recognition Info */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Pattern Recognition Ready</p>
                <p>This outcome will be correlated with the client's journey hypothesis and page interactions to identify success patterns.</p>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="min-w-[100px]"
          >
            {isPending ? "Recording..." : "Record Outcome"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}