/**
 * PaymentDetails Component for Story 3.2: Payment Detail View Integration
 * Comprehensive payment information display with transaction details
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Client } from '@/lib/supabase';
import { maskPaymentSessionId, isIdCopyable } from '@/lib/payment-utils';
import { 
  CreditCard, 
  Calendar, 
  Hash, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentDetailsProps {
  client: Client;
  onRetryPayment?: (clientId: number) => void;
}

interface PaymentMethod {
  type: 'card' | 'bank' | 'other';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
}

export function PaymentDetails({ client, onRetryPayment }: PaymentDetailsProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  // Determine payment status
  const getPaymentStatus = () => {
    if (client.payment_received) return 'succeeded';
    if (client.payment_status === 'pending') return 'pending';
    if (client.payment_status === 'failed') return 'failed';
    if (client.payment_status === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const paymentStatus = getPaymentStatus();
  const amount = client.payment_amount || 500;

  // Payment status configuration
  const statusConfig = {
    pending: {
      label: 'Payment Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="h-4 w-4" />,
    },
    succeeded: {
      label: 'Payment Complete',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    failed: {
      label: 'Payment Failed',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertCircle className="h-4 w-4" />,
    },
    cancelled: {
      label: 'Payment Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  };

  const config = statusConfig[paymentStatus];

  const handleRetryPayment = async () => {
    if (!onRetryPayment) return;
    
    setIsRetrying(true);
    try {
      await onRetryPayment(client.id);
    } finally {
      setIsRetrying(false);
    }
  };

  // Mock payment method data (in real implementation, this would come from Stripe)
  const paymentMethod: PaymentMethod | null = client.payment_session_id ? {
    type: 'card',
    last4: '4242',
    brand: 'visa',
    exp_month: 12,
    exp_year: 2025
  } : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount</Label>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-lg font-semibold">${amount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Activation fee</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className={`
              inline-flex items-center gap-2 px-3 py-1.5 
              rounded-full text-xs font-medium border
              ${config.color}
            `}>
              {config.icon}
              <span>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Payment Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {paymentStatus === 'succeeded' ? 'Payment Date' : 'Last Updated'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {client.payment_timestamp ? (
                format(new Date(client.payment_timestamp), 'PPP p')
              ) : (
                'Not yet processed'
              )}
            </p>
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Transaction ID
            </Label>
            <div className="flex items-center gap-2">
              {client.payment_session_id ? (
                <>
                  <span className="font-mono text-xs text-muted-foreground">
                    {maskPaymentSessionId(client.payment_session_id)}
                  </span>
                  {isIdCopyable(client.payment_session_id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => navigator.clipboard.writeText(client.payment_session_id || '')}
                    >
                      Copy
                    </Button>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Method</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {paymentMethod.brand?.toUpperCase()} ending in {paymentMethod.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Actions */}
        <div className="space-y-3">
          {paymentStatus === 'failed' && onRetryPayment && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-900">Payment Failed</p>
                  <p className="text-xs text-red-700">
                    The payment could not be processed. You can retry or contact the client for updated payment information.
                  </p>
                </div>
                <Button
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-red-50 text-red-700 border-red-300"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === 'pending' && client.payment_session_id && (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900">Payment In Progress</p>
                  <p className="text-xs text-yellow-700">
                    The client has initiated payment but hasn't completed the process yet.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-300"
                  onClick={() => {
                    // In a real implementation, this could open the Stripe dashboard
                    window.open('https://dashboard.stripe.com', '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View in Stripe
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === 'succeeded' && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-900">Payment Successful</p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Payment has been processed successfully. The activation fee has been received and credited.
              </p>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Payment History</Label>
          <div className="space-y-2">
            {client.payment_timestamp && (
              <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    paymentStatus === 'succeeded' ? 'bg-green-500' : 
                    paymentStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(client.payment_timestamp), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <span className="text-xs font-medium">
                  {config.label}
                </span>
              </div>
            )}
            {!client.payment_timestamp && (
              <p className="text-xs text-muted-foreground italic">
                No payment history available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}