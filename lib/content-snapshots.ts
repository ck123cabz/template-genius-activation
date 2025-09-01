/**
 * Content Snapshot System for Story 3.3: Content-Payment Correlation Tracking
 * Manages content freezing at payment time and comparison utilities for A/B analysis
 */

// Content snapshot utilities

import { supabaseServer } from "@/lib/supabase-server";
import { createHash } from 'crypto';

/**
 * Interface for content snapshot data structure
 */
export interface ContentSnapshot {
  id: string;
  payment_session_id: string;
  stripe_session_id?: string;
  client_id: number;
  activation_content_id?: number;
  content_version_hash: string;
  snapshot_timestamp: Date;
  content_last_modified: Date;
  content_data: {
    title: string;
    subtitle: string;
    benefits: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    payment_options: {
      optionA: {
        title: string;
        description: string;
        fee: string;
        details?: string;
        additionalInfo?: string;
      };
      optionB?: {
        title: string;
        description: string;
        fee: string;
        details?: string;
        additionalInfo?: string;
      };
    };
    investment_details?: string[];
    guarantee_info?: {
      period: string;
      description: string;
    };
    search_period?: string;
    activation_fee?: string;
    hypothesis?: string;
  };
  payment_timing: {
    content_last_modified: string;
    payment_initiated: string;
    time_to_payment?: number;
    journey_start_time?: string;
  };
  content_variation_id?: string;
  variation_name?: string;
  performance_metrics?: {
    conversion_rate?: number;
    avg_time_to_payment?: number;
    engagement_score?: number;
  };
  created_at: Date;
  updated_at: Date;
}

/**
 * Enhanced content data interface for snapshots
 */
export interface EnhancedContentData {
  title: string;
  subtitle: string;
  benefits: Array<{ title: string; description: string; icon: string }>;
  payment_options: any;
  investment_details?: string[];
  guarantee_info?: any;
  search_period?: string;
  activation_fee?: string;
  hypothesis?: string;
  content_hash?: string;
  snapshot_metadata?: {
    journey_context?: string;
    user_agent?: string;
    referrer?: string;
  };
}

/**
 * Content comparison result interface
 */
export interface ContentComparisonResult {
  has_changes: boolean;
  changed_fields: string[];
  content_similarity: number; // 0-1 score
  major_changes: Array<{
    field: string;
    old_value: string;
    new_value: string;
    change_type: 'text' | 'structure' | 'style';
    impact_score: number;
  }>;
}

/**
 * Generate content hash for comparison and versioning
 */
export function generateContentHash(contentData: EnhancedContentData): string {
  const contentString = JSON.stringify({
    title: contentData.title,
    subtitle: contentData.subtitle,
    benefits: contentData.benefits,
    payment_options: contentData.payment_options,
    investment_details: contentData.investment_details,
    hypothesis: contentData.hypothesis
  });
  
  return createHash('sha256').update(contentString).digest('hex');
}

/**
 * Create content snapshot at payment initiation
 * Core function for Story 3.3 AC#1
 */
export async function createContentSnapshot(
  clientId: number,
  paymentSessionId: string,
  stripeSessionId?: string,
  additionalMetadata?: {
    journey_start_time?: string;
    user_agent?: string;
    referrer?: string;
    content_variation_id?: string;
    variation_name?: string;
  }
): Promise<{ success: boolean; snapshot?: ContentSnapshot; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get current activation content
    const { data: activationContent, error: contentError } = await supabase
      .from('activation_content')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (contentError || !activationContent) {
      console.error('Failed to fetch activation content:', contentError);
      return {
        success: false,
        error: 'No activation content found for snapshot'
      };
    }

    // Get client data for additional context
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Failed to fetch client data:', clientError);
      return {
        success: false,
        error: 'Client not found for snapshot'
      };
    }

    // Prepare enhanced content data with all current values
    const enhancedContentData: EnhancedContentData = {
      title: activationContent.title,
      subtitle: activationContent.subtitle,
      benefits: activationContent.benefits,
      payment_options: activationContent.payment_options,
      investment_details: activationContent.investment_details,
      guarantee_info: activationContent.guarantee_info,
      search_period: activationContent.search_period,
      activation_fee: activationContent.activation_fee,
      hypothesis: client.hypothesis || 'No hypothesis recorded',
      snapshot_metadata: {
        journey_context: `Client ${client.company} activation journey`,
        user_agent: additionalMetadata?.user_agent || 'server-side',
        referrer: additionalMetadata?.referrer || 'direct'
      }
    };

    // Generate content hash for versioning
    const contentHash = generateContentHash(enhancedContentData);

    // Prepare payment timing data
    const paymentTiming = {
      content_last_modified: activationContent.updated_at,
      payment_initiated: new Date().toISOString(),
      journey_start_time: additionalMetadata?.journey_start_time || new Date().toISOString(),
      time_to_payment: additionalMetadata?.journey_start_time 
        ? Date.now() - new Date(additionalMetadata.journey_start_time).getTime()
        : null
    };

    // Create content snapshot record
    const { data: snapshot, error: snapshotError } = await supabase
      .from('content_snapshots')
      .insert({
        payment_session_id: paymentSessionId,
        stripe_session_id: stripeSessionId,
        client_id: clientId,
        activation_content_id: activationContent.id,
        content_version_hash: contentHash,
        snapshot_timestamp: new Date().toISOString(),
        content_last_modified: activationContent.updated_at,
        content_data: enhancedContentData,
        payment_timing: paymentTiming,
        content_variation_id: additionalMetadata?.content_variation_id,
        variation_name: additionalMetadata?.variation_name,
        performance_metrics: {
          snapshot_created: true,
          baseline_version: !additionalMetadata?.content_variation_id
        }
      })
      .select()
      .single();

    if (snapshotError) {
      console.error('Failed to create content snapshot:', snapshotError);
      return {
        success: false,
        error: 'Failed to create content snapshot'
      };
    }

    console.log(`Content snapshot created for client ${clientId}, session ${paymentSessionId}`);
    
    return {
      success: true,
      snapshot: snapshot as ContentSnapshot
    };

  } catch (error) {
    console.error('Unexpected error creating content snapshot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Create minimal fallback snapshot when full snapshot creation fails
 * Ensures we always capture some content correlation data
 */
export async function createMinimalSnapshot(
  clientId: number,
  paymentSessionId: string,
  fallbackReason: string
): Promise<{ success: boolean; snapshot?: ContentSnapshot; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Create minimal snapshot with basic data
    const minimalContentData = {
      title: 'Fallback Content Snapshot',
      subtitle: 'Content snapshot created as fallback',
      benefits: [],
      payment_options: {
        optionA: {
          title: 'Priority Access',
          description: 'Fallback payment option',
          fee: '$500'
        }
      },
      hypothesis: 'Fallback snapshot - original content unavailable'
    };

    const { data: snapshot, error } = await supabase
      .from('content_snapshots')
      .insert({
        payment_session_id: paymentSessionId,
        client_id: clientId,
        content_version_hash: 'fallback_' + Date.now(),
        snapshot_timestamp: new Date().toISOString(),
        content_last_modified: new Date().toISOString(),
        content_data: minimalContentData,
        payment_timing: {
          content_last_modified: new Date().toISOString(),
          payment_initiated: new Date().toISOString(),
          fallback_reason: fallbackReason
        },
        performance_metrics: {
          is_fallback: true,
          fallback_reason: fallbackReason
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create minimal snapshot:', error);
      return { success: false, error: 'Failed to create minimal snapshot' };
    }

    return {
      success: true,
      snapshot: snapshot as ContentSnapshot
    };

  } catch (error) {
    console.error('Error creating minimal snapshot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Compare two content snapshots for A/B testing analysis
 */
export function compareContentSnapshots(
  snapshotA: ContentSnapshot,
  snapshotB: ContentSnapshot
): ContentComparisonResult {
  const fieldsToCompare = ['title', 'subtitle', 'benefits', 'payment_options'];
  const changedFields: string[] = [];
  const majorChanges: any[] = [];

  fieldsToCompare.forEach(field => {
    const valueA = JSON.stringify(snapshotA.content_data[field as keyof typeof snapshotA.content_data]);
    const valueB = JSON.stringify(snapshotB.content_data[field as keyof typeof snapshotB.content_data]);

    if (valueA !== valueB) {
      changedFields.push(field);
      
      // Calculate impact score based on field importance and change magnitude
      let impactScore = 0;
      if (field === 'title') impactScore = 0.9;
      else if (field === 'subtitle') impactScore = 0.7;
      else if (field === 'payment_options') impactScore = 0.8;
      else if (field === 'benefits') impactScore = 0.6;

      majorChanges.push({
        field,
        old_value: valueA,
        new_value: valueB,
        change_type: field === 'payment_options' ? 'structure' : 'text',
        impact_score: impactScore
      });
    }
  });

  const contentSimilarity = 1 - (changedFields.length / fieldsToCompare.length);

  return {
    has_changes: changedFields.length > 0,
    changed_fields: changedFields,
    content_similarity: Math.round(contentSimilarity * 100) / 100,
    major_changes: majorChanges
  };
}

/**
 * Get content snapshot by payment session ID
 */
export async function getContentSnapshotBySession(
  paymentSessionId: string
): Promise<{ success: boolean; snapshot?: ContentSnapshot; error?: string }> {
  try {
    const supabase = supabaseServer();

    const { data: snapshot, error } = await supabase
      .from('content_snapshots')
      .select('*')
      .eq('payment_session_id', paymentSessionId)
      .single();

    if (error) {
      console.error('Error fetching content snapshot:', error);
      return { success: false, error: 'Snapshot not found' };
    }

    return {
      success: true,
      snapshot: snapshot as ContentSnapshot
    };

  } catch (error) {
    console.error('Unexpected error fetching snapshot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Get all content snapshots for a client
 */
export async function getClientContentSnapshots(
  clientId: number,
  limit: number = 10
): Promise<{ success: boolean; snapshots?: ContentSnapshot[]; error?: string }> {
  try {
    const supabase = supabaseServer();

    const { data: snapshots, error } = await supabase
      .from('content_snapshots')
      .select('*')
      .eq('client_id', clientId)
      .order('snapshot_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client snapshots:', error);
      return { success: false, error: 'Failed to fetch snapshots' };
    }

    return {
      success: true,
      snapshots: snapshots as ContentSnapshot[]
    };

  } catch (error) {
    console.error('Unexpected error fetching client snapshots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Update snapshot performance metrics after payment completion
 */
export async function updateSnapshotPerformanceMetrics(
  snapshotId: string,
  metrics: {
    conversion_rate?: number;
    time_to_payment?: number;
    payment_outcome?: 'succeeded' | 'failed' | 'abandoned';
    engagement_score?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get current snapshot to merge with new metrics
    const { data: currentSnapshot, error: fetchError } = await supabase
      .from('content_snapshots')
      .select('performance_metrics')
      .eq('id', snapshotId)
      .single();

    if (fetchError) {
      console.error('Error fetching current snapshot metrics:', fetchError);
      return { success: false, error: 'Snapshot not found' };
    }

    // Merge existing metrics with new metrics
    const updatedMetrics = {
      ...currentSnapshot.performance_metrics,
      ...metrics,
      last_updated: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('content_snapshots')
      .update({
        performance_metrics: updatedMetrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', snapshotId);

    if (updateError) {
      console.error('Error updating snapshot metrics:', updateError);
      return { success: false, error: 'Failed to update metrics' };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error updating snapshot metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Robust content snapshot creation with fallback
 * Ensures payment flow is never blocked by snapshot failures
 */
export async function createContentSnapshotWithFallback(
  clientId: number,
  paymentSessionId: string,
  stripeSessionId?: string,
  additionalMetadata?: any
): Promise<{ success: boolean; snapshot?: ContentSnapshot; error?: string }> {
  try {
    // Attempt normal snapshot creation first
    const result = await createContentSnapshot(
      clientId,
      paymentSessionId,
      stripeSessionId,
      additionalMetadata
    );

    if (result.success) {
      return result;
    }

    // If normal creation fails, create minimal fallback
    console.warn('Normal snapshot creation failed, creating fallback:', result.error);
    
    return await createMinimalSnapshot(
      clientId,
      paymentSessionId,
      result.error || 'Unknown error in primary snapshot creation'
    );

  } catch (error) {
    console.error('Critical error in snapshot creation:', error);
    
    // Last resort: create minimal fallback
    return await createMinimalSnapshot(
      clientId,
      paymentSessionId,
      `Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}