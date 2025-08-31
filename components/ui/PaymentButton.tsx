/**
 * PaymentButton Component for Story 3.1: Stripe Checkout Integration
 * Professional payment interface with branded checkout flow
 */

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { createPaymentSession } from '@/app/actions/payment-actions';
import { useJourneyMetadata } from '@/lib/payment-metadata';
import { Loader2, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentButtonProps {
  clientId: string;
  clientToken?: string;
  amount?: number;
  disabled?: boolean;
  className?: string;
  onPaymentInitiated?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

interface PaymentError {
  code: string;
  message: string;
  retryable: boolean;
}

export function PaymentButton({
  clientId,
  clientToken,
  amount = 500,
  disabled = false,
  className = '',
  onPaymentInitiated,
  onError,
}: PaymentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<PaymentError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get journey metadata for correlation tracking
  const journeyMetadata = useJourneyMetadata();

  const handlePayment = () => {
    // Clear any existing errors
    setError(null);
    
    startTransition(async () => {
      try {
        // Record payment button click in journey metadata
        if (journeyMetadata) {
          journeyMetadata.recordPageEntry('payment');
        }

        // Collect current journey metadata for payment correlation
        const metadata = journeyMetadata?.generatePaymentMetadata({
          client_token: clientToken || '',
          client_id: clientId,
          journey_hypothesis: 'User initiated payment for activation',
        });

        // Create payment session with journey metadata
        const result = await createPaymentSession(clientId, metadata);

        if (result.success && result.sessionUrl) {
          // Notify parent component of successful initiation
          if (onPaymentInitiated && result.sessionId) {
            onPaymentInitiated(result.sessionId);
          }

          // Record payment initiation in journey
          if (journeyMetadata) {
            journeyMetadata.recordPageEntry('stripe_checkout');
          }

          // Redirect to Stripe Checkout
          window.location.href = result.sessionUrl;
        } else if (result.error) {
          const errorDetails: PaymentError = {
            code: result.error.code,
            message: result.error.message,
            retryable: result.error.retryable,
          };
          
          setError(errorDetails);
          setRetryCount(prev => prev + 1);
          
          if (onError) {
            onError(errorDetails.message);
          }

          // Log error for debugging
          console.error('Payment session creation failed:', errorDetails);
        }
      } catch (err) {
        const unexpectedError: PaymentError = {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true,
        };
        
        setError(unexpectedError);
        setRetryCount(prev => prev + 1);
        
        if (onError) {
          onError(unexpectedError.message);
        }

        console.error('Unexpected payment error:', err);
      }
    });
  };

  const handleRetry = () => {
    handlePayment();
  };

  return (
    <div className="space-y-4">
      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={disabled || isPending}
        data-testid="payment-button"
        className={`
          w-full h-12 text-lg font-semibold
          bg-blue-600 hover:bg-blue-700 
          text-white border-0
          transition-all duration-200 ease-in-out
          hover:shadow-lg hover:scale-[1.02]
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:scale-100 disabled:hover:shadow-none
          ${className}
        `}
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ${amount} Activation Fee
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50" data-testid="payment-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-medium text-red-900">Payment Failed</p>
              <p className="text-red-700">{error.message}</p>
              
              {error.retryable && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    data-testid="retry-button"
                    className="bg-white hover:bg-red-50 text-red-700 border-red-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Try Again
                  </Button>
                  {retryCount > 0 && (
                    <span className="text-xs text-red-600">
                      Attempt {retryCount + 1}
                    </span>
                  )}
                </div>
              )}
              
              {!error.retryable && (
                <p className="text-xs text-red-600 mt-2">
                  If this issue persists, please contact support with error code: {error.code}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Security Notice */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p className="flex items-center justify-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
          Secure payment powered by Stripe
        </p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
}

/**
 * Compact Payment Button for smaller spaces
 */
export function CompactPaymentButton({
  clientId,
  clientToken,
  disabled = false,
  className = '',
}: Omit<PaymentButtonProps, 'amount' | 'onPaymentInitiated' | 'onError'>) {
  const [isPending, startTransition] = useTransition();
  
  const handlePayment = () => {
    startTransition(async () => {
      const result = await createPaymentSession(clientId);
      if (result.success && result.sessionUrl) {
        window.location.href = result.sessionUrl;
      }
    });
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isPending}
      className={`
        bg-blue-600 hover:bg-blue-700 text-white
        transition-all duration-200
        ${className}
      `}
      size="sm"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        'Pay $500'
      )}
    </Button>
  );
}

/**
 * Payment Status Indicator for dashboard use
 */
interface PaymentStatusProps {
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  amount?: number;
  paidAt?: string;
  sessionId?: string;
}

export function PaymentStatus({ 
  status, 
  amount = 500, 
  paidAt, 
  sessionId 
}: PaymentStatusProps) {
  const statusConfig = {
    pending: {
      label: 'Payment Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    paid: {
      label: 'Payment Complete',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <span className="w-3 h-3 bg-green-500 rounded-full"></span>,
    },
    failed: {
      label: 'Payment Failed',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    cancelled: {
      label: 'Payment Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <span className="w-3 h-3 bg-gray-400 rounded-full"></span>,
    },
    expired: {
      label: 'Payment Expired',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 
      rounded-full text-xs font-medium border
      ${config.color}
    `}>
      {config.icon}
      <span>{config.label}</span>
      {amount > 0 && <span className="text-gray-600">($${amount})</span>}
      {paidAt && status === 'paid' && (
        <span className="text-gray-500 ml-1">
          {new Date(paidAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}