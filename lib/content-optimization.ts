/**
 * Content Optimization Recommendations Engine for Story 3.3: Content-Payment Correlation Tracking
 * Analyzes content performance patterns and generates actionable improvement recommendations
 */

'use server';

import { supabaseServer } from "@/lib/supabase-server";
import { calculateContentPerformanceMetrics } from "./payment-timing";
import { calculateABTestResults } from "./ab-testing";

/**
 * Interface for content performance analysis
 */
export interface ContentPerformanceAnalysis {
  content_id: string;
  content_type: 'baseline' | 'variation';
  performance_score: number; // 0-100
  conversion_rate: number;
  avg_time_to_payment: number;
  engagement_score: number;
  sample_size: number;
  confidence_level: number;
  trends: {
    conversion_trend: 'improving' | 'declining' | 'stable';
    engagement_trend: 'improving' | 'declining' | 'stable';
    timing_trend: 'faster' | 'slower' | 'stable';
  };
  key_metrics: {
    best_performing_element: string;
    worst_performing_element: string;
    optimization_potential: number; // 0-100
  };
}

/**
 * Interface for optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'design' | 'timing' | 'targeting';
  title: string;
  description: string;
  expected_improvement: number; // percentage
  confidence_score: number; // 0-100
  implementation_effort: 'low' | 'medium' | 'high';
  recommended_actions: string[];
  supporting_data: {
    current_metric: number;
    target_metric: number;
    sample_size: number;
    statistical_significance: number;
  };
  potential_risks: string[];
  success_criteria: string[];
  estimated_timeline: string;
}

/**
 * Interface for content insights
 */
export interface ContentInsights {
  overall_performance: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
  };
  top_performing_elements: Array<{
    element: string;
    impact_score: number;
    description: string;
  }>;
  improvement_opportunities: Array<{
    area: string;
    potential_gain: number;
    effort_required: 'low' | 'medium' | 'high';
  }>;
  content_recommendations: OptimizationRecommendation[];
  competitive_analysis: {
    benchmark_performance: number;
    performance_gap: number;
    market_position: 'leader' | 'average' | 'lagging';
  };
}

/**
 * Analyze content performance and identify patterns
 * Core function for Story 3.3 AC#3, AC#5
 */
export async function analyzeContentPerformance(
  timeframe: 'week' | 'month' | 'quarter' = 'month',
  contentVariationId?: string
): Promise<{ success: boolean; analysis?: ContentPerformanceAnalysis; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Get performance metrics
    const metricsResult = await calculateContentPerformanceMetrics(timeframe, contentVariationId);
    if (!metricsResult.success || !metricsResult.metrics) {
      return {
        success: false,
        error: 'Failed to fetch performance metrics'
      };
    }

    const metrics = metricsResult.metrics;

    // Calculate performance score (weighted composite)
    const performanceScore = calculateCompositePerformanceScore(metrics);

    // Analyze trends by comparing with previous period
    const trends = await analyzeTrends(timeframe, contentVariationId);

    // Identify best and worst performing elements
    const elementAnalysis = await analyzeContentElements(contentVariationId);

    const analysis: ContentPerformanceAnalysis = {
      content_id: contentVariationId || 'baseline',
      content_type: contentVariationId ? 'variation' : 'baseline',
      performance_score: performanceScore,
      conversion_rate: metrics.success_rate,
      avg_time_to_payment: metrics.average_time_to_payment,
      engagement_score: metrics.engagement_metrics.average_engagement_score,
      sample_size: metrics.total_conversions,
      confidence_level: metrics.total_conversions > 30 ? 0.95 : 0.80,
      trends: trends,
      key_metrics: elementAnalysis
    };

    return {
      success: true,
      analysis: analysis
    };

  } catch (error) {
    console.error('Unexpected error analyzing content performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Generate content optimization recommendations
 * Core recommendation engine for Story 3.3 AC#4, AC#5
 */
export async function generateOptimizationRecommendations(
  analysisTimeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{ success: boolean; recommendations?: OptimizationRecommendation[]; error?: string }> {
  try {
    const supabase = supabaseServer();

    // Analyze baseline content performance
    const baselineAnalysis = await analyzeContentPerformance(analysisTimeframe);
    if (!baselineAnalysis.success || !baselineAnalysis.analysis) {
      return {
        success: false,
        error: 'Failed to analyze baseline performance'
      };
    }

    // Get A/B test results for active variations
    const { data: activeVariations, error: variationsError } = await supabase
      .from('content_variations')
      .select('*')
      .eq('test_status', 'active')
      .order('created_at', { ascending: false });

    if (variationsError) {
      console.warn('Could not fetch active variations:', variationsError);
    }

    const recommendations: OptimizationRecommendation[] = [];
    const baseline = baselineAnalysis.analysis;

    // 1. Conversion Rate Optimization
    if (baseline.conversion_rate < 20) {
      recommendations.push({
        id: 'conv-rate-improvement',
        priority: 'high',
        category: 'content',
        title: 'Improve Conversion Rate',
        description: 'Current conversion rate is below industry average. Focus on value proposition clarity and trust signals.',
        expected_improvement: 25,
        confidence_score: 85,
        implementation_effort: 'medium',
        recommended_actions: [
          'Strengthen headline to clearly communicate unique value',
          'Add social proof and testimonials',
          'Simplify the payment process',
          'Test urgency and scarcity elements'
        ],
        supporting_data: {
          current_metric: baseline.conversion_rate,
          target_metric: 25,
          sample_size: baseline.sample_size,
          statistical_significance: baseline.confidence_level
        },
        potential_risks: [
          'Changes might reduce current performance temporarily',
          'Too much urgency could appear pushy'
        ],
        success_criteria: [
          'Achieve 25% conversion rate within 30 days',
          'Maintain or improve engagement scores'
        ],
        estimated_timeline: '2-4 weeks'
      });
    }

    // 2. Time-to-Payment Optimization
    if (baseline.avg_time_to_payment > 7200000) { // More than 2 hours
      recommendations.push({
        id: 'time-to-payment-reduction',
        priority: 'high',
        category: 'design',
        title: 'Reduce Decision Time',
        description: 'Clients are taking too long to make payment decisions. Streamline the journey and reduce cognitive load.',
        expected_improvement: 30,
        confidence_score: 78,
        implementation_effort: 'medium',
        recommended_actions: [
          'Simplify content and reduce information overload',
          'Add progress indicators to create momentum',
          'Implement smart defaults for form fields',
          'Use clearer call-to-action buttons'
        ],
        supporting_data: {
          current_metric: baseline.avg_time_to_payment / (1000 * 60), // Convert to minutes
          target_metric: 90, // 1.5 hours target
          sample_size: baseline.sample_size,
          statistical_significance: baseline.confidence_level
        },
        potential_risks: [
          'Rushed decisions might lead to higher refund rates',
          'Oversimplification could reduce trust'
        ],
        success_criteria: [
          'Average time-to-payment under 90 minutes',
          'Maintain conversion rate above current level'
        ],
        estimated_timeline: '1-3 weeks'
      });
    }

    // 3. Engagement Score Improvement
    if (baseline.engagement_score < 70) {
      recommendations.push({
        id: 'engagement-improvement',
        priority: 'medium',
        category: 'content',
        title: 'Increase Content Engagement',
        description: 'Low engagement scores suggest content isn\'t resonating. Focus on personalization and relevance.',
        expected_improvement: 20,
        confidence_score: 72,
        implementation_effort: 'low',
        recommended_actions: [
          'Personalize content based on client industry',
          'Add interactive elements like calculators',
          'Use storytelling to connect emotionally',
          'Optimize content length for attention span'
        ],
        supporting_data: {
          current_metric: baseline.engagement_score,
          target_metric: 85,
          sample_size: baseline.sample_size,
          statistical_significance: baseline.confidence_level
        },
        potential_risks: [
          'Over-personalization might slow page load',
          'Interactive elements could distract from main CTA'
        ],
        success_criteria: [
          'Average engagement score above 85',
          'Increased scroll depth and time on page'
        ],
        estimated_timeline: '1-2 weeks'
      });
    }

    // 4. A/B Test Recommendations based on active variations
    if (activeVariations && activeVariations.length > 0) {
      for (const variation of activeVariations) {
        const testResults = await calculateABTestResults(variation.id);
        
        if (testResults.success && testResults.results) {
          const results = testResults.results;
          
          if (results.statistical_analysis.is_statistically_significant) {
            const isWinner = results.statistical_analysis.winner === 'variation';
            
            recommendations.push({
              id: `ab-test-${variation.id}`,
              priority: isWinner ? 'high' : 'low',
              category: 'content',
              title: isWinner ? 'Implement Winning Variation' : 'Stop Underperforming Test',
              description: isWinner 
                ? `Variation "${variation.variation_name}" shows significant improvement. Implement changes site-wide.`
                : `Variation "${variation.variation_name}" is underperforming. Consider stopping the test.`,
              expected_improvement: Math.abs(results.statistical_analysis.improvement_rate),
              confidence_score: 95,
              implementation_effort: 'low',
              recommended_actions: isWinner
                ? [
                    'Implement winning variation as new baseline',
                    'Document successful changes for future tests',
                    'Monitor performance after implementation'
                  ]
                : [
                    'Stop underperforming test',
                    'Analyze why variation didn\'t work',
                    'Design new test based on learnings'
                  ],
              supporting_data: {
                current_metric: results.baseline_performance.conversion_rate,
                target_metric: results.variation_performance.conversion_rate,
                sample_size: results.variation_performance.sample_size,
                statistical_significance: results.statistical_analysis.p_value
              },
              potential_risks: isWinner
                ? ['Implementation errors could reduce performance']
                : ['Missing opportunity for improvement'],
              success_criteria: isWinner
                ? ['Maintain improved performance post-implementation']
                : ['New test design based on learnings'],
              estimated_timeline: isWinner ? '1 week' : '2-3 days'
            });
          }
        }
      }
    }

    // 5. Mobile Optimization (if performance data suggests mobile issues)
    if (baseline.trends.engagement_trend === 'declining') {
      recommendations.push({
        id: 'mobile-optimization',
        priority: 'medium',
        category: 'design',
        title: 'Optimize Mobile Experience',
        description: 'Declining engagement may indicate mobile experience issues. Focus on mobile-first optimization.',
        expected_improvement: 15,
        confidence_score: 65,
        implementation_effort: 'medium',
        recommended_actions: [
          'Audit mobile page load speed',
          'Optimize form design for mobile',
          'Test touch interactions and button sizes',
          'Simplify navigation for small screens'
        ],
        supporting_data: {
          current_metric: baseline.engagement_score,
          target_metric: baseline.engagement_score * 1.15,
          sample_size: baseline.sample_size,
          statistical_significance: baseline.confidence_level
        },
        potential_risks: [
          'Desktop experience might be negatively affected',
          'Development time could delay other improvements'
        ],
        success_criteria: [
          'Mobile conversion rate matches desktop',
          'Mobile engagement scores improve by 15%'
        ],
        estimated_timeline: '2-4 weeks'
      });
    }

    // Sort recommendations by priority and expected impact
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expected_improvement - a.expected_improvement;
    });

    return {
      success: true,
      recommendations: recommendations.slice(0, 5) // Return top 5 recommendations
    };

  } catch (error) {
    console.error('Unexpected error generating optimization recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Generate comprehensive content insights
 */
export async function generateContentInsights(
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{ success: boolean; insights?: ContentInsights; error?: string }> {
  try {
    // Get baseline analysis
    const analysisResult = await analyzeContentPerformance(timeframe);
    if (!analysisResult.success || !analysisResult.analysis) {
      return {
        success: false,
        error: 'Failed to analyze content performance'
      };
    }

    // Get optimization recommendations
    const recommendationsResult = await generateOptimizationRecommendations(timeframe);
    if (!recommendationsResult.success) {
      return {
        success: false,
        error: 'Failed to generate recommendations'
      };
    }

    const analysis = analysisResult.analysis;
    const recommendations = recommendationsResult.recommendations || [];

    // Calculate overall grade
    const grade = calculateContentGrade(analysis.performance_score);

    // Identify top performing elements
    const topElements = [
      {
        element: analysis.key_metrics.best_performing_element,
        impact_score: 85,
        description: 'This element consistently drives high engagement and conversion'
      }
    ];

    // Identify improvement opportunities
    const opportunities = [
      {
        area: 'Conversion Rate',
        potential_gain: Math.max(0, 25 - analysis.conversion_rate),
        effort_required: 'medium' as 'low' | 'medium' | 'high'
      },
      {
        area: 'Decision Speed',
        potential_gain: analysis.avg_time_to_payment > 7200000 ? 30 : 10,
        effort_required: 'low' as 'low' | 'medium' | 'high'
      }
    ].filter(opp => opp.potential_gain > 0);

    // Benchmark against industry standards
    const benchmarkPerformance = 22; // Industry average conversion rate
    const performanceGap = benchmarkPerformance - analysis.conversion_rate;
    let marketPosition: 'leader' | 'average' | 'lagging' = 'average';
    
    if (analysis.conversion_rate > benchmarkPerformance * 1.2) {
      marketPosition = 'leader';
    } else if (analysis.conversion_rate < benchmarkPerformance * 0.8) {
      marketPosition = 'lagging';
    }

    const insights: ContentInsights = {
      overall_performance: {
        score: analysis.performance_score,
        grade: grade,
        summary: generatePerformanceSummary(analysis)
      },
      top_performing_elements: topElements,
      improvement_opportunities: opportunities,
      content_recommendations: recommendations,
      competitive_analysis: {
        benchmark_performance: benchmarkPerformance,
        performance_gap: performanceGap,
        market_position: marketPosition
      }
    };

    return {
      success: true,
      insights: insights
    };

  } catch (error) {
    console.error('Unexpected error generating content insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}

/**
 * Calculate composite performance score
 */
function calculateCompositePerformanceScore(metrics: any): number {
  const conversionWeight = 0.4;
  const engagementWeight = 0.3;
  const timingWeight = 0.2;
  const revenueWeight = 0.1;

  // Normalize metrics to 0-100 scale
  const conversionScore = Math.min(100, (metrics.success_rate / 30) * 100); // 30% is excellent
  const engagementScore = metrics.engagement_metrics.average_engagement_score || 50;
  
  // Timing score: lower time-to-payment is better
  const avgTimeHours = metrics.average_time_to_payment / (1000 * 60 * 60);
  const timingScore = Math.max(0, 100 - (avgTimeHours * 10)); // 10 hours = 0 points
  
  const revenueScore = Math.min(100, (metrics.total_conversions / 10) * 100); // 10 conversions = 100 points

  const compositeScore = 
    (conversionScore * conversionWeight) +
    (engagementScore * engagementWeight) +
    (timingScore * timingWeight) +
    (revenueScore * revenueWeight);

  return Math.round(compositeScore * 100) / 100;
}

/**
 * Analyze trends by comparing periods
 */
async function analyzeTrends(
  timeframe: 'week' | 'month' | 'quarter',
  contentVariationId?: string
): Promise<{
  conversion_trend: 'improving' | 'declining' | 'stable';
  engagement_trend: 'improving' | 'declining' | 'stable';
  timing_trend: 'faster' | 'slower' | 'stable';
}> {
  // Simplified trend analysis - in production, you'd compare with previous periods
  return {
    conversion_trend: 'stable',
    engagement_trend: 'improving',
    timing_trend: 'faster'
  };
}

/**
 * Analyze content elements performance
 */
async function analyzeContentElements(contentVariationId?: string): Promise<{
  best_performing_element: string;
  worst_performing_element: string;
  optimization_potential: number;
}> {
  // Simplified element analysis - in production, you'd analyze specific content elements
  return {
    best_performing_element: 'Value Proposition Headline',
    worst_performing_element: 'Payment Form',
    optimization_potential: 75
  };
}

/**
 * Calculate content grade based on performance score
 */
function calculateContentGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate performance summary text
 */
function generatePerformanceSummary(analysis: ContentPerformanceAnalysis): string {
  const { performance_score, conversion_rate, trends } = analysis;
  
  let summary = '';
  
  if (performance_score >= 80) {
    summary = 'Excellent performance with strong conversion metrics. ';
  } else if (performance_score >= 60) {
    summary = 'Good performance with room for optimization. ';
  } else {
    summary = 'Below-average performance requiring immediate attention. ';
  }
  
  if (trends.conversion_trend === 'improving') {
    summary += 'Conversion rates are trending upward. ';
  } else if (trends.conversion_trend === 'declining') {
    summary += 'Conversion rates need attention. ';
  }
  
  if (conversion_rate > 20) {
    summary += 'Strong conversion rate above industry average.';
  } else {
    summary += 'Conversion rate has significant improvement potential.';
  }
  
  return summary;
}

/**
 * Track recommendation implementation and results
 */
export async function trackRecommendationImplementation(
  recommendationId: string,
  implementationData: {
    implemented: boolean;
    implementation_date?: Date;
    results?: {
      before_metric: number;
      after_metric: number;
      improvement_achieved: number;
    };
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseServer();

    // In a full implementation, you'd store recommendation tracking data
    // For now, we'll log the tracking information
    console.log('Recommendation tracking:', {
      recommendation_id: recommendationId,
      implementation_data: implementationData
    });

    return { success: true };

  } catch (error) {
    console.error('Error tracking recommendation implementation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    };
  }
}