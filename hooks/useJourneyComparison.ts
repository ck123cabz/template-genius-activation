/**
 * Journey Comparison Hook
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Custom React hook for managing journey comparison state and operations
 */

import { useState, useCallback } from 'react';
import {
  JourneyComparison,
  JourneyComparisonResult,
  ComparisonType,
  JourneyPair
} from '@/lib/data-models/journey-comparison-models';
import { JourneySession } from '@/lib/data-models/journey-models';

export interface UseJourneyComparisonReturn {
  // State
  isAnalyzing: boolean;
  error: string | null;
  lastComparison: JourneyComparisonResult | null;

  // Actions
  compareJourneys: (
    successful: JourneySession,
    failed: JourneySession,
    type?: ComparisonType
  ) => Promise<JourneyComparisonResult>;
  
  findOptimalPairs: (criteria?: any) => Promise<JourneyPair[]>;
  clearError: () => void;
  reset: () => void;
}

export function useJourneyComparison(): UseJourneyComparisonReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastComparison, setLastComparison] = useState<JourneyComparisonResult | null>(null);

  const compareJourneys = useCallback(async (
    successful: JourneySession,
    failed: JourneySession,
    type: ComparisonType = 'comprehensive'
  ): Promise<JourneyComparisonResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock comparison result
      const mockResult: JourneyComparisonResult = {
        comparison: {
          id: `comp-${Date.now()}`,
          successfulJourneyId: successful.id,
          failedJourneyId: failed.id,
          comparisonType: type,
          successfulJourney: successful,
          failedJourney: failed,
          contentDifferences: [
            {
              id: 'diff-1',
              comparisonId: `comp-${Date.now()}`,
              pageType: 'activation',
              changeType: 'text_change',
              diffCategory: 'headline',
              successfulContent: {
                id: 'content-success-1',
                versionHash: 'hash-success-1',
                contentElements: {
                  headline: 'Transform Your Business Today'
                },
                rawContent: 'Transform Your Business Today',
                structuralElements: {} as any,
                visualElements: {} as any,
                performanceMetrics: {} as any,
                createdAt: new Date()
              },
              failedContent: {
                id: 'content-failed-1',
                versionHash: 'hash-failed-1',
                contentElements: {
                  headline: 'Business Transformation Services'
                },
                rawContent: 'Business Transformation Services',
                structuralElements: {} as any,
                visualElements: {} as any,
                performanceMetrics: {} as any,
                createdAt: new Date()
              },
              diffDetails: [
                {
                  changeId: 'change-1',
                  elementType: 'headline',
                  changeDescription: 'Headline changed from passive to action-oriented',
                  successfulValue: 'Transform Your Business Today',
                  failedValue: 'Business Transformation Services',
                  changeIntensity: 0.75,
                  semanticImpact: 0.8,
                  visualImpact: 0.6,
                  positionInPage: 0.1,
                  changeContext: 'Main page headline'
                }
              ],
              impactScore: 0.8,
              correlationStrength: 0.7,
              semanticSimilarity: 0.6,
              structuralSimilarity: 0.9,
              visualDiff: {
                pixelDifference: 0.3,
                layoutChanges: [],
                colorChanges: [],
                typographyChanges: [],
                imageChanges: [],
                prominenceChanges: []
              },
              createdAt: new Date()
            }
          ],
          timingDifferences: [
            {
              id: 'timing-diff-1',
              comparisonId: `comp-${Date.now()}`,
              pageType: 'activation',
              successfulTiming: {
                pageType: 'activation',
                avgTimeOnPage: 120,
                medianTimeOnPage: 110,
                percentiles: { p25: 90, p50: 110, p75: 140, p90: 160, p95: 180 },
                dropOffTimeThreshold: 30,
                engagementTimeThreshold: 60,
                entryTime: new Date(),
                sessionDuration: 1800,
                pageSequence: 1,
                engagementEvents: [],
                dropOffRisk: 0.2,
                avgEngagementScore: 0.8
              },
              failedTiming: {
                pageType: 'activation',
                avgTimeOnPage: 45,
                medianTimeOnPage: 40,
                percentiles: { p25: 30, p50: 40, p75: 55, p90: 70, p95: 85 },
                dropOffTimeThreshold: 30,
                engagementTimeThreshold: 60,
                entryTime: new Date(),
                sessionDuration: 600,
                pageSequence: 1,
                engagementEvents: [],
                dropOffRisk: 0.8,
                avgEngagementScore: 0.3
              },
              timeDifferential: 75,
              engagementDifferential: 0.5,
              interactionDifferential: 3,
              scrollDepthDifferential: 40,
              statisticalSignificance: {
                pValue: 0.02,
                tStatistic: 2.5,
                degreesOfFreedom: 8,
                effectSize: 0.9,
                confidenceInterval: [0.2, 0.8],
                testType: 'welch_t_test',
                assumptions: {} as any
              },
              confidenceInterval: [0.3, 0.7],
              effectSize: 0.9,
              createdAt: new Date()
            }
          ],
          engagementDifferences: [],
          hypothesisCorrelations: [],
          statisticalSignificance: {
            sampleSize: 2,
            confidenceInterval: { lower: 0.6, upper: 0.9 },
            pValue: 0.03,
            effectSize: 0.75,
            statisticalPower: 0.8,
            overallSignificance: 0.03,
            timingSignificance: {
              pValue: 0.02,
              tStatistic: 2.5,
              degreesOfFreedom: 8,
              effectSize: 0.9,
              confidenceInterval: [0.2, 0.8],
              testType: 'welch_t_test',
              assumptions: {} as any
            },
            engagementSignificance: {
              pValue: 0.05,
              zScore: 1.96,
              effectSize: 0.6,
              confidenceInterval: [0.1, 0.6],
              testType: 'z_test',
              categoryAnalysis: []
            },
            contentSignificance: {
              pValue: 0.01,
              similarityScore: 0.6,
              structuralSignificance: 0.9,
              semanticSignificance: 0.7,
              visualSignificance: 0.5,
              elementSignificance: [],
              overallContentEffect: 0.8
            },
            hypothesisSignificance: {
              pValue: 0.1,
              correlationCoefficient: 0.5,
              causalityEvidence: 0.6,
              hypothesisConsistency: 0.7,
              outcomeCorrelation: 0.5,
              validationStrength: 0.6
            },
            multipleTestingCorrection: {
              method: 'benjamini_hochberg',
              originalAlpha: 0.05,
              adjustedAlpha: 0.025,
              originalPValues: [0.02, 0.05, 0.01, 0.1],
              adjustedPValues: [0.03, 0.06, 0.02, 0.1],
              significantTests: 2
            },
            effectSizes: {
              overallEffectSize: 0.75,
              timingEffectSize: 0.9,
              contentEffectSize: 0.8,
              engagementEffectSize: 0.6,
              effectSizeMagnitude: 'large',
              practicalSignificance: true
            },
            confidenceLevel: 'high',
            sampleSizeAnalysis: {
              effectiveSampleSize: 2,
              requiredSampleSize: 20,
              powerAchieved: 0.8,
              adequacy: 'insufficient'
            },
            powerAnalysis: {
              power: 0.8,
              requiredSampleSize: 20,
              minimumDetectableEffect: 0.3,
              actualEffect: 0.75
            }
          },
          confidenceScore: 0.8,
          comparisonMetadata: {
            analysisVersion: '5.1.0',
            processingTime: 2000,
            dataQuality: {
              completeness: 0.9,
              reliability: 0.8,
              consistency: 0.85
            },
            algorithmConfig: {} as any,
            validationResults: {
              passed: true,
              score: 0.8,
              issues: []
            },
            performanceMetrics: {
              contentAnalysisTime: 500,
              timingAnalysisTime: 300,
              engagementAnalysisTime: 400,
              statisticalAnalysisTime: 800,
              memoryUsage: 50,
              cacheHitRate: 0.7
            }
          },
          createdAt: new Date(),
          lastUpdated: new Date()
        },
        insights: {
          primaryDifferentiators: [
            {
              type: 'content',
              description: 'Action-oriented headline vs passive description',
              impactScore: 0.8,
              confidenceScore: 0.7,
              statisticalSignificance: 0.01,
              supportingEvidence: [
                {
                  type: 'content_analysis',
                  description: 'Semantic analysis shows stronger emotional resonance',
                  strength: 0.8,
                  source: 'ContentDiffEngine',
                  data: {}
                }
              ]
            }
          ],
          keySuccessFactors: [
            {
              factor: 'Engagement Time',
              impact: 0.9,
              description: 'Higher engagement time strongly correlates with success'
            }
          ],
          failureIndicators: [
            {
              indicator: 'Quick Exit',
              frequency: 0.8,
              description: 'Users who spend less than 1 minute typically fail'
            }
          ],
          patternMatches: [],
          anomalies: []
        },
        recommendations: [
          {
            id: 'rec-1',
            priority: 'high',
            category: 'content_optimization',
            title: 'Optimize Headline for Action-Orientation',
            description: 'Change passive headlines to action-oriented language to increase engagement',
            actionItems: [
              {
                description: 'Review all page headlines for action verbs',
                priority: 8,
                estimatedEffort: 2,
                dependencies: [],
                acceptanceCriteria: ['All headlines use action verbs', 'A/B test shows improvement']
              }
            ],
            expectedImpact: 0.25,
            implementationEffort: 'low',
            confidenceScore: 0.8,
            basedOnEvidence: [
              {
                type: 'statistical',
                description: 'Action headlines show 25% higher conversion',
                strength: 0.8,
                source: 'journey_comparison',
                data: {}
              }
            ],
            validationSuggestions: [
              {
                method: 'ab_test',
                description: 'A/B test action vs passive headlines',
                expectedDuration: 14,
                requiredSampleSize: 100,
                successMetrics: ['conversion_rate', 'engagement_time']
              }
            ],
            createdAt: new Date()
          }
        ],
        confidence: {
          overall: 0.8,
          components: {
            content: 0.85,
            timing: 0.9,
            engagement: 0.7,
            hypothesis: 0.6
          },
          factors: [
            'Strong statistical significance in timing differences',
            'Clear content pattern identification',
            'Sufficient sample diversity'
          ]
        },
        processingMetrics: {
          totalTime: 2000,
          analysisType: type,
          componentsAnalyzed: ['content', 'timing', 'engagement', 'hypothesis'],
          statisticalTests: 4
        }
      };

      setLastComparison(mockResult);
      return mockResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Comparison analysis failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const findOptimalPairs = useCallback(async (criteria: any = {}): Promise<JourneyPair[]> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock optimal pairs
      return [
        {
          successfulJourney: {
            id: 'success-1',
            clientId: 'client-1',
            sessionStart: new Date('2024-01-15'),
            totalDuration: 1800,
            pageVisits: [],
            finalOutcome: 'completed',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          },
          failedJourney: {
            id: 'failed-1',
            clientId: 'client-3',
            sessionStart: new Date('2024-01-17'),
            totalDuration: 600,
            pageVisits: [],
            finalOutcome: 'dropped_off',
            exitPoint: 'agreement',
            createdAt: new Date('2024-01-17'),
            updatedAt: new Date('2024-01-17')
          },
          matchingScore: 0.85,
          matchingFactors: [
            {
              factor: 'temporal_proximity',
              score: 0.9,
              weight: 0.3,
              description: 'Journeys occurred within 2 days'
            },
            {
              factor: 'content_similarity',
              score: 0.8,
              weight: 0.25,
              description: 'Similar content versions used'
            }
          ],
          comparisonViability: 0.85,
          recommendedAnalysisType: 'comprehensive'
        }
      ];
    } catch (err) {
      setError('Failed to find optimal journey pairs');
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setError(null);
    setLastComparison(null);
  }, []);

  return {
    isAnalyzing,
    error,
    lastComparison,
    compareJourneys,
    findOptimalPairs,
    clearError,
    reset
  };
}