/**
 * Payment Server Actions for Story 3.1 & 3.3: Stripe Checkout Integration + Content Correlation
 * Handles secure payment session creation with journey metadata correlation and content snapshot creation
 */

'use server';

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe, PAYMENT_AMOUNTS, getPaymentUrls, PaymentResult } from "@/lib/stripe";
import { PaymentMetadataValidator } from "@/lib/payment-metadata";
import { EnhancedPaymentMetadata } from "./correlation-actions";
import { createContentSnapshotWithFallback } from "@/lib/content-snapshots";
import { createPaymentTimingAnalytics } from "@/lib/payment-timing";
import { assignContentVariation } from "@/lib/ab-testing";

/**
 * Interface for payment session creation
 */
interface PaymentSessionData {
  clientId: string;
  amount: number;
  currency: 'usd';
  metadata: {
    client_id: string;
    client_token: string;
    journey_id?: string;
    content_version_id?: string;
    journey_hypothesis?: string;
    page_sequence: string;
    conversion_timing: string;
    journey_start_time?: string;
    referrer?: string;
    user_agent?: string;
  };
}

/**
 * Enhanced payment session result with comprehensive metadata
 */
interface EnhancedPaymentSession {
  sessionId: string;
  sessionUrl: string;
  clientSecret?: string;
  metadata: PaymentSessionData['metadata'];
}

/**
 * Create Stripe Checkout session with journey metadata embedding
 * Core server action for Story 3.1 AC#1 and AC#2
 */
export async function createPaymentSession(
  clientId: string,
  journeyMetadata?: Partial<EnhancedPaymentMetadata>
): Promise<PaymentResult> {
  try {
    // Validate Stripe configuration
    const stripe = getStripe();
    if (!stripe) {
      return {
        success: false,
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Payment system is not properly configured. Please contact support.',
          retryable: false,
        },
      };
    }

    // Fetch client data from database
    const supabase = await createServiceClient();
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        current_journey_pages!inner (
          id,
          page_type,
          content_version,
          hypothesis,
          created_at,
          updated_at
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client fetch error:', clientError);
      return {
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found. Please verify your activation link.',
          retryable: false,
        },
      };
    }

    // Get current content version for metadata correlation
    const { data: activeVersion, error: versionError } = await supabase
      .from('journey_content_versions')
      .select('*')
      .eq('client_id', client.id)
      .eq('page_type', 'activation')
      .eq('is_current', true)
      .single();

    if (versionError) {
      console.warn('No active content version found:', versionError);
    }

    // Prepare enhanced metadata for payment correlation
    const enhancedMetadata: PaymentSessionData['metadata'] = {
      client_id: client.id,
      client_token: client.token || '',
      journey_id: client.current_journey_pages?.[0]?.id || '',
      content_version_id: activeVersion?.id || '',
      journey_hypothesis: activeVersion?.hypothesis || journeyMetadata?.journey_hypothesis || '',
      page_sequence: journeyMetadata?.page_sequence || JSON.stringify(['activation', 'agreement']),
      conversion_timing: journeyMetadata?.conversion_duration || Date.now().toString(),
      journey_start_time: journeyMetadata?.journey_start_time || new Date().toISOString(),
      referrer: journeyMetadata?.referrer || 'direct',
      user_agent: journeyMetadata?.user_agent || 'server-side',
    };

    // Validate and sanitize metadata
    const validatedMetadata = PaymentMetadataValidator.validateMetadata({
      ...journeyMetadata,
      client_id: client.id,
      client_token: client.token || '',
    });

    // Generate payment URLs
    const { success_url, cancel_url } = getPaymentUrls(clientId);

    // Create Stripe Checkout session with comprehensive metadata
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Template Genius Priority Access',
              description: 'Revenue Intelligence Engine Activation - $500 Fee',
              images: [`${process.env.NEXT_PUBLIC_URL}/images/template-genius-logo.png`],
            },
            unit_amount: PAYMENT_AMOUNTS.ACTIVATION_FEE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      customer_email: client.email || undefined,
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        // Core payment identification
        client_id: enhancedMetadata.client_id,
        client_token: enhancedMetadata.client_token,
        journey_id: enhancedMetadata.journey_id || '',
        
        // Content correlation for Story 3.3 foundation
        content_version_id: enhancedMetadata.content_version_id || '',
        journey_hypothesis: (enhancedMetadata.journey_hypothesis || '').substring(0, 500),
        
        // Journey tracking data
        page_sequence: enhancedMetadata.page_sequence || '',
        conversion_timing: enhancedMetadata.conversion_timing || '',
        journey_start_time: enhancedMetadata.journey_start_time || '',
        
        // Attribution data
        referrer: (enhancedMetadata.referrer || '').substring(0, 200),
        user_agent: (enhancedMetadata.user_agent || '').substring(0, 300),
        
        // System metadata
        story_version: '3.1',
        created_at: new Date().toISOString(),
      },
      payment_intent_data: {
        metadata: {
          // Additional metadata for payment intent
          template_genius_client: client.id,
          activation_token: client.token || '',
          payment_purpose: 'activation_fee',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiration
    });

    if (!session.url) {
      return {
        success: false,
        error: {
          code: 'SESSION_CREATION_FAILED',
          message: 'Failed to create payment session. Please try again.',
          retryable: true,
        },
      };
    }

    // ============================================================================
    // STORY 3.3 ENHANCEMENT: Content Snapshot Creation at Payment Initiation
    // ============================================================================

    // Check for A/B test assignment before creating snapshot
    const abTestAssignment = await assignContentVariation(parseInt(clientId, 10));
    
    // Create content snapshot with A/B test variation if assigned
    const snapshotResult = await createContentSnapshotWithFallback(
      parseInt(clientId, 10),
      session.id,
      session.id,
      {
        journey_start_time: enhancedMetadata.journey_start_time,
        user_agent: enhancedMetadata.user_agent,
        referrer: enhancedMetadata.referrer,
        content_variation_id: abTestAssignment.variation?.id,
        variation_name: abTestAssignment.variation?.variation_name
      }
    );

    if (snapshotResult.success && snapshotResult.snapshot) {
      console.log(`Content snapshot created for payment session ${session.id}`);
      
      // Create payment timing analytics record
      const journeyStartTime = enhancedMetadata.journey_start_time 
        ? new Date(enhancedMetadata.journey_start_time)
        : new Date();
      
      const contentLastChangeTime = activeVersion?.updated_at 
        ? new Date(activeVersion.updated_at)
        : new Date();

      const timingAnalyticsResult = await createPaymentTimingAnalytics(
        parseInt(clientId, 10),
        journeyStartTime,
        contentLastChangeTime,
        new Date(),
        snapshotResult.snapshot.id,
        {
          user_agent: enhancedMetadata.user_agent,
          referrer: enhancedMetadata.referrer,
          page_interactions: {
            page_views: 2, // activation + agreement pages
            scroll_depth: 0.8, // Default assumption
            time_on_activation: 300000, // 5 minutes default
            time_on_agreement: 180000, // 3 minutes default
            clicks: 3, // Default interaction estimate
            form_interactions: 1 // Payment form
          },
          engagement_metrics: {
            engagement_score: 75, // Default medium engagement
            attention_span: 'medium',
            interaction_quality: 'moderate',
            decision_confidence: 0.8
          }
        }
      );

      if (timingAnalyticsResult.success) {
        console.log(`Payment timing analytics created for client ${clientId}`);
      } else {
        console.warn('Failed to create timing analytics:', timingAnalyticsResult.error);
      }
      
    } else {
      console.warn('Content snapshot creation failed:', snapshotResult.error);
      // Don't fail the payment session - snapshot is nice-to-have for correlation
    }

    // Update client record with payment session info and snapshot reference
    const updateData: any = {
      payment_session_id: session.id,
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    };

    // Add content snapshot reference if successful
    if (snapshotResult.success && snapshotResult.snapshot) {
      updateData.content_snapshot_id = snapshotResult.snapshot.id;
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId);

    if (updateError) {
      console.error('Failed to update client payment status:', updateError);
      // Continue anyway - payment session was created successfully
    }

    // Record payment session creation in system logs
    console.log(`Payment session created for client ${clientId}:`, {
      sessionId: session.id,
      amount: PAYMENT_AMOUNTS.ACTIVATION_FEE,
      metadata_keys: Object.keys(session.metadata || {}),
    });

    // Revalidate relevant paths for fresh data
    revalidatePath(`/dashboard`);
    revalidatePath(`/journey/${client.token}`);

    return {
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    };

  } catch (error) {
    console.error('Payment session creation error:', error);
    
    // Handle specific Stripe errors with user-friendly messages
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      
      switch (stripeError.type) {
        case 'StripeCardError':
          return {
            success: false,
            error: {
              code: 'CARD_ERROR',
              message: stripeError.message || 'Card processing failed',
              retryable: true,
            },
          };
        case 'StripeRateLimitError':
          return {
            success: false,
            error: {
              code: 'RATE_LIMIT',
              message: 'Too many payment attempts. Please wait a moment and try again.',
              retryable: true,
            },
          };
        case 'StripeInvalidRequestError':
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid payment request. Please contact support.',
              retryable: false,
            },
          };
        default:
          return {
            success: false,
            error: {
              code: 'STRIPE_ERROR',
              message: stripeError.message || 'Payment processing error',
              retryable: true,
            },
          };
      }
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again or contact support.',
        retryable: true,
      },
    };
  }
}

/**
 * Get payment session status by session ID
 * Used for payment confirmation and status tracking
 */
export async function getPaymentSessionStatus(sessionId: string): Promise<{
  success: boolean;
  status?: 'complete' | 'expired' | 'open';
  payment_status?: 'paid' | 'unpaid';
  client_id?: string;
  error?: string;
}> {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return { success: false, error: 'Payment system not configured' };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      success: true,
      status: session.status as 'complete' | 'expired' | 'open',
      payment_status: session.payment_status as 'paid' | 'unpaid',
      client_id: session.metadata?.client_id,
    };

  } catch (error) {
    console.error('Error retrieving payment session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Cancel payment session
 * Used when client abandons payment or needs to retry
 */
export async function cancelPaymentSession(clientId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    // Update client status to cancelled
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        payment_status: 'cancelled',
        payment_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Failed to cancel payment session:', updateError);
      return { success: false, error: 'Failed to cancel payment' };
    }

    // Revalidate dashboard for updated status
    revalidatePath('/dashboard');
    
    return { success: true };

  } catch (error) {
    console.error('Payment cancellation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Retry failed payment
 * Creates new payment session for failed attempts
 */
export async function retryFailedPayment(
  clientId: string,
  journeyMetadata?: Partial<EnhancedPaymentMetadata>
): Promise<PaymentResult> {
  try {
    // First cancel any existing payment session
    await cancelPaymentSession(clientId);
    
    // Create new payment session with updated metadata
    const enhancedMetadata = {
      ...journeyMetadata,
      retry_attempt: 'true',
      retry_timestamp: new Date().toISOString(),
    };
    
    return await createPaymentSession(clientId, enhancedMetadata);

  } catch (error) {
    console.error('Payment retry error:', error);
    return {
      success: false,
      error: {
        code: 'RETRY_FAILED',
        message: 'Failed to retry payment. Please contact support.',
        retryable: false,
      },
    };
  }
}

/**
 * Get client payment status for dashboard display
 * Used in Story 3.2 foundation for payment status integration
 */
export async function getClientPaymentStatus(clientId: string): Promise<{
  success: boolean;
  payment_status?: string;
  payment_session_id?: string;
  amount_paid?: number;
  paid_at?: string;
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('payment_status, payment_session_id, amount_paid, paid_at')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return { success: false, error: 'Client not found' };
    }

    return {
      success: true,
      payment_status: client.payment_status,
      payment_session_id: client.payment_session_id,
      amount_paid: client.amount_paid,
      paid_at: client.paid_at,
    };

  } catch (error) {
    console.error('Error getting client payment status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Story 3.2: Get comprehensive payment analytics for dashboard
 * Returns payment statistics, revenue data, and trend information
 */
export async function getPaymentAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
  success: boolean;
  analytics?: {
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successRate: number;
    averagePaymentAmount: number;
    revenueAtRisk: number;
    trendData: Array<{
      date: string;
      revenue: number;
      payments: number;
      successRate: number;
    }>;
  };
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all clients with payment information within timeframe
    const { data: clients, error } = await supabase
      .from('clients')
      .select('payment_status, payment_received, payment_amount, payment_timestamp, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching payment analytics:', error);
      return { success: false, error: 'Failed to fetch payment data' };
    }

    if (!clients || clients.length === 0) {
      return {
        success: true,
        analytics: {
          totalRevenue: 0,
          successfulPayments: 0,
          failedPayments: 0,
          pendingPayments: 0,
          successRate: 0,
          averagePaymentAmount: 0,
          revenueAtRisk: 0,
          trendData: []
        }
      };
    }

    // Calculate analytics
    const successfulPayments = clients.filter(c => c.payment_received).length;
    const failedPayments = clients.filter(c => c.payment_status === 'failed').length;
    const pendingPayments = clients.filter(c => c.payment_status === 'pending').length;
    
    const totalRevenue = clients
      .filter(c => c.payment_received && c.payment_amount)
      .reduce((sum, c) => sum + (c.payment_amount || 0), 0);

    const successRate = clients.length > 0 
      ? Math.round((successfulPayments / clients.length) * 100)
      : 0;

    const averagePaymentAmount = successfulPayments > 0 
      ? totalRevenue / successfulPayments 
      : 0;

    const revenueAtRisk = failedPayments * 500; // Assuming $500 per failed payment

    // Generate trend data by day
    const trendMap = new Map<string, { revenue: number; payments: number; successful: number }>();
    
    clients.forEach(client => {
      const date = new Date(client.payment_timestamp || client.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { revenue: 0, payments: 0, successful: 0 };
      
      existing.payments++;
      if (client.payment_received) {
        existing.successful++;
        existing.revenue += client.payment_amount || 0;
      }
      
      trendMap.set(date, existing);
    });

    const trendData = Array.from(trendMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: data.revenue,
      payments: data.payments,
      successRate: data.payments > 0 ? Math.round((data.successful / data.payments) * 100) : 0
    }));

    return {
      success: true,
      analytics: {
        totalRevenue,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate,
        averagePaymentAmount,
        revenueAtRisk,
        trendData
      }
    };

  } catch (error) {
    console.error('Error calculating payment analytics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error calculating analytics' 
    };
  }
}

/**
 * Story 3.2: Get all failed payments for alert system
 * Returns clients with failed payment status for dashboard alerts
 */
export async function getFailedPayments(): Promise<{
  success: boolean;
  failedPayments?: Array<{
    clientId: string;
    company: string;
    email: string;
    contact: string;
    paymentAmount: number;
    failedAt: string;
    sessionId?: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, company, email, contact, payment_amount, payment_timestamp, payment_session_id')
      .eq('payment_status', 'failed')
      .order('payment_timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching failed payments:', error);
      return { success: false, error: 'Failed to fetch failed payment data' };
    }

    const failedPayments = (clients || []).map(client => ({
      clientId: client.id.toString(),
      company: client.company,
      email: client.email,
      contact: client.contact,
      paymentAmount: client.payment_amount || 500,
      failedAt: client.payment_timestamp || new Date().toISOString(),
      sessionId: client.payment_session_id
    }));

    return {
      success: true,
      failedPayments
    };

  } catch (error) {
    console.error('Error getting failed payments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Story 3.2: Bulk payment status update
 * Update payment status for multiple clients (for admin operations)
 */
export async function bulkUpdatePaymentStatus(
  clientIds: string[],
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    const updates = {
      payment_status: status,
      updated_at: new Date().toISOString()
    };

    // If marking as succeeded, also update payment_received
    if (status === 'succeeded') {
      Object.assign(updates, {
        payment_received: true,
        payment_timestamp: new Date().toISOString()
      });
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .in('id', clientIds.map(id => parseInt(id, 10)))
      .select('id');

    if (error) {
      console.error('Error bulk updating payment status:', error);
      return { success: false, error: 'Failed to update payment status' };
    }

    // Revalidate dashboard data
    revalidatePath('/dashboard');

    return {
      success: true,
      updatedCount: data?.length || 0
    };

  } catch (error) {
    console.error('Error in bulk payment status update:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}