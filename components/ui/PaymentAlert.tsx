/**
 * PaymentAlert Component for Story 3.2: Failed Payment Alert System
 * Comprehensive alert system for failed payments with retry mechanisms
 */

'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Client } from '@/lib/supabase';
import { maskPaymentSessionId } from '@/lib/payment-utils';
import { 
  AlertCircle, 
  RefreshCw, 
  X, 
  CreditCard, 
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PaymentAlertProps {
  client: Client;
  onRetryPayment: (clientId: number) => void;
  onDismiss?: (clientId: number) => void;
  variant?: 'compact' | 'detailed';
}

export function PaymentAlert({ 
  client, 
  onRetryPayment, 
  onDismiss, 
  variant = 'detailed' 
}: PaymentAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || client.payment_status !== 'failed') {
    return null;
  }

  const handleRetryPayment = async () => {
    setIsRetrying(true);
    try {
      await onRetryPayment(client.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(client.id);
  };

  if (variant === 'compact') {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{client.company}</span> - Payment failed
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={handleRetryPayment}
                disabled={isRetrying}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs bg-white hover:bg-red-50 text-red-700 border-red-300"
              >
                {isRetrying ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </>
                )}
              </Button>
              {onDismiss && (
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-red-600 hover:bg-red-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-red-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Payment Failed - {client.company}
          </div>
          {onDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-200"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-red-900">Contact:</span>
            <p className="text-red-700">{client.contact}</p>
          </div>
          <div>
            <span className="font-medium text-red-900">Email:</span>
            <p className="text-red-700">{client.email}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="flex items-center justify-between p-3 bg-white/50 rounded border border-red-200">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                ${client.payment_amount || 500} Activation Fee
              </p>
              {client.payment_timestamp && (
                <p className="text-xs text-red-700">
                  Failed {formatDistanceToNow(new Date(client.payment_timestamp), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Payment Failed
          </Badge>
        </div>

        {/* Failure Reason (Mock - in real implementation would come from Stripe) */}
        <div className="p-3 bg-white/50 rounded border border-red-200">
          <p className="text-sm font-medium text-red-900 mb-1">Failure Reason</p>
          <p className="text-xs text-red-700">
            {getFailureReason(maskPaymentSessionId(client.payment_session_id))}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying Payment...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Payment
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${client.email}`, '_blank')}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Contact Client
            </Button>
          </div>
          
          {client.payment_session_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // In a real implementation, this could open the Stripe dashboard
                window.open('https://dashboard.stripe.com', '_blank');
              }}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View in Stripe
            </Button>
          )}
        </div>

        {/* Additional Context */}
        <div className="pt-2 border-t border-red-200">
          <p className="text-xs text-red-600">
            <Clock className="w-3 h-3 inline mr-1" />
            Payment sessions expire after 24 hours. Contact the client or retry payment to generate a new session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Failed Payments Summary Alert
 */
interface FailedPaymentsSummaryProps {
  failedPayments: Client[];
  onRetryPayment: (clientId: number) => void;
  onDismissAll?: () => void;
}

export function FailedPaymentsSummary({ 
  failedPayments, 
  onRetryPayment, 
  onDismissAll 
}: FailedPaymentsSummaryProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || failedPayments.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismissAll?.();
  };

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50 mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-900 mb-1">
              {failedPayments.length} Payment{failedPayments.length > 1 ? 's' : ''} Failed
            </p>
            <p className="text-sm text-red-700">
              {failedPayments.map(client => client.company).join(', ')} - 
              Revenue at risk: ${failedPayments.reduce((sum, client) => sum + (client.payment_amount || 500), 0).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-red-50 text-red-700 border-red-300"
              onClick={() => {
                // Focus on failed payment filter/view
                document.getElementById('payment-filter-failed')?.click();
              }}
            >
              Review Failed Payments
            </Button>
            {onDismissAll && (
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Individual Payment Alert for specific client
 */
interface SinglePaymentAlertProps {
  client: Client;
  onRetryPayment: (clientId: number) => void;
  onDismiss: (clientId: number) => void;
}

export function SinglePaymentAlert({ 
  client, 
  onRetryPayment, 
  onDismiss 
}: SinglePaymentAlertProps) {
  return (
    <PaymentAlert
      client={client}
      onRetryPayment={onRetryPayment}
      onDismiss={onDismiss}
      variant="compact"
    />
  );
}

// Helper function to generate mock failure reasons
function getFailureReason(sessionId?: string | null): string {
  const reasons = [
    "Card declined by issuer - insufficient funds",
    "Card expired - customer needs to update payment method",
    "Payment method cancelled by customer during checkout",
    "Card declined - contact card issuer for more information",
    "Payment requires authentication - customer didn't complete verification",
    "Invalid card information entered",
    "Card spending limit exceeded"
  ];
  
  if (!sessionId) {
    return "Unknown error - payment session not found";
  }
  
  // Use session ID to deterministically pick a reason
  const index = sessionId.length % reasons.length;
  return reasons[index];
}