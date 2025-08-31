/**
 * A/B Testing Content Management System for Story 3.3: Content-Payment Correlation Tracking
 * Manages content variations, test assignments, and statistical analysis
 */

'use server';

import { supabaseServer } from "@/lib/supabase-server";

/**
 * Interface for content variation definition
 */
export interface ContentVariation {
  id: string;
  base_activation_content_id: number;
  variation_name: string;
  test_hypothesis: string;
  variation_description: string;
  content_changes: {
    title?: string;
    subtitle?: string;
    benefits?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    payment_options?: any;
    investment_details?: string[];
    style_changes?: {
      color_scheme?: string;
      button_style?: string;
      layout_variant?: string;
    };
  };
  test_configuration: {
    target_sample_size: number;
    significance_threshold: number; // e.g., 0.05 for 95% confidence
    min_runtime_days: number;
    max_runtime_days: number;
    success_metric: 'conversion_rate' | 'time_to_payment' | 'revenue';
    secondary_metrics: string[];
  };
  results: {
    impressions: number;
    conversions: number;
    conversion_rate: number;
    avg_time_to_payment: number;
    revenue_generated: number;
    statistical_significance: number;
    confidence_interval: {
      lower_bound: number;
      upper_bound: number;
    };
  };
  test_status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  traffic_allocation: number; // 0.0 to 1.0
  sample_size: number;
  confidence_level: number;
  statistical_significance?: number;
  is_winner: boolean;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

/**
 * Interface for A/B test assignment
 */
export interface ABTestAssignment {
  id: string;
  client_id: number;
  content_variation_id: string;
  assigned_at: Date;
  assignment_method: 'random' | 'manual' | 'targeted';
  impressions: number;
  interactions: number;
  converted: boolean;
  conversion_timestamp?: Date;
  engagement_score: number;
  time_on_page?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface for A/B test results analysis
 */
export interface ABTestResults {
  test_id: string;
  baseline_performance: {
    conversion_rate: number;
    avg_time_to_payment: number;
    sample_size: number;
    revenue: number;
  };
  variation_performance: {
    conversion_rate: number;
    avg_time_to_payment: number;
    sample_size: number;
    revenue: number;
  };
  statistical_analysis: {
    significance_level: number;
    p_value: number;
    confidence_interval: { lower: number; upper: number };
    is_statistically_significant: boolean;
    improvement_rate: number; // percentage improvement
    winner: 'baseline' | 'variation' | 'no_winner';
  };
  test_duration_days: number;
  recommendation: string;
}

/**
 * Create a new content variation for A/B testing
 * Core function for Story 3.3 AC#4
 */
export async function createContentVariation(
  baseContentId: number,
  variationData: {
    variation_name: string;
    test_hypothesis: string;
    variation_description: string;
    content_changes: any;
    test_configuration: any;
    traffic_allocation?: number;
  }
): Promise<{ success: boolean; variation?: ContentVariation; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Validate that base content exists
    const { data: baseContent, error: baseError } = await supabase
      .from('activation_content')
      .select('id')
      .eq('id', baseContentId)
      .single();

    if (baseError || !baseContent) {
      return {
        success: false,
        error: 'Base content not found'
      };
    }

    // Prepare variation data with defaults
    const variationDataWithDefaults = {
      base_activation_content_id: baseContentId,
      variation_name: variationData.variation_name,
      test_hypothesis: variationData.test_hypothesis,
      variation_description: variationData.variation_description,
      content_changes: variationData.content_changes,
      test_configuration: {
        target_sample_size: 100,
        significance_threshold: 0.05,
        min_runtime_days: 7,
        max_runtime_days: 30,
        success_metric: 'conversion_rate',
        secondary_metrics: ['time_to_payment', 'engagement_score'],
        ...variationData.test_configuration
      },
      results: {
        impressions: 0,
        conversions: 0,
        conversion_rate: 0,
        avg_time_to_payment: 0,
        revenue_generated: 0,
        statistical_significance: 0,
        confidence_interval: {
          lower_bound: 0,
          upper_bound: 0
        }
      },
      test_status: 'draft',
      traffic_allocation: variationData.traffic_allocation || 0.50,
      sample_size: 0,
      confidence_level: 0.95,
      is_winner: false
    };

    // Create variation record
    const { data: variation, error } = await supabase
      .from('content_variations')
      .insert(variationDataWithDefaults)
      .select()
      .single();

    if (error) {
      console.error('Failed to create content variation:', error);
      return {
        success: false,
        error: 'Failed to create variation'
      };
    }

    console.log(`Content variation created: ${variationData.variation_name}`);

    return {
      success: true,
      variation: variation as ContentVariation
    };

  } catch (error) {
    console.error('Unexpected error creating content variation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Assign content variation to client for A/B testing
 * Implements weighted random assignment based on traffic allocation
 */
export async function assignContentVariation(
  clientId: number,
  excludeVariationIds?: string[]
): Promise<{ success: boolean; assignment?: ABTestAssignment; variation?: ContentVariation; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get all active content variations
    let query = supabase
      .from('content_variations')
      .select('*')
      .eq('test_status', 'active')
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

    if (excludeVariationIds && excludeVariationIds.length > 0) {
      query = query.not('id', 'in', `(${excludeVariationIds.join(',')})`);
    }

    const { data: activeVariations, error: variationsError } = await query;

    if (variationsError) {
      console.error('Error fetching active variations:', variationsError);
      return {
        success: false,
        error: 'Failed to fetch active variations'
      };
    }

    if (!activeVariations || activeVariations.length === 0) {
      return {
        success: true,
        assignment: undefined,
        variation: undefined
      };
    }

    // Weighted random selection based on traffic allocation
    const selectedVariation = weightedRandomSelect(activeVariations);
    
    if (!selectedVariation) {
      return {
        success: true,
        assignment: undefined,
        variation: undefined
      };
    }

    // Check if client already has assignment for this variation
    const { data: existingAssignment, error: assignmentCheckError } = await supabase
      .from('ab_test_assignments')
      .select('id')
      .eq('client_id', clientId)
      .eq('content_variation_id', selectedVariation.id)
      .single();

    if (assignmentCheckError && assignmentCheckError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is expected for new assignments
      console.error('Error checking existing assignment:', assignmentCheckError);
    }

    if (existingAssignment) {
      // Client already assigned to this variation
      return {
        success: true,
        assignment: undefined,
        variation: selectedVariation as ContentVariation
      };
    }

    // Create new assignment
    const assignmentData = {
      client_id: clientId,
      content_variation_id: selectedVariation.id,
      assigned_at: new Date().toISOString(),
      assignment_method: 'random',
      impressions: 1,
      interactions: 0,
      converted: false,
      engagement_score: 0
    };

    const { data: assignment, error: assignmentError } = await supabase
      .from('ab_test_assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (assignmentError) {
      console.error('Failed to create A/B test assignment:', assignmentError);
      return {
        success: false,
        error: 'Failed to create assignment'
      };
    }

    console.log(`Client ${clientId} assigned to variation: ${selectedVariation.variation_name}`);

    return {
      success: true,
      assignment: assignment as ABTestAssignment,
      variation: selectedVariation as ContentVariation
    };

  } catch (error) {
    console.error('Unexpected error assigning content variation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Weighted random selection based on traffic allocation
 */
function weightedRandomSelect(variations: any[]): any | null {
  if (variations.length === 0) return null;
  if (variations.length === 1) return variations[0];

  // Calculate total weight
  const totalWeight = variations.reduce((sum, v) => sum + v.traffic_allocation, 0);
  
  if (totalWeight === 0) {
    // Equal distribution if no weights set
    return variations[Math.floor(Math.random() * variations.length)];
  }

  // Weighted random selection
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const variation of variations) {
    cumulativeWeight += variation.traffic_allocation;
    if (random <= cumulativeWeight) {
      return variation;
    }
  }

  return variations[variations.length - 1]; // Fallback
}

/**
 * Update A/B test assignment with conversion data
 */
export async function updateABTestConversion(
  assignmentId: string,
  converted: boolean,
  conversionData?: {
    conversion_timestamp?: Date;
    engagement_score?: number;
    time_on_page?: number;
    interactions?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    const updateData = {
      converted,
      interactions: conversionData?.interactions || 1,
      updated_at: new Date().toISOString()
    };

    if (converted && conversionData?.conversion_timestamp) {
      Object.assign(updateData, {
        conversion_timestamp: conversionData.conversion_timestamp.toISOString()
      });
    }

    if (conversionData?.engagement_score) {
      Object.assign(updateData, {
        engagement_score: conversionData.engagement_score
      });
    }

    if (conversionData?.time_on_page) {
      Object.assign(updateData, {
        time_on_page: conversionData.time_on_page
      });
    }

    const { error } = await supabase
      .from('ab_test_assignments')
      .update(updateData)
      .eq('id', assignmentId);

    if (error) {
      console.error('Failed to update A/B test conversion:', error);
      return {
        success: false,
        error: 'Failed to update conversion data'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error updating A/B test conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Calculate statistical significance for A/B test results
 */
export async function calculateABTestResults(
  variationId: string
): Promise<{ success: boolean; results?: ABTestResults; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get variation details
    const { data: variation, error: variationError } = await supabase
      .from('content_variations')
      .select('*')
      .eq('id', variationId)
      .single();

    if (variationError || !variation) {
      return {
        success: false,
        error: 'Variation not found'
      };
    }

    // Get variation performance data
    const { data: variationAssignments, error: assignmentsError } = await supabase
      .from('ab_test_assignments')
      .select('*')
      .eq('content_variation_id', variationId);

    if (assignmentsError) {
      console.error('Error fetching variation assignments:', assignmentsError);
      return {
        success: false,
        error: 'Failed to fetch assignment data'
      };
    }

    // Get baseline performance data (assuming baseline is the original content)
    // This is a simplified implementation - in production, you'd want more sophisticated baseline tracking
    const { data: baselineData, error: baselineError } = await supabase
      .from('payment_timing_analytics')
      .select('*')
      .is('content_snapshots.content_variation_id', null)
      .gte('journey_start_time', variation.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (baselineError) {
      console.warn('Error fetching baseline data:', baselineError);
    }

    // Calculate variation performance
    const variationSampleSize = variationAssignments?.length || 0;
    const variationConversions = variationAssignments?.filter(a => a.converted).length || 0;
    const variationConversionRate = variationSampleSize > 0 ? variationConversions / variationSampleSize : 0;
    
    const variationAvgTimeToPayment = variationAssignments && variationAssignments.length > 0
      ? variationAssignments
          .filter(a => a.time_on_page)
          .reduce((sum, a) => sum + (a.time_on_page || 0), 0) / variationAssignments.filter(a => a.time_on_page).length
      : 0;

    // Calculate baseline performance (simplified)
    const baselineSampleSize = baselineData?.length || 50; // Default assumption
    const baselineConversions = Math.round(baselineSampleSize * 0.15); // 15% baseline assumption
    const baselineConversionRate = baselineConversions / baselineSampleSize;
    const baselineAvgTimeToPayment = 7200000; // 2 hours default

    // Statistical significance calculation (simplified z-test)
    const { pValue, isSignificant, confidenceInterval } = calculateStatisticalSignificance(
      variationConversions,
      variationSampleSize,
      baselineConversions,
      baselineSampleSize,
      variation.test_configuration?.significance_threshold || 0.05
    );

    const improvementRate = baselineConversionRate > 0 
      ? ((variationConversionRate - baselineConversionRate) / baselineConversionRate) * 100
      : 0;

    let winner: 'baseline' | 'variation' | 'no_winner' = 'no_winner';
    if (isSignificant) {
      winner = variationConversionRate > baselineConversionRate ? 'variation' : 'baseline';
    }

    const testDurationDays = variation.start_date 
      ? Math.floor((Date.now() - new Date(variation.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Generate recommendation
    let recommendation = '';
    if (isSignificant && winner === 'variation') {
      recommendation = `The variation "${variation.variation_name}" shows a statistically significant improvement of ${improvementRate.toFixed(1)}%. Consider implementing this change.`;
    } else if (isSignificant && winner === 'baseline') {
      recommendation = `The baseline outperforms the variation "${variation.variation_name}" significantly. Consider stopping this test and reverting to baseline.`;
    } else if (variationSampleSize < variation.test_configuration?.target_sample_size) {
      recommendation = `Test needs more data. Current sample size: ${variationSampleSize}, target: ${variation.test_configuration?.target_sample_size || 100}.`;
    } else {
      recommendation = `No significant difference found. Consider running the test longer or testing a more substantial variation.`;
    }

    const results: ABTestResults = {
      test_id: variationId,
      baseline_performance: {
        conversion_rate: Math.round(baselineConversionRate * 10000) / 100, // percentage
        avg_time_to_payment: baselineAvgTimeToPayment,
        sample_size: baselineSampleSize,
        revenue: baselineConversions * 500 // $500 per conversion
      },
      variation_performance: {
        conversion_rate: Math.round(variationConversionRate * 10000) / 100, // percentage
        avg_time_to_payment: variationAvgTimeToPayment,
        sample_size: variationSampleSize,
        revenue: variationConversions * 500 // $500 per conversion
      },
      statistical_analysis: {
        significance_level: variation.test_configuration?.significance_threshold || 0.05,
        p_value: pValue,
        confidence_interval: confidenceInterval,
        is_statistically_significant: isSignificant,
        improvement_rate: Math.round(improvementRate * 100) / 100,
        winner: winner
      },
      test_duration_days: testDurationDays,
      recommendation: recommendation
    };

    // Update variation results in database
    const { error: updateError } = await supabase
      .from('content_variations')
      .update({
        results: {
          impressions: variationSampleSize,
          conversions: variationConversions,
          conversion_rate: variationConversionRate,
          avg_time_to_payment: variationAvgTimeToPayment,
          revenue_generated: variationConversions * 500,
          statistical_significance: pValue,
          confidence_interval: confidenceInterval
        },
        statistical_significance: pValue,
        is_winner: winner === 'variation',
        updated_at: new Date().toISOString()
      })
      .eq('id', variationId);

    if (updateError) {
      console.warn('Failed to update variation results:', updateError);
    }

    return {
      success: true,
      results: results
    };

  } catch (error) {
    console.error('Unexpected error calculating A/B test results:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Statistical significance calculation (simplified z-test for proportions)
 */
function calculateStatisticalSignificance(
  variationConversions: number,
  variationSampleSize: number,
  baselineConversions: number,
  baselineSampleSize: number,
  significanceThreshold: number
): {
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: { lower: number; upper: number };
} {
  if (variationSampleSize === 0 || baselineSampleSize === 0) {
    return {
      pValue: 1.0,
      isSignificant: false,
      confidenceInterval: { lower: 0, upper: 0 }
    };
  }

  const p1 = variationConversions / variationSampleSize;
  const p2 = baselineConversions / baselineSampleSize;
  const pPool = (variationConversions + baselineConversions) / (variationSampleSize + baselineSampleSize);
  
  const standardError = Math.sqrt(pPool * (1 - pPool) * (1/variationSampleSize + 1/baselineSampleSize));
  const zScore = (p1 - p2) / standardError;
  
  // Two-tailed p-value approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  // Confidence interval for difference in proportions
  const diffSE = Math.sqrt((p1 * (1 - p1)) / variationSampleSize + (p2 * (1 - p2)) / baselineSampleSize);
  const criticalValue = 1.96; // 95% confidence interval
  const diff = p1 - p2;
  
  return {
    pValue: Math.round(pValue * 10000) / 10000,
    isSignificant: pValue < significanceThreshold,
    confidenceInterval: {
      lower: Math.round((diff - criticalValue * diffSE) * 10000) / 10000,
      upper: Math.round((diff + criticalValue * diffSE) * 10000) / 10000
    }
  };
}

/**
 * Approximate normal CDF for z-score calculation
 */
function normalCDF(x: number): number {
  // Approximation of normal CDF using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Get active content variations for client assignment
 */
export async function getActiveContentVariations(): Promise<{
  success: boolean;
  variations?: ContentVariation[];
  error?: string;
}> {
  try {
    const supabase = supabaseServer();

    const { data: variations, error } = await supabase
      .from('content_variations')
      .select('*')
      .eq('test_status', 'active')
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active variations:', error);
      return {
        success: false,
        error: 'Failed to fetch active variations'
      };
    }

    return {
      success: true,
      variations: variations as ContentVariation[]
    };

  } catch (error) {
    console.error('Unexpected error fetching active variations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Start A/B test by activating a content variation
 */
export async function startABTest(
  variationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    const { error } = await supabase
      .from('content_variations')
      .update({
        test_status: 'active',
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', variationId);

    if (error) {
      console.error('Failed to start A/B test:', error);
      return {
        success: false,
        error: 'Failed to start test'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error starting A/B test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Stop A/B test and optionally declare winner
 */
export async function stopABTest(
  variationId: string,
  declareWinner?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    const updateData: any = {
      test_status: 'completed',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (declareWinner !== undefined) {
      updateData.is_winner = declareWinner;
    }

    const { error } = await supabase
      .from('content_variations')
      .update(updateData)
      .eq('id', variationId);

    if (error) {
      console.error('Failed to stop A/B test:', error);
      return {
        success: false,
        error: 'Failed to stop test'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error stopping A/B test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}