/**
 * Journey Recommendation Engine
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * AI-powered recommendation system that analyzes journey patterns and provides
 * actionable insights for improving conversion rates.
 */

import { randomUUID } from 'crypto';
import {
  JourneySession,
  JourneyRecommendation,
  JourneyPageType,
  DropOffPattern,
  PageConversionRate,
  RecommendationType,
  RecommendationPriority
} from '../data-models/journey-models';

export interface RecommendationContext {
  dropOffPatterns: DropOffPattern[];
  conversionRates: PageConversionRate[];
  sessionData: JourneySession[];
  timeframe: number; // days
  minConfidence: number;
}

export interface OptimizationRule {
  id: string;
  name: string;
  condition: (context: RecommendationContext) => boolean;
  generateRecommendation: (context: RecommendationContext) => JourneyRecommendation;
  priority: RecommendationPriority;
  type: RecommendationType;
  expectedImprovement: number;
}

export class JourneyRecommendationEngine {
  private optimizationRules: OptimizationRule[] = [];

  constructor() {
    this.initializeOptimizationRules();
  }

  /**
   * Generate comprehensive recommendations based on journey data
   */
  async generateRecommendations(context: RecommendationContext): Promise<JourneyRecommendation[]> {
    const recommendations: JourneyRecommendation[] = [];
    const applicableRules = this.optimizationRules.filter(rule => rule.condition(context));

    for (const rule of applicableRules) {
      try {
        const recommendation = rule.generateRecommendation(context);
        if (recommendation && this.isRecommendationValid(recommendation, context)) {
          recommendations.push(recommendation);
        }
      } catch (error) {
        console.error(`Error generating recommendation for rule ${rule.id}:`, error);
      }
    }

    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.expectedImprovement - a.expectedImprovement;
    });
  }

  /**
   * Initialize built-in optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // High drop-off rate rule
      {
        id: 'high-dropoff-rate',
        name: 'High Drop-off Rate Detection',
        condition: (context) => {
          return context.dropOffPatterns.some(pattern => pattern.frequency > 50);
        },
        generateRecommendation: (context) => {
          const highestDropOff = context.dropOffPatterns
            .sort((a, b) => b.frequency - a.frequency)[0];
          
          return {
            id: randomUUID(),
            priority: 'high',
            type: this.getTypeFromTrigger(highestDropOff.exitTrigger),
            title: `Critical: Fix ${highestDropOff.pageType} page drop-offs`,
            description: `${highestDropOff.frequency} users are dropping off from ${highestDropOff.pageType} page. This is causing significant revenue loss.`,
            expectedImprovement: Math.min(40, Math.round(highestDropOff.frequency / 10)),
            implementationEffort: 'high',
            targetPage: highestDropOff.pageType,
            basedOnPattern: highestDropOff.id,
            createdAt: new Date()
          };
        },
        priority: 'high',
        type: 'content',
        expectedImprovement: 30
      },

      // Low conversion rate rule
      {
        id: 'low-conversion-rate',
        name: 'Low Conversion Rate Detection',
        condition: (context) => {
          return context.conversionRates.some(rate => rate.conversionRate < 0.5);
        },
        generateRecommendation: (context) => {
          const lowestConversion = context.conversionRates
            .sort((a, b) => a.conversionRate - b.conversionRate)[0];
          
          return {
            id: randomUUID(),
            priority: 'high',
            type: 'content',
            title: `Optimize ${lowestConversion.pageType} conversion rate`,
            description: `${lowestConversion.pageType} page has only ${Math.round(lowestConversion.conversionRate * 100)}% conversion rate. Significant improvement opportunity.`,
            expectedImprovement: Math.round((0.7 - lowestConversion.conversionRate) * 100),
            implementationEffort: 'medium',
            targetPage: lowestConversion.pageType,
            basedOnPattern: 'conversion-analysis',
            createdAt: new Date()
          };
        },
        priority: 'high',
        type: 'content',
        expectedImprovement: 25
      },

      // Quick exit pattern rule
      {
        id: 'quick-exit-pattern',
        name: 'Quick Exit Detection',
        condition: (context) => {
          return context.dropOffPatterns.some(pattern => 
            pattern.avgTimeBeforeExit < 30 && pattern.frequency > 20
          );
        },
        generateRecommendation: (context) => {
          const quickExitPattern = context.dropOffPatterns
            .filter(pattern => pattern.avgTimeBeforeExit < 30 && pattern.frequency > 20)
            .sort((a, b) => b.frequency - a.frequency)[0];
          
          return {
            id: randomUUID(),
            priority: 'medium',
            type: 'content',
            title: `Address quick exits on ${quickExitPattern.pageType} page`,
            description: `Users are leaving ${quickExitPattern.pageType} page within ${quickExitPattern.avgTimeBeforeExit} seconds. Content may not be engaging enough.`,
            expectedImprovement: 15,
            implementationEffort: 'medium',
            targetPage: quickExitPattern.pageType,
            basedOnPattern: quickExitPattern.id,
            createdAt: new Date()
          };
        },
        priority: 'medium',
        type: 'content',
        expectedImprovement: 15
      },

      // Technical issues rule
      {
        id: 'technical-issues',
        name: 'Technical Issues Detection',
        condition: (context) => {
          return context.dropOffPatterns.some(pattern => 
            pattern.exitTrigger === 'technical' && pattern.frequency > 10
          );
        },
        generateRecommendation: (context) => {
          const technicalIssues = context.dropOffPatterns
            .filter(pattern => pattern.exitTrigger === 'technical')
            .sort((a, b) => b.frequency - a.frequency)[0];
          
          return {
            id: randomUUID(),
            priority: 'high',
            type: 'technical',
            title: `Fix technical issues on ${technicalIssues.pageType} page`,
            description: `${technicalIssues.frequency} users are experiencing technical problems on ${technicalIssues.pageType} page, causing them to drop off.`,
            expectedImprovement: 20,
            implementationEffort: 'high',
            targetPage: technicalIssues.pageType,
            basedOnPattern: technicalIssues.id,
            createdAt: new Date()
          };
        },
        priority: 'high',
        type: 'technical',
        expectedImprovement: 20
      },

      // Time-based optimization rule
      {
        id: 'time-optimization',
        name: 'Time-based Optimization',
        condition: (context) => {
          return context.dropOffPatterns.some(pattern => 
            pattern.exitTrigger === 'time_based' && pattern.avgTimeBeforeExit > 300
          );
        },
        generateRecommendation: (context) => {
          const timePattern = context.dropOffPatterns
            .filter(pattern => pattern.exitTrigger === 'time_based' && pattern.avgTimeBeforeExit > 300)
            .sort((a, b) => b.frequency - a.frequency)[0];
          
          return {
            id: randomUUID(),
            priority: 'medium',
            type: 'timing',
            title: `Optimize loading and engagement on ${timePattern.pageType} page`,
            description: `Users are spending ${Math.round(timePattern.avgTimeBeforeExit / 60)} minutes on ${timePattern.pageType} page before dropping off. This suggests loading or engagement issues.`,
            expectedImprovement: 12,
            implementationEffort: 'medium',
            targetPage: timePattern.pageType,
            basedOnPattern: timePattern.id,
            createdAt: new Date()
          };
        },
        priority: 'medium',
        type: 'timing',
        expectedImprovement: 12
      },

      // Content-based optimization rule
      {
        id: 'content-optimization',
        name: 'Content-based Optimization',
        condition: (context) => {
          return context.dropOffPatterns.some(pattern => 
            pattern.exitTrigger === 'content_based' && pattern.frequency > 15
          );
        },
        generateRecommendation: (context) => {
          const contentPattern = context.dropOffPatterns
            .filter(pattern => pattern.exitTrigger === 'content_based')
            .sort((a, b) => b.frequency - a.frequency)[0];
          
          return {
            id: randomUUID(),
            priority: 'medium',
            type: 'content',
            title: `Improve content clarity on ${contentPattern.pageType} page`,
            description: `Content on ${contentPattern.pageType} page is causing ${contentPattern.frequency} users to drop off. Review messaging and value proposition.`,
            expectedImprovement: 18,
            implementationEffort: 'medium',
            targetPage: contentPattern.pageType,
            basedOnPattern: contentPattern.id,
            createdAt: new Date()
          };
        },
        priority: 'medium',
        type: 'content',
        expectedImprovement: 18
      },

      // User experience optimization
      {
        id: 'ux-optimization',
        name: 'User Experience Optimization',
        condition: (context) => {
          const avgConversionRate = context.conversionRates.reduce((sum, rate) => 
            sum + rate.conversionRate, 0) / context.conversionRates.length;
          return avgConversionRate < 0.6;
        },
        generateRecommendation: (context) => {
          const avgConversionRate = context.conversionRates.reduce((sum, rate) => 
            sum + rate.conversionRate, 0) / context.conversionRates.length;
          
          return {
            id: randomUUID(),
            priority: 'medium',
            type: 'ux',
            title: 'Comprehensive UX audit and optimization',
            description: `Overall conversion rate is ${Math.round(avgConversionRate * 100)}%. A comprehensive UX review could significantly improve performance.`,
            expectedImprovement: Math.round((0.7 - avgConversionRate) * 100),
            implementationEffort: 'high',
            targetPage: 'activation',
            basedOnPattern: 'overall-analysis',
            createdAt: new Date()
          };
        },
        priority: 'medium',
        type: 'ux',
        expectedImprovement: 15
      }
    ];
  }

  /**
   * Validate if a recommendation meets quality standards
   */
  private isRecommendationValid(recommendation: JourneyRecommendation, context: RecommendationContext): boolean {
    // Basic validation
    if (!recommendation.title || !recommendation.description) {
      return false;
    }

    // Expected improvement should be reasonable
    if (recommendation.expectedImprovement < 1 || recommendation.expectedImprovement > 50) {
      return false;
    }

    // Should target a valid page type
    const validPageTypes = ['activation', 'agreement', 'confirmation', 'processing'];
    if (!validPageTypes.includes(recommendation.targetPage)) {
      return false;
    }

    return true;
  }

  /**
   * Map exit trigger to recommendation type
   */
  private getTypeFromTrigger(trigger: string): RecommendationType {
    switch (trigger) {
      case 'technical':
        return 'technical';
      case 'time_based':
        return 'timing';
      case 'content_based':
        return 'content';
      default:
        return 'ux';
    }
  }

  /**
   * Add custom optimization rule
   */
  addOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.push(rule);
  }

  /**
   * Remove optimization rule by ID
   */
  removeOptimizationRule(ruleId: string): void {
    this.optimizationRules = this.optimizationRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all available optimization rules
   */
  getOptimizationRules(): OptimizationRule[] {
    return [...this.optimizationRules];
  }

  /**
   * Generate specific recommendation for a page
   */
  async generatePageSpecificRecommendation(
    pageType: JourneyPageType,
    context: RecommendationContext
  ): Promise<JourneyRecommendation | null> {
    const pagePatterns = context.dropOffPatterns.filter(p => p.pageType === pageType);
    const pageConversion = context.conversionRates.find(r => r.pageType === pageType);

    if (pagePatterns.length === 0 && !pageConversion) {
      return null;
    }

    // Find most significant issue for this page
    if (pagePatterns.length > 0) {
      const primaryPattern = pagePatterns.sort((a, b) => b.frequency - a.frequency)[0];
      const relevantRule = this.optimizationRules.find(rule => 
        rule.condition({ ...context, dropOffPatterns: [primaryPattern] })
      );

      if (relevantRule) {
        return relevantRule.generateRecommendation({
          ...context,
          dropOffPatterns: [primaryPattern]
        });
      }
    }

    // Generate generic recommendation based on conversion rate
    if (pageConversion && pageConversion.conversionRate < 0.6) {
      return {
        id: randomUUID(),
        priority: pageConversion.conversionRate < 0.3 ? 'high' : 'medium',
        type: 'content',
        title: `Improve ${pageType} page performance`,
        description: `${pageType} page has ${Math.round(pageConversion.conversionRate * 100)}% conversion rate. Focus on content clarity and user experience.`,
        expectedImprovement: Math.round((0.7 - pageConversion.conversionRate) * 100),
        implementationEffort: 'medium',
        targetPage: pageType,
        basedOnPattern: 'page-analysis',
        createdAt: new Date()
      };
    }

    return null;
  }

  /**
   * Calculate recommendation impact score
   */
  calculateImpactScore(recommendation: JourneyRecommendation, context: RecommendationContext): number {
    const priorityWeight = { high: 1.0, medium: 0.7, low: 0.4 };
    const effortWeight = { low: 1.0, medium: 0.8, high: 0.6 };
    
    const priority = priorityWeight[recommendation.priority];
    const effort = effortWeight[recommendation.implementationEffort];
    const improvement = recommendation.expectedImprovement / 100;
    
    return Math.round(priority * effort * improvement * 100);
  }
}

// Export singleton instance and utility functions
export const journeyRecommendationEngine = new JourneyRecommendationEngine();

export async function generateJourneyRecommendations(
  context: RecommendationContext
): Promise<JourneyRecommendation[]> {
  return journeyRecommendationEngine.generateRecommendations(context);
}

export async function generatePageRecommendations(
  pageType: JourneyPageType,
  context: RecommendationContext
): Promise<JourneyRecommendation | null> {
  return journeyRecommendationEngine.generatePageSpecificRecommendation(pageType, context);
}

export function calculateRecommendationImpact(
  recommendation: JourneyRecommendation,
  context: RecommendationContext
): number {
  return journeyRecommendationEngine.calculateImpactScore(recommendation, context);
}