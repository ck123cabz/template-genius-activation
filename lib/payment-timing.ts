/**
 * Payment Timing Analytics System for Story 3.3: Content-Payment Correlation Tracking
 * Handles time-to-payment tracking and content performance scoring
 */

'use server';

import { supabaseServer } from "@/lib/supabase-server";

/**
 * Interface for payment timing analytics
 */
export interface PaymentTimingAnalytics {
  id: string;
  client_id: number;
  content_snapshot_id?: string;
  payment_correlation_id?: string;
  journey_start_time: Date;
  content_last_change_time: Date;
  payment_initiation_time?: Date;
  payment_completion_time?: Date;
  content_viewing_duration?: number; // milliseconds
  payment_process_duration?: number; // milliseconds
  total_journey_duration?: number; // milliseconds
  time_to_payment?: number; // milliseconds - key metric
  page_interactions?: {
    page_views: number;
    scroll_depth: number;
    time_on_activation: number;
    time_on_agreement: number;
    clicks: number;
    form_interactions: number;
  };
  engagement_metrics?: {
    engagement_score: number;
    attention_span: 'low' | 'medium' | 'high';
    interaction_quality: 'weak' | 'moderate' | 'strong';
    decision_confidence: number; // 0-1 score
  };
  conversion_velocity_score: number; // 0-100, higher is better
  content_effectiveness_score: number; // 0-100
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface for content performance metrics
 */
export interface ContentPerformanceMetrics {
  average_time_to_payment: number;
  conversion_velocity_score: number;
  content_effectiveness_score: number;
  total_conversions: number;
  success_rate: number;
  engagement_metrics: {
    average_engagement_score: number;
    average_scroll_depth: number;
    average_interaction_count: number;
  };
  timing_distribution: {
    under_30_minutes: number;
    under_1_hour: number;
    under_2_hours: number;
    under_24_hours: number;
    over_24_hours: number;
  };
}

/**
 * Create payment timing analytics record
 * Core function for Story 3.3 AC#2
 */
export async function createPaymentTimingAnalytics(
  clientId: number,
  journeyStartTime: Date,
  contentLastChangeTime: Date,
  paymentInitiationTime?: Date,
  contentSnapshotId?: string,
  additionalData?: {
    page_interactions?: any;
    engagement_metrics?: any;
    user_agent?: string;
    referrer?: string;
  }
): Promise<{ success: boolean; analytics?: PaymentTimingAnalytics; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Calculate initial durations
    const now = new Date();
    const paymentInitTime = paymentInitiationTime || now;
    
    const contentViewingDuration = paymentInitTime.getTime() - contentLastChangeTime.getTime();
    const totalJourneyDuration = paymentInitTime.getTime() - journeyStartTime.getTime();
    const timeToPayment = paymentInitTime.getTime() - contentLastChangeTime.getTime();

    // Calculate conversion velocity score (0-100)
    // Higher score for faster decisions within reasonable timeframe
    let conversionVelocityScore = 0;
    const timeToPaymentHours = timeToPayment / (1000 * 60 * 60);
    
    if (timeToPaymentHours <= 1) {
      conversionVelocityScore = 100; // Immediate conversion
    } else if (timeToPaymentHours <= 2) {
      conversionVelocityScore = 90; // Very fast
    } else if (timeToPaymentHours <= 6) {
      conversionVelocityScore = 80; // Fast
    } else if (timeToPaymentHours <= 24) {
      conversionVelocityScore = 60; // Same day
    } else if (timeToPaymentHours <= 72) {
      conversionVelocityScore = 40; // Within 3 days
    } else {
      conversionVelocityScore = 20; // Slow conversion
    }

    // Calculate content effectiveness score based on engagement and timing
    let contentEffectivenessScore = 50; // Base score

    if (additionalData?.engagement_metrics) {
      const engagementScore = additionalData.engagement_metrics.engagement_score || 0;
      contentEffectivenessScore = Math.min(100, (engagementScore * 0.7) + (conversionVelocityScore * 0.3));
    } else {
      // Use timing-only scoring if no engagement data
      contentEffectivenessScore = Math.min(100, conversionVelocityScore * 0.8);
    }

    // Prepare analytics data
    const analyticsData = {
      client_id: clientId,
      content_snapshot_id: contentSnapshotId,
      journey_start_time: journeyStartTime.toISOString(),
      content_last_change_time: contentLastChangeTime.toISOString(),
      payment_initiation_time: paymentInitTime.toISOString(),
      content_viewing_duration: contentViewingDuration,
      total_journey_duration: totalJourneyDuration,
      time_to_payment: timeToPayment,
      page_interactions: additionalData?.page_interactions || {
        page_views: 1,
        scroll_depth: 0.5,
        time_on_activation: contentViewingDuration,
        time_on_agreement: 0,
        clicks: 1,
        form_interactions: 1
      },
      engagement_metrics: additionalData?.engagement_metrics || {
        engagement_score: 50,
        attention_span: 'medium',
        interaction_quality: 'moderate',
        decision_confidence: 0.7
      },
      conversion_velocity_score: Math.round(conversionVelocityScore * 100) / 100,
      content_effectiveness_score: Math.round(contentEffectivenessScore * 100) / 100
    };

    // Insert analytics record
    const { data: analytics, error } = await supabase
      .from('payment_timing_analytics')
      .insert(analyticsData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create payment timing analytics:', error);
      return {
        success: false,
        error: 'Failed to create timing analytics'
      };
    }

    console.log(`Payment timing analytics created for client ${clientId}`);

    return {
      success: true,
      analytics: analytics as PaymentTimingAnalytics
    };

  } catch (error) {
    console.error('Unexpected error creating payment timing analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Update payment timing analytics with completion data
 * Called when payment is completed to finalize timing metrics
 */
export async function updatePaymentTimingCompletion(
  analyticsId: string,
  paymentCompletionTime: Date,
  paymentOutcome: 'succeeded' | 'failed' | 'abandoned'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get current analytics to calculate completion metrics
    const { data: currentAnalytics, error: fetchError } = await supabase
      .from('payment_timing_analytics')
      .select('*')
      .eq('id', analyticsId)
      .single();

    if (fetchError || !currentAnalytics) {
      console.error('Error fetching current analytics:', fetchError);
      return { success: false, error: 'Analytics record not found' };
    }

    // Calculate payment process duration
    const paymentInitTime = new Date(currentAnalytics.payment_initiation_time);
    const paymentProcessDuration = paymentCompletionTime.getTime() - paymentInitTime.getTime();

    // Calculate total journey duration
    const journeyStartTime = new Date(currentAnalytics.journey_start_time);
    const totalJourneyDuration = paymentCompletionTime.getTime() - journeyStartTime.getTime();

    // Update conversion velocity score based on final outcome
    let updatedVelocityScore = currentAnalytics.conversion_velocity_score;
    if (paymentOutcome === 'succeeded') {
      // Bonus for successful completion
      updatedVelocityScore = Math.min(100, updatedVelocityScore * 1.1);
    } else if (paymentOutcome === 'failed') {
      // Penalty for failed payment
      updatedVelocityScore = updatedVelocityScore * 0.7;
    } else if (paymentOutcome === 'abandoned') {
      // Larger penalty for abandonment
      updatedVelocityScore = updatedVelocityScore * 0.5;
    }

    // Update content effectiveness score
    let updatedEffectivenessScore = currentAnalytics.content_effectiveness_score;
    if (paymentOutcome === 'succeeded') {
      updatedEffectivenessScore = Math.min(100, updatedEffectivenessScore * 1.15);
    } else {
      updatedEffectivenessScore = updatedEffectivenessScore * 0.6;
    }

    // Update analytics record
    const { error: updateError } = await supabase
      .from('payment_timing_analytics')
      .update({
        payment_completion_time: paymentCompletionTime.toISOString(),
        payment_process_duration: paymentProcessDuration,
        total_journey_duration: totalJourneyDuration,
        conversion_velocity_score: Math.round(updatedVelocityScore * 100) / 100,
        content_effectiveness_score: Math.round(updatedEffectivenessScore * 100) / 100,
        engagement_metrics: {
          ...currentAnalytics.engagement_metrics,
          payment_outcome: paymentOutcome,
          completion_timestamp: paymentCompletionTime.toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', analyticsId);

    if (updateError) {
      console.error('Error updating payment timing completion:', updateError);
      return { success: false, error: 'Failed to update analytics' };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error updating payment timing completion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Calculate content performance metrics for a given timeframe
 * Provides aggregated analytics for content optimization
 */
export async function calculateContentPerformanceMetrics(
  timeframe: 'week' | 'month' | 'quarter' = 'month',
  contentVariationId?: string
): Promise<{ success: boolean; metrics?: ContentPerformanceMetrics; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Calculate date range
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
    }

    // Build query with optional content variation filter
    let query = supabase
      .from('payment_timing_analytics')
      .select(`
        *,
        content_snapshots!inner(content_variation_id, variation_name)
      `)
      .gte('journey_start_time', startDate.toISOString());

    if (contentVariationId) {
      query = query.eq('content_snapshots.content_variation_id', contentVariationId);
    }

    const { data: analytics, error } = await query;

    if (error) {
      console.error('Error fetching analytics for performance calculation:', error);
      return { success: false, error: 'Failed to fetch analytics data' };
    }

    if (!analytics || analytics.length === 0) {
      return {
        success: true,
        metrics: {
          average_time_to_payment: 0,
          conversion_velocity_score: 0,
          content_effectiveness_score: 0,
          total_conversions: 0,
          success_rate: 0,
          engagement_metrics: {
            average_engagement_score: 0,
            average_scroll_depth: 0,
            average_interaction_count: 0
          },
          timing_distribution: {
            under_30_minutes: 0,
            under_1_hour: 0,
            under_2_hours: 0,
            under_24_hours: 0,
            over_24_hours: 0
          }
        }
      };
    }

    // Calculate performance metrics
    const validAnalytics = analytics.filter(a => a.time_to_payment > 0);
    const totalConversions = validAnalytics.length;
    
    const averageTimeToPayment = validAnalytics.length > 0
      ? validAnalytics.reduce((sum, a) => sum + a.time_to_payment, 0) / validAnalytics.length
      : 0;

    const averageVelocityScore = validAnalytics.length > 0
      ? validAnalytics.reduce((sum, a) => sum + a.conversion_velocity_score, 0) / validAnalytics.length
      : 0;

    const averageEffectivenessScore = validAnalytics.length > 0
      ? validAnalytics.reduce((sum, a) => sum + a.content_effectiveness_score, 0) / validAnalytics.length
      : 0;

    // Calculate engagement metrics
    const engagementScores = validAnalytics
      .filter(a => a.engagement_metrics?.engagement_score)
      .map(a => a.engagement_metrics.engagement_score);
    
    const scrollDepths = validAnalytics
      .filter(a => a.page_interactions?.scroll_depth)
      .map(a => a.page_interactions.scroll_depth);
    
    const interactionCounts = validAnalytics
      .filter(a => a.page_interactions?.clicks)
      .map(a => (a.page_interactions?.clicks || 0) + (a.page_interactions?.form_interactions || 0));

    const averageEngagementScore = engagementScores.length > 0
      ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
      : 0;

    const averageScrollDepth = scrollDepths.length > 0
      ? scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length
      : 0;

    const averageInteractionCount = interactionCounts.length > 0
      ? interactionCounts.reduce((sum, count) => sum + count, 0) / interactionCounts.length
      : 0;

    // Calculate timing distribution
    const timingDistribution = validAnalytics.reduce((dist, a) => {
      const timeInMinutes = a.time_to_payment / (1000 * 60);
      
      if (timeInMinutes <= 30) {
        dist.under_30_minutes++;
      } else if (timeInMinutes <= 60) {
        dist.under_1_hour++;
      } else if (timeInMinutes <= 120) {
        dist.under_2_hours++;
      } else if (timeInMinutes <= 1440) {
        dist.under_24_hours++;
      } else {
        dist.over_24_hours++;
      }
      
      return dist;
    }, {
      under_30_minutes: 0,
      under_1_hour: 0,
      under_2_hours: 0,
      under_24_hours: 0,
      over_24_hours: 0
    });

    // Calculate success rate (assuming we have completed payments)
    const successfulPayments = validAnalytics.filter(a => 
      a.engagement_metrics?.payment_outcome === 'succeeded' ||
      a.conversion_velocity_score > 70 // High velocity likely indicates success
    ).length;
    
    const successRate = totalConversions > 0 
      ? (successfulPayments / totalConversions) * 100 
      : 0;

    const performanceMetrics: ContentPerformanceMetrics = {
      average_time_to_payment: Math.round(averageTimeToPayment),
      conversion_velocity_score: Math.round(averageVelocityScore * 100) / 100,
      content_effectiveness_score: Math.round(averageEffectivenessScore * 100) / 100,
      total_conversions: totalConversions,
      success_rate: Math.round(successRate * 100) / 100,
      engagement_metrics: {
        average_engagement_score: Math.round(averageEngagementScore * 100) / 100,
        average_scroll_depth: Math.round(averageScrollDepth * 100) / 100,
        average_interaction_count: Math.round(averageInteractionCount * 100) / 100
      },
      timing_distribution: timingDistribution
    };

    return {
      success: true,
      metrics: performanceMetrics
    };

  } catch (error) {
    console.error('Unexpected error calculating content performance metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Get timing analytics for a specific client
 */
export async function getClientTimingAnalytics(
  clientId: number
): Promise<{ success: boolean; analytics?: PaymentTimingAnalytics[]; error?: string }> {
  try {
    const supabase = supabaseServer();

    const { data: analytics, error } = await supabase
      .from('payment_timing_analytics')
      .select('*')
      .eq('client_id', clientId)
      .order('journey_start_time', { ascending: false });

    if (error) {
      console.error('Error fetching client timing analytics:', error);
      return { success: false, error: 'Failed to fetch analytics' };
    }

    return {
      success: true,
      analytics: analytics as PaymentTimingAnalytics[]
    };

  } catch (error) {
    console.error('Unexpected error fetching client timing analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Calculate time-to-payment correlation score
 * Higher scores indicate better content performance for driving quick decisions
 */
export function calculateTimeToPaymentScore(timeToPaymentMs: number): number {
  const timeInHours = timeToPaymentMs / (1000 * 60 * 60);
  
  // Optimal conversion time curve
  if (timeInHours <= 0.5) {
    return 100; // Immediate decision
  } else if (timeInHours <= 2) {
    return 95; // Very quick decision
  } else if (timeInHours <= 6) {
    return 85; // Quick decision
  } else if (timeInHours <= 24) {
    return 70; // Same day decision
  } else if (timeInHours <= 72) {
    return 50; // Three day decision
  } else if (timeInHours <= 168) {
    return 30; // One week decision
  } else {
    return 10; // Very slow decision
  }
}