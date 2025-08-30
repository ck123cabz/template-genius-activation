"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  Ghost, 
  Clock, 
  MessageSquare, 
  X,
  ChevronDown,
  Edit,
  BarChart3,
} from "lucide-react";
import { OutcomeStatusBadge, QuickOutcomeSelector } from "./OutcomeStatusBadge";
import { OutcomeModal } from "./OutcomeModal";
import { recordJourneyOutcome } from "@/app/actions/outcome-actions";
import { useToast } from "@/components/ui/use-toast";
import { Client } from "@/lib/supabase";

type JourneyOutcome = 'paid' | 'ghosted' | 'pending' | 'negotiating' | 'declined';

interface OutcomeControlsProps {
  client: Client;
  className?: string;
  variant?: "dropdown" | "inline" | "compact";
}

export function OutcomeControls({ 
  client, 
  className = "",
  variant = "dropdown" 
}: OutcomeControlsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const currentOutcome = (client.journey_outcome || 'pending') as JourneyOutcome;

  const handleQuickOutcomeUpdate = async (outcome: JourneyOutcome) => {
    if (outcome === currentOutcome) return;
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("client_id", client.id.toString());
      formData.append("journey_outcome", outcome);
      
      // Add basic notes for quick updates
      const quickNotes = {
        paid: "Marked as paid via quick action",
        ghosted: "Marked as ghosted via quick action", 
        negotiating: "Marked as negotiating via quick action",
        declined: "Marked as declined via quick action",
        pending: "Reset to pending status",
      };
      
      formData.append("outcome_notes", quickNotes[outcome]);
      
      const result = await recordJourneyOutcome({ success: false }, formData);
      
      if (result.success) {
        toast({
          title: "Outcome updated",
          description: `${client.company} marked as ${outcome}`,
        });
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Could not update outcome",
          variant: "destructive",
        });
      }
    });
  };

  const handleDetailedOutcome = () => {
    setIsModalOpen(true);
  };

  if (variant === "inline") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Journey Outcome</span>
          <OutcomeStatusBadge 
            outcome={currentOutcome}
            revenue={client.revenue_amount}
            size="sm"
          />
        </div>
        
        <QuickOutcomeSelector
          currentOutcome={currentOutcome}
          onOutcomeSelect={handleQuickOutcomeUpdate}
          disabled={isPending}
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetailedOutcome}
            disabled={isPending}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Detailed Update
          </Button>
        </div>
        
        <OutcomeModal
          client={client}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <OutcomeStatusBadge 
          outcome={currentOutcome}
          revenue={client.revenue_amount}
          size="sm"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => handleQuickOutcomeUpdate('paid')}
              className="text-green-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleQuickOutcomeUpdate('negotiating')}
              className="text-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mark as Negotiating
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleQuickOutcomeUpdate('declined')}
              className="text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Mark as Declined
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleQuickOutcomeUpdate('ghosted')}
              className="text-gray-700"
            >
              <Ghost className="w-4 h-4 mr-2" />
              Mark as Ghosted
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDetailedOutcome}>
              <Edit className="w-4 h-4 mr-2" />
              Detailed Update
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <OutcomeModal
          client={client}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Journey Outcome
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium">
            Current Status: 
            <OutcomeStatusBadge 
              outcome={currentOutcome}
              revenue={client.revenue_amount}
              size="sm"
              className="ml-2"
            />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleQuickOutcomeUpdate('paid')}
            className="text-green-700"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Mark as Paid
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickOutcomeUpdate('negotiating')}
            className="text-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mark as Negotiating
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickOutcomeUpdate('declined')}
            className="text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Mark as Declined
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickOutcomeUpdate('ghosted')}
            className="text-gray-700"
          >
            <Ghost className="w-4 h-4 mr-2" />
            Mark as Ghosted
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDetailedOutcome}>
            <Edit className="w-4 h-4 mr-2" />
            Detailed Outcome Analysis
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <OutcomeModal
        client={client}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}