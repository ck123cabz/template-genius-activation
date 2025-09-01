"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Enhanced Payment Metadata Interface for Story 2.3
 * Extends existing Stripe metadata with correlation tracking data
 */
export interface EnhancedPaymentMetadata {
  // Existing fields (already implemented)
  client_token: string;
  client_id: string;
  journey_id?: string;
  
  // New fields for Story 2.3
  content_version_id?: string;    // Links to specific content version
  journey_start_time?: string;    // ISO string for timing analysis
  page_sequence?: string;         // JSON array of pages visited
  conversion_duration?: string;   // String representation of milliseconds
  
  // Hypothesis context from active content versions
  journey_hypothesis?: string;    // Current journey hypothesis
  page_hypotheses?: string;       // JSON object of page-specific hypotheses
  
  // Attribution data
  referrer?: string;             // Traffic source
  user_agent?: string;           // Device/browser info
}

/**
 * Payment Outcome Correlation Interface
 */
export interface PaymentOutcomeCorrelation {
  id?: string;
  stripe_payment_intent_id: string;
  stripe_session_id?: string;
  client_id: number;
  journey_id?: number;
  content_version_id?: string;
  outcome_type: 'paid' | 'failed' | 'pending' | 'cancelled';
  correlation_timestamp?: string;
  conversion_duration?: number;
  payment_metadata: Record<string, any>;
  journey_context: Record<string, any>;
  manual_override?: {
    admin_id: string;
    override_reason: string;
    original_outcome: string;
    override_timestamp: string;
    notes: string;
  };
}

/**
 * Creates a payment-outcome correlation record
 * Called by Stripe webhooks to establish correlation tracking
 */
export async function createPaymentCorrelation({
  stripePaymentIntentId,
  stripeSessionId,
  clientId,
  outcomeType,
  paymentMetadata = {},
  journeyContext = {},
  conversionDuration,
}: {
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  clientId: number;
  outcomeType: 'paid' | 'failed' | 'pending' | 'cancelled';
  paymentMetadata?: Record<string, any>;
  journeyContext?: Record<string, any>;
  conversionDuration?: number;
}): Promise<{ success: boolean; correlationId?: string; error?: string }> {
  try {
    const supabase = await createServiceClient();
    
    // Check if correlation already exists to prevent duplicates
    const { data: existingCorrelation } = await supabase
      .from("payment_outcome_correlations")
      .select("id")
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .eq("client_id", clientId)
      .single();

    if (existingCorrelation) {
      console.log(`Correlation already exists for payment ${stripePaymentIntentId}`);
      return { success: true, correlationId: existingCorrelation.id };
    }

    // Extract additional correlation data from payment metadata
    const journeyId = paymentMetadata.journey_id ? parseInt(paymentMetadata.journey_id) : undefined;
    const contentVersionId = paymentMetadata.content_version_id;

    // Create the correlation record
    const { data, error } = await supabase
      .from("payment_outcome_correlations")
      .insert({
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_session_id: stripeSessionId,
        client_id: clientId,
        journey_id: journeyId,
        content_version_id: contentVersionId,
        outcome_type: outcomeType,
        correlation_timestamp: new Date().toISOString(),
        conversion_duration: conversionDuration,
        payment_metadata: paymentMetadata,
        journey_context: journeyContext,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating payment correlation:", error);
      return { success: false, error: error.message };
    }

    const correlationId = data.id;

    // Update the client with correlation reference and increment counter
    const { error: clientUpdateError } = await supabase
      .from("clients")
      .update({
        last_correlation_id: correlationId,
        conversion_duration: conversionDuration,
        payment_correlation_count: await getClientCorrelationCount(clientId) + 1,
      })
      .eq("id", clientId);

    if (clientUpdateError) {
      console.error("Error updating client correlation data:", clientUpdateError);
      // Don't fail the correlation creation if client update fails
    }

    console.log(`Payment correlation created: ${correlationId} for payment ${stripePaymentIntentId}`);
    return { success: true, correlationId };

  } catch (error) {
    console.error("Unexpected error creating payment correlation:", error);
    return { success: false, error: "Failed to create payment correlation" };
  }
}

/**
 * Retrieves correlation history for a specific client
 */
export async function getClientCorrelationHistory(
  clientId: number,
  limit: number = 10
): Promise<{ success: boolean; correlations?: PaymentOutcomeCorrelation[]; error?: string }> {
  try {
    const supabase = await createServiceClient();
    
    const { data, error } = await supabase
      .from("payment_outcome_correlations")
      .select("*")
      .eq("client_id", clientId)
      .order("correlation_timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching client correlation history:", error);
      return { success: false, error: error.message };
    }

    return { success: true, correlations: data };

  } catch (error) {
    console.error("Unexpected error fetching correlation history:", error);
    return { success: false, error: "Failed to fetch correlation history" };
  }
}

/**
 * Calculates conversion metrics from correlation data
 */
export async function calculateConversionMetrics(
  clientId?: number,
  dateRange?: { startDate: string; endDate: string }
): Promise<{
  success: boolean;
  metrics?: {
    totalConversions: number;
    averageConversionTime: number;
    conversionRate: number;
    paymentMethods: Record<string, number>;
    outcomeDistribution: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    let query = supabase
      .from("payment_outcome_correlations")
      .select("*");

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (dateRange) {
      query = query
        .gte("correlation_timestamp", dateRange.startDate)
        .lte("correlation_timestamp", dateRange.endDate);
    }

    const { data: correlations, error } = await query;

    if (error) {
      console.error("Error fetching correlation data for metrics:", error);
      return { success: false, error: error.message };
    }

    if (!correlations || correlations.length === 0) {
      return {
        success: true,
        metrics: {
          totalConversions: 0,
          averageConversionTime: 0,
          conversionRate: 0,
          paymentMethods: {},
          outcomeDistribution: {},
        },
      };
    }

    // Calculate metrics
    const totalConversions = correlations.filter(c => c.outcome_type === 'paid').length;
    const totalAttempts = correlations.length;
    
    const conversionTimes = correlations
      .filter(c => c.conversion_duration != null)
      .map(c => c.conversion_duration);
    
    const averageConversionTime = conversionTimes.length > 0 
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
      : 0;

    const conversionRate = totalAttempts > 0 ? (totalConversions / totalAttempts) * 100 : 0;

    // Payment method distribution
    const paymentMethods: Record<string, number> = {};
    correlations.forEach(c => {
      const method = c.payment_metadata?.payment_method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Outcome distribution
    const outcomeDistribution: Record<string, number> = {};
    correlations.forEach(c => {
      outcomeDistribution[c.outcome_type] = (outcomeDistribution[c.outcome_type] || 0) + 1;
    });

    return {
      success: true,
      metrics: {
        totalConversions,
        averageConversionTime,
        conversionRate,
        paymentMethods,
        outcomeDistribution,
      },
    };

  } catch (error) {
    console.error("Unexpected error calculating conversion metrics:", error);
    return { success: false, error: "Failed to calculate conversion metrics" };
  }
}

/**
 * Creates or updates a manual correlation override
 */
export async function overridePaymentCorrelation({
  correlationId,
  adminId,
  overrideReason,
  originalOutcome,
  notes,
  newOutcomeType,
}: {
  correlationId: string;
  adminId: string;
  overrideReason: string;
  originalOutcome: string;
  notes: string;
  newOutcomeType: 'paid' | 'failed' | 'pending' | 'cancelled';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient();
    
    const manualOverride = {
      admin_id: adminId,
      override_reason: overrideReason,
      original_outcome: originalOutcome,
      override_timestamp: new Date().toISOString(),
      notes: notes,
    };

    const { error } = await supabase
      .from("payment_outcome_correlations")
      .update({
        outcome_type: newOutcomeType,
        manual_override: manualOverride,
        updated_at: new Date().toISOString(),
      })
      .eq("id", correlationId);

    if (error) {
      console.error("Error creating correlation override:", error);
      return { success: false, error: error.message };
    }

    console.log(`Payment correlation override created for correlation ${correlationId}`);
    revalidatePath("/dashboard");
    return { success: true };

  } catch (error) {
    console.error("Unexpected error creating correlation override:", error);
    return { success: false, error: "Failed to create correlation override" };
  }
}

/**
 * Validates correlation accuracy by checking for data consistency
 */
export async function validateCorrelationAccuracy(
  correlationId?: string
): Promise<{
  success: boolean;
  validation?: {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  };
  error?: string;
}> {
  try {
    const supabase = await createServiceClient();
    
    let query = supabase
      .from("payment_outcome_correlations")
      .select(`
        *,
        clients (
          id, journey_outcome, payment_received, payment_timestamp, outcome_timestamp
        )
      `);

    if (correlationId) {
      query = query.eq("id", correlationId);
    }

    const { data: correlations, error } = await query.limit(100);

    if (error) {
      console.error("Error fetching correlations for validation:", error);
      return { success: false, error: error.message };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    correlations?.forEach((correlation: any) => {
      const client = correlation.clients;
      
      // Check timestamp consistency
      if (correlation.correlation_timestamp && client.outcome_timestamp) {
        const correlationTime = new Date(correlation.correlation_timestamp);
        const outcomeTime = new Date(client.outcome_timestamp);
        const timeDiff = Math.abs(correlationTime.getTime() - outcomeTime.getTime());
        
        if (timeDiff > 300000) { // 5 minutes
          issues.push(`Correlation ${correlation.id}: Timestamp mismatch > 5 minutes`);
        }
      }

      // Check outcome consistency
      if (correlation.outcome_type === 'paid' && !client.payment_received) {
        issues.push(`Correlation ${correlation.id}: Marked as paid but client.payment_received is false`);
      }

      // Check metadata completeness
      if (!correlation.payment_metadata.client_token && !correlation.payment_metadata.client_id) {
        issues.push(`Correlation ${correlation.id}: Missing client identification in metadata`);
        recommendations.push("Ensure payment metadata includes client_token or client_id");
      }

      // Check conversion duration reasonableness
      if (correlation.conversion_duration && correlation.conversion_duration > 86400000) { // > 24 hours
        issues.push(`Correlation ${correlation.id}: Conversion duration > 24 hours seems unrealistic`);
      }
    });

    const isValid = issues.length === 0;

    if (!isValid) {
      recommendations.push("Review payment webhook metadata collection");
      recommendations.push("Verify timestamp synchronization between systems");
      recommendations.push("Consider implementing correlation cleanup procedures");
    }

    return {
      success: true,
      validation: {
        isValid,
        issues,
        recommendations,
      },
    };

  } catch (error) {
    console.error("Unexpected error validating correlation accuracy:", error);
    return { success: false, error: "Failed to validate correlation accuracy" };
  }
}

/**
 * Helper function to get current correlation count for a client
 */
async function getClientCorrelationCount(clientId: number): Promise<number> {
  try {
    const supabase = await createServiceClient();
    
    const { count, error } = await supabase
      .from("payment_outcome_correlations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (error) {
      console.error("Error counting client correlations:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Unexpected error counting correlations:", error);
    return 0;
  }
}

/**
 * Bulk correlation processing for admin operations
 */
export async function bulkProcessCorrelations({
  correlationIds,
  action,
  adminId,
  notes,
}: {
  correlationIds: string[];
  action: 'validate' | 'override' | 'delete';
  adminId?: string;
  notes?: string;
}): Promise<{ success: boolean; processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    for (const correlationId of correlationIds) {
      try {
        switch (action) {
          case 'validate':
            const validation = await validateCorrelationAccuracy(correlationId);
            if (validation.success) {
              processed++;
            } else {
              errors.push(`Validation failed for ${correlationId}: ${validation.error}`);
            }
            break;
            
          case 'delete':
            const supabase = await createServiceClient();
            const { error } = await supabase
              .from("payment_outcome_correlations")
              .delete()
              .eq("id", correlationId);
              
            if (error) {
              errors.push(`Delete failed for ${correlationId}: ${error.message}`);
            } else {
              processed++;
            }
            break;
            
          default:
            errors.push(`Unknown action: ${action}`);
        }
      } catch (error) {
        errors.push(`Processing error for ${correlationId}: ${error}`);
      }
    }

    revalidatePath("/dashboard");
    return { success: true, processed, errors };

  } catch (error) {
    console.error("Unexpected error in bulk correlation processing:", error);
    return { success: false, processed, errors: [...errors, "Bulk processing failed"] };
  }
}