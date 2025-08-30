import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Ghost, 
  Clock, 
  MessageSquare, 
  X,
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

type JourneyOutcome = 'paid' | 'ghosted' | 'pending' | 'negotiating' | 'declined';

interface OutcomeStatusBadgeProps {
  outcome: JourneyOutcome;
  revenue?: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const outcomeConfig = {
  paid: {
    label: "Paid",
    icon: DollarSign,
    variant: "default" as const,
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  ghosted: {
    label: "Ghosted",
    icon: Ghost,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "outline" as const,
    className: "bg-yellow-50 text-yellow-800 hover:bg-yellow-50 border-yellow-200",
  },
  negotiating: {
    label: "Negotiating",
    icon: MessageSquare,
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  },
  declined: {
    label: "Declined",
    icon: X,
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  },
};

export function OutcomeStatusBadge({
  outcome,
  revenue,
  className,
  showIcon = true,
  size = "default",
}: OutcomeStatusBadgeProps) {
  const config = outcomeConfig[outcome] || outcomeConfig.pending;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        "font-medium transition-colors",
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          "mr-1",
          size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
        )} />
      )}
      {config.label}
      {outcome === "paid" && revenue && (
        <span className="ml-1 font-semibold">
          ${revenue.toLocaleString()}
        </span>
      )}
    </Badge>
  );
}

interface OutcomeStatusIndicatorProps {
  outcome: JourneyOutcome;
  revenue?: number;
  recordedAt?: string;
  className?: string;
}

export function OutcomeStatusIndicator({
  outcome,
  revenue,
  recordedAt,
  className,
}: OutcomeStatusIndicatorProps) {
  const config = outcomeConfig[outcome] || outcomeConfig.pending;
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          config.className.replace("hover:bg-", "").replace("border-", "bg-").split(" ")[0]
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{config.label}</span>
          {outcome === "paid" && revenue && (
            <span className="text-sm font-semibold text-green-600">
              ${revenue.toLocaleString()}
            </span>
          )}
        </div>
        {recordedAt && (
          <p className="text-xs text-muted-foreground">
            {new Date(recordedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

interface QuickOutcomeSelectorProps {
  currentOutcome?: JourneyOutcome;
  onOutcomeSelect: (outcome: JourneyOutcome) => void;
  disabled?: boolean;
  className?: string;
}

export function QuickOutcomeSelector({
  currentOutcome,
  onOutcomeSelect,
  disabled = false,
  className,
}: QuickOutcomeSelectorProps) {
  const outcomes: JourneyOutcome[] = ['pending', 'negotiating', 'paid', 'declined', 'ghosted'];
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {outcomes.map((outcome) => {
        const config = outcomeConfig[outcome];
        const isSelected = currentOutcome === outcome;
        
        return (
          <button
            key={outcome}
            onClick={() => onOutcomeSelect(outcome)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              "border border-transparent hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              isSelected
                ? config.className
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            )}
          >
            <config.icon className="w-4 h-4 mr-1.5" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}