/**
 * PaymentConfirmation Component for Story 3.1: Payment Success/Failure Handling
 * Professional confirmation interface with next steps guidance
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPaymentSessionStatus } from '@/app/actions/payment-actions';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface PaymentConfirmationProps {
  sessionId?: string;
  clientId?: string;
  status?: 'success' | 'cancelled' | 'error';
  className?: string;
}

interface PaymentStatusData {
  status: 'complete' | 'expired' | 'open';
  payment_status: 'paid' | 'unpaid';
  client_id?: string;
  loading: boolean;
  error?: string;
}

export function PaymentConfirmation({
  sessionId,
  clientId,
  status,
  className = '',
}: PaymentConfirmationProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    status: 'open',
    payment_status: 'unpaid',
    loading: true,
  });

  // Fetch payment status from Stripe
  useEffect(() => {
    if (sessionId) {
      const checkPaymentStatus = async () => {
        try {
          const result = await getPaymentSessionStatus(sessionId);
          
          if (result.success) {
            setPaymentStatus({
              status: result.status as 'complete' | 'expired' | 'open',
              payment_status: result.payment_status as 'paid' | 'unpaid',
              client_id: result.client_id,
              loading: false,
            });
          } else {
            setPaymentStatus(prev => ({
              ...prev,
              loading: false,
              error: result.error || 'Failed to verify payment status',
            }));
          }
        } catch (error) {
          setPaymentStatus(prev => ({
            ...prev,
            loading: false,
            error: 'Network error while checking payment status',
          }));
        }
      };

      checkPaymentStatus();
    } else if (status) {
      // Use provided status if no sessionId
      setPaymentStatus({
        status: status === 'success' ? 'complete' : 'expired',
        payment_status: status === 'success' ? 'paid' : 'unpaid',
        loading: false,
      });
    }
  }, [sessionId, status]);

  // Determine display based on payment status
  const getStatusConfig = () => {
    if (paymentStatus.loading) {
      return {
        type: 'loading' as const,
        icon: <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />,
        title: 'Verifying Payment...',
        description: 'Please wait while we confirm your payment.',
        alertVariant: undefined,
        actions: null,
      };
    }

    if (paymentStatus.error) {
      return {
        type: 'error' as const,
        icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
        title: 'Payment Verification Failed',
        description: 'We couldn\'t verify your payment status. This doesn\'t necessarily mean your payment failed.',
        alertVariant: 'default' as const,
        actions: (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </div>
        ),
      };
    }

    if (paymentStatus.payment_status === 'paid' || status === 'success') {
      return {
        type: 'success' as const,
        icon: <CheckCircle className="w-16 h-16 text-green-500" />,
        title: 'Payment Successful!',
        description: 'Your $500 activation fee has been processed successfully. Welcome to Template Genius Priority Access.',
        alertVariant: undefined,
        actions: (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Access Your Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/confirmation">
                View Next Steps
              </Link>
            </Button>
          </div>
        ),
      };
    }

    // Payment failed, cancelled, or expired
    return {
      type: 'failed' as const,
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed',
      description: status === 'cancelled' 
        ? 'Your payment was cancelled. You can try again whenever you\'re ready.'
        : 'Your payment could not be processed. Please try again or contact support if the issue persists.',
      alertVariant: 'destructive' as const,
      actions: (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/journey/retry?client=${clientId || paymentStatus.client_id}`}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Payment Again
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      ),
    };
  };

  const config = getStatusConfig();

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {config.title}
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            {config.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status-specific alerts */}
          {config.alertVariant && (
            <Alert variant={config.alertVariant}>
              <AlertDescription>
                {config.type === 'error' && (
                  <div className="space-y-2">
                    <p className="font-medium">What you can do:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Check your email for payment confirmation</li>
                      <li>Contact your bank to verify the transaction</li>
                      <li>Try refreshing this page</li>
                      <li>Contact support if issues persist</li>
                    </ul>
                  </div>
                )}
                {config.type === 'failed' && (
                  <div className="space-y-2">
                    <p className="font-medium">Common solutions:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Check your card details and try again</li>
                      <li>Ensure your card has sufficient funds</li>
                      <li>Try a different payment method</li>
                      <li>Contact your bank if declined</li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Success details */}
          {config.type === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Your account is now active</li>
                <li>✓ You have full access to the Revenue Intelligence Engine</li>
                <li>✓ Check your email for the activation confirmation</li>
                <li>✓ Start tracking your conversion intelligence</li>
              </ul>
            </div>
          )}

          {/* Payment session info */}
          {sessionId && config.type !== 'loading' && (
            <div className="text-xs text-gray-500 text-center">
              Session ID: {sessionId.substring(0, 20)}...
            </div>
          )}

          {/* Action buttons */}
          {config.actions && (
            <div className="pt-4 border-t border-gray-200">
              {config.actions}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security notice */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-xs text-gray-400 text-center">
          Secure payment processing by Stripe • SSL encrypted
        </p>
      </div>
    </div>
  );
}

/**
 * Compact payment confirmation for embedded use
 */
export function CompactPaymentConfirmation({
  sessionId,
  status,
}: Pick<PaymentConfirmationProps, 'sessionId' | 'status'>) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      getPaymentSessionStatus(sessionId).then(result => {
        setVerified(result.success && result.payment_status === 'paid');
        setLoading(false);
      });
    } else {
      setVerified(status === 'success');
      setLoading(false);
    }
  }, [sessionId, status]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Verifying payment...
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${
      verified ? 'text-green-700' : 'text-red-700'
    }`}>
      {verified ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Payment confirmed
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4" />
          Payment failed
        </>
      )}
    </div>
  );
}