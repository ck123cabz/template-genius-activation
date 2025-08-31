/**
 * Enhanced Payment Status Column Component for Story 3.2
 * Comprehensive payment display with journey progress integration
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client } from '@/lib/supabase';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  CreditCard,
  RefreshCw 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PaymentStatusColumnProps {
  client: Client;
  onRetryPayment?: (clientId: number) => void;
}

export function PaymentStatusColumn({ client, onRetryPayment }: PaymentStatusColumnProps) {
  // Determine payment status from client data
  const getPaymentStatus = () => {
    if (client.payment_received) return 'succeeded';
    if (client.payment_status === 'pending') return 'pending';
    if (client.payment_status === 'failed') return 'failed';
    if (client.payment_status === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const paymentStatus = getPaymentStatus();
  
  // Payment status configuration
  const statusConfig = {
    pending: {
      label: 'Payment Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      dotColor: 'bg-yellow-500'
    },
    succeeded: {
      label: 'Payment Complete',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />,
      dotColor: 'bg-green-500'
    },
    failed: {
      label: 'Payment Failed',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertCircle className="w-3 h-3" />,
      dotColor: 'bg-red-500'
    },
    cancelled: {
      label: 'Payment Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <XCircle className="w-3 h-3" />,
      dotColor: 'bg-gray-500'
    }
  };

  const config = statusConfig[paymentStatus];
  const amount = client.payment_amount || 500;

  return (
    <div className="space-y-2">
      {/* Payment Status Badge */}
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        rounded-full text-xs font-medium border
        ${config.color}
      `}>
        {config.icon}
        <span>{config.label}</span>
        <span className="text-gray-600">($${amount})</span>
      </div>

      {/* Payment Timing Information */}
      {paymentStatus === 'succeeded' && client.payment_timestamp && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
            <span>
              Paid {formatDistanceToNow(new Date(client.payment_timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}

      {/* Payment Session Information */}
      {client.payment_session_id && paymentStatus === 'pending' && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Session active</span>
          </div>
          <span className="font-mono text-gray-400">
            {client.payment_session_id.substring(0, 12)}...
          </span>
        </div>
      )}

      {/* Failed Payment Actions */}
      {paymentStatus === 'failed' && onRetryPayment && (
        <div className="space-y-1">
          <Button
            onClick={() => onRetryPayment(client.id)}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs bg-white hover:bg-red-50 text-red-700 border-red-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Payment
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Payment Progress Indicator for Journey Integration
 */
interface PaymentProgressIndicatorProps {
  journeyStep: number;
  paymentCompleted: boolean;
  className?: string;
}

export function PaymentProgressIndicator({ 
  journeyStep, 
  paymentCompleted, 
  className = '' 
}: PaymentProgressIndicatorProps) {
  // Journey steps: 1=activation, 2=agreement, 3=confirmation, 4=processing
  const paymentStep = 3; // Payment happens at confirmation step
  
  const isPaymentStep = journeyStep >= paymentStep;
  const showPaymentIndicator = isPaymentStep || paymentCompleted;
  
  if (!showPaymentIndicator) return null;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <CreditCard className="w-3 h-3 text-blue-600" />
        <span className="text-muted-foreground">Payment:</span>
      </div>
      <div className={`
        w-2 h-2 rounded-full
        ${paymentCompleted ? 'bg-green-500' : isPaymentStep ? 'bg-yellow-500' : 'bg-gray-300'}
      `}></div>
      <span className={`
        text-xs
        ${paymentCompleted ? 'text-green-700' : isPaymentStep ? 'text-yellow-700' : 'text-gray-500'}
      `}>
        {paymentCompleted ? 'Complete' : isPaymentStep ? 'In Progress' : 'Pending'}
      </span>
    </div>
  );
}