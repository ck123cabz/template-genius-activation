/**
 * Content Diff Analysis Engine
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced content comparison algorithms with semantic analysis, change categorization,
 * and impact scoring. Extends Epic 4 ContentElementParser with comparison capabilities.
 */

import { createHash } from 'crypto';
import {
  ContentDiff,
  ContentVersion,
  DiffDetail,
  DiffCategory,
  ChangeType,
  VisualDiffData,
  LayoutChange,
  ColorChange,
  TypographyChange,
  ImageChange,
  ProminenceChange
} from '../data-models/journey-comparison-models';
import {
  JourneySession,
  JourneyPageType
} from '../data-models/journey-models';
import {
  ContentElements,
  ElementType
} from '../data-models/pattern-models';
import { ContentElementParser, extractElementsFromContent } from './element-parser';

/**
 * Configuration for content diff analysis
 */
export interface ContentDiffConfig {
  enableSemanticAnalysis: boolean;
  enableVisualAnalysis: boolean;
  enableStructuralAnalysis: boolean;
  similarityThreshold: number; // 0-1, threshold for significant differences
  impactWeights: {
    semantic: number;
    visual: number;
    structural: number;
    positional: number;
  };
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  includeMinorChanges: boolean;
}

const DEFAULT_DIFF_CONFIG: ContentDiffConfig = {
  enableSemanticAnalysis: true,
  enableVisualAnalysis: true,
  enableStructuralAnalysis: true,
  similarityThreshold: 0.8,
  impactWeights: {
    semantic: 0.4,
    visual: 0.3,
    structural: 0.2,
    positional: 0.1
  },
  analysisDepth: 'comprehensive',
  includeMinorChanges: false
};

/**
 * Semantic analysis result for content elements
 */
export interface SemanticAnalysisResult {
  conceptualSimilarity: number; // 0-1
  emotionalToneSimilarity: number; // 0-1
  intentSimilarity: number; // 0-1
  complexityDifference: number; // 0-1
  keywordOverlap: number; // 0-1
  sentimentAlignment: number; // 0-1
}

/**
 * Content element change classification
 */
export interface ElementChange {
  elementType: ElementType;
  changeType: ChangeType;
  elementId: string;
  beforeValue: any;
  afterValue: any;
  changeIntensity: number; // 0-1
  impactScore: number; // 0-1
  position: { x: number; y: number; width: number; height: number };
  context: ChangeContext;
}

export interface ChangeContext {
  surroundingElements: string[];
  pageSection: string;
  visualHierarchyLevel: number; // 1-5, 1 being most prominent
  userAttentionLikelihood: number; // 0-1
  functionalImportance: number; // 0-1
}

/**
 * Main Content Diff Analysis Engine
 * Extends Epic 4 ContentElementParser with advanced comparison capabilities
 */
export class ContentDiffEngine {
  private config: ContentDiffConfig;
  private contentParser: ContentElementParser;
  private semanticAnalyzer: SemanticAnalyzer;
  private visualAnalyzer: VisualAnalyzer;
  private structuralAnalyzer: StructuralAnalyzer;

  constructor(
    config: Partial<ContentDiffConfig> = {},
    contentParser?: ContentElementParser
  ) {
    this.config = { ...DEFAULT_DIFF_CONFIG, ...config };
    this.contentParser = contentParser || new ContentElementParser();
    this.semanticAnalyzer = new SemanticAnalyzer(this.config);
    this.visualAnalyzer = new VisualAnalyzer(this.config);
    this.structuralAnalyzer = new StructuralAnalyzer(this.config);
  }

  /**
   * Compare content across entire journey sessions
   * Main entry point for journey comparison analysis
   */
  async compareJourneyContent(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<ContentDiff[]> {
    try {
      const diffs: ContentDiff[] = [];
      const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];

      for (const pageType of pageTypes) {
        const successfulPage = successfulJourney.pageVisits.find(p => p.pageType === pageType);
        const failedPage = failedJourney.pageVisits.find(p => p.pageType === pageType);

        if (successfulPage?.contentVersionId && failedPage?.contentVersionId) {
          const pageDiff = await this.comparePageContent(
            successfulPage.contentVersionId,
            failedPage.contentVersionId,
            pageType
          );

          if (pageDiff && this.isDiffSignificant(pageDiff)) {
            diffs.push(pageDiff);
          }
        } else if (successfulPage?.contentVersionId || failedPage?.contentVersionId) {
          // Handle case where one journey has content and the other doesn't
          const missingContentDiff = await this.createMissingContentDiff(
            successfulPage?.contentVersionId,
            failedPage?.contentVersionId,
            pageType
          );
          diffs.push(missingContentDiff);
        }
      }

      // Sort by impact score descending
      return diffs.sort((a, b) => b.impactScore - a.impactScore);

    } catch (error) {
      console.error('Journey content comparison failed:', error);
      throw new Error(`Content comparison failed: ${error.message}`);
    }
  }

  /**
   * Compare content between two specific content versions
   */
  async comparePageContent(
    successfulContentId: string,
    failedContentId: string,
    pageType: JourneyPageType
  ): Promise<ContentDiff | null> {
    try {
      // Fetch content versions (this would typically query the database)
      const [successfulContent, failedContent] = await Promise.all([
        this.fetchContentVersion(successfulContentId),
        this.fetchContentVersion(failedContentId)
      ]);

      if (!successfulContent || !failedContent) {
        throw new Error(`Content version not found: ${successfulContentId} or ${failedContentId}`);
      }

      // Perform detailed diff analysis
      const diffDetails = await this.analyzeDetailedDifferences(successfulContent, failedContent);
      
      if (diffDetails.length === 0) {
        return null; // No significant differences found
      }

      // Calculate impact and correlation scores
      const impactScore = this.calculateContentImpactScore(diffDetails, successfulContent, failedContent);
      const correlationStrength = await this.calculateOutcomeCorrelation(successfulContent, failedContent);

      // Perform similarity analysis
      const semanticSimilarity = this.config.enableSemanticAnalysis ? 
        await this.semanticAnalyzer.calculateSimilarity(successfulContent, failedContent) : 0.5;
      
      const structuralSimilarity = this.config.enableStructuralAnalysis ?
        await this.structuralAnalyzer.calculateSimilarity(successfulContent, failedContent) : 0.5;

      // Generate visual diff data
      const visualDiff = this.config.enableVisualAnalysis ?
        await this.visualAnalyzer.generateVisualDiff(successfulContent, failedContent) :
        this.getEmptyVisualDiff();

      // Determine primary change category and type
      const { diffCategory, changeType } = this.categorizeContentChange(diffDetails);

      const contentDiff: ContentDiff = {
        id: this.generateDiffId(successfulContentId, failedContentId),
        comparisonId: '', // Will be set by parent comparison
        pageType,
        changeType,
        diffCategory,
        successfulContent,
        failedContent,
        diffDetails,
        impactScore,
        correlationStrength,
        semanticSimilarity,
        structuralSimilarity,
        visualDiff,
        createdAt: new Date()
      };

      return contentDiff;

    } catch (error) {
      console.error(`Page content comparison failed for ${pageType}:`, error);
      return null;
    }
  }

  /**
   * Calculate content similarity score between two versions
   */
  async calculateContentSimilarity(
    contentId1: string,
    contentId2: string
  ): Promise<number> {
    try {
      const [content1, content2] = await Promise.all([
        this.fetchContentVersion(contentId1),
        this.fetchContentVersion(contentId2)
      ]);

      if (!content1 || !content2) return 0;

      // Calculate weighted similarity score
      const semanticSim = this.config.enableSemanticAnalysis ?
        await this.semanticAnalyzer.calculateSimilarity(content1, content2) : 0.5;
      
      const structuralSim = this.config.enableStructuralAnalysis ?
        await this.structuralAnalyzer.calculateSimilarity(content1, content2) : 0.5;
      
      const visualSim = this.config.enableVisualAnalysis ?
        await this.visualAnalyzer.calculateSimilarity(content1, content2) : 0.5;

      // Weighted average based on configuration
      return (
        semanticSim * this.config.impactWeights.semantic +
        structuralSim * this.config.impactWeights.structural +
        visualSim * this.config.impactWeights.visual
      ) / (this.config.impactWeights.semantic + this.config.impactWeights.structural + this.config.impactWeights.visual);

    } catch (error) {
      console.error('Content similarity calculation failed:', error);
      return 0.5; // Neutral similarity on error
    }
  }

  /**
   * Batch analyze content differences for multiple page pairs
   */
  async batchAnalyzeDifferences(
    contentPairs: Array<{
      successfulContentId: string;
      failedContentId: string;
      pageType: JourneyPageType;
    }>
  ): Promise<ContentDiff[]> {
    const batchSize = 5;
    const results: ContentDiff[] = [];

    for (let i = 0; i < contentPairs.length; i += batchSize) {
      const batch = contentPairs.slice(i, i + batchSize);
      const batchPromises = batch.map(pair =>
        this.comparePageContent(pair.successfulContentId, pair.failedContentId, pair.pageType)
          .catch(error => {
            console.warn(`Content diff failed for ${pair.successfulContentId} vs ${pair.failedContentId}:`, error);
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));

      // Prevent overwhelming the system
      if (i + batchSize < contentPairs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results.sort((a, b) => b.impactScore - a.impactScore);
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async analyzeDetailedDifferences(
    successfulContent: ContentVersion,
    failedContent: ContentVersion
  ): Promise<DiffDetail[]> {
    const diffDetails: DiffDetail[] = [];

    // Compare each element type
    const elementTypes: ElementType[] = ['headline', 'pricing', 'benefit', 'feature', 'cta', 'testimonial', 'social-proof'];

    for (const elementType of elementTypes) {
      const successfulElements = this.extractElementsByType(successfulContent.contentElements, elementType);
      const failedElements = this.extractElementsByType(failedContent.contentElements, elementType);

      const elementDiffs = await this.compareElementArrays(
        successfulElements,
        failedElements,
        elementType
      );

      diffDetails.push(...elementDiffs);
    }

    // Filter out insignificant changes
    return diffDetails.filter(diff => 
      diff.changeIntensity >= (this.config.includeMinorChanges ? 0.1 : 0.3)
    );
  }

  private async compareElementArrays(
    successfulElements: any[],
    failedElements: any[],
    elementType: ElementType
  ): Promise<DiffDetail[]> {
    const diffs: DiffDetail[] = [];

    // Handle different array lengths
    const maxLength = Math.max(successfulElements.length, failedElements.length);
    
    for (let i = 0; i < maxLength; i++) {
      const successfulElement = successfulElements[i];
      const failedElement = failedElements[i];

      if (successfulElement && failedElement) {
        // Compare existing elements
        const elementDiff = await this.compareElements(successfulElement, failedElement, elementType, i);
        if (elementDiff) diffs.push(elementDiff);
      } else if (successfulElement && !failedElement) {
        // Element added in successful version
        diffs.push(this.createAdditionDiff(successfulElement, elementType, i));
      } else if (!successfulElement && failedElement) {
        // Element removed in successful version
        diffs.push(this.createRemovalDiff(failedElement, elementType, i));
      }
    }

    return diffs;
  }

  private async compareElements(
    successfulElement: any,
    failedElement: any,
    elementType: ElementType,
    position: number
  ): Promise<DiffDetail | null> {
    const successfulStr = this.normalizeElementForComparison(successfulElement);
    const failedStr = this.normalizeElementForComparison(failedElement);

    if (successfulStr === failedStr) {
      return null; // No difference
    }

    // Calculate change intensity
    const changeIntensity = await this.calculateChangeIntensity(successfulStr, failedStr, elementType);
    
    if (changeIntensity < 0.1) {
      return null; // Change too minor
    }

    // Calculate semantic impact
    const semanticImpact = this.config.enableSemanticAnalysis ?
      await this.semanticAnalyzer.calculateSemanticImpact(successfulStr, failedStr, elementType) : 0.5;

    // Calculate visual impact (placeholder - would analyze visual prominence)
    const visualImpact = this.calculateVisualImpact(elementType, position);

    return {
      changeId: this.generateChangeId(elementType, position),
      elementType,
      changeDescription: this.generateChangeDescription(successfulElement, failedElement, elementType),
      successfulValue: successfulElement,
      failedValue: failedElement,
      changeIntensity,
      semanticImpact,
      visualImpact,
      positionInPage: position / 10, // Normalize to 0-1
      changeContext: this.generateChangeContext(elementType, position)
    };
  }

  private createAdditionDiff(element: any, elementType: ElementType, position: number): DiffDetail {
    return {
      changeId: this.generateChangeId(elementType, position, 'addition'),
      elementType,
      changeDescription: `${elementType} added in successful journey`,
      successfulValue: element,
      failedValue: null,
      changeIntensity: 0.8, // High intensity for additions
      semanticImpact: 0.7,
      visualImpact: this.calculateVisualImpact(elementType, position),
      positionInPage: position / 10,
      changeContext: this.generateChangeContext(elementType, position)
    };
  }

  private createRemovalDiff(element: any, elementType: ElementType, position: number): DiffDetail {
    return {
      changeId: this.generateChangeId(elementType, position, 'removal'),
      elementType,
      changeDescription: `${elementType} removed in successful journey`,
      successfulValue: null,
      failedValue: element,
      changeIntensity: 0.8, // High intensity for removals
      semanticImpact: 0.7,
      visualImpact: this.calculateVisualImpact(elementType, position),
      positionInPage: position / 10,
      changeContext: this.generateChangeContext(elementType, position)
    };
  }

  private calculateContentImpactScore(
    diffDetails: DiffDetail[],
    successfulContent: ContentVersion,
    failedContent: ContentVersion
  ): number {
    if (diffDetails.length === 0) return 0;

    // Weighted average of all changes
    const weightedSum = diffDetails.reduce((sum, diff) => {
      const elementWeight = this.getElementTypeWeight(diff.elementType);
      const impactContribution = (
        diff.changeIntensity * this.config.impactWeights.semantic +
        diff.semanticImpact * this.config.impactWeights.semantic +
        diff.visualImpact * this.config.impactWeights.visual +
        diff.positionInPage * this.config.impactWeights.positional
      ) / (this.config.impactWeights.semantic + this.config.impactWeights.visual + this.config.impactWeights.positional);
      
      return sum + (impactContribution * elementWeight);
    }, 0);

    const totalWeight = diffDetails.reduce((sum, diff) => 
      sum + this.getElementTypeWeight(diff.elementType), 0
    );

    return totalWeight > 0 ? Math.min(1.0, weightedSum / totalWeight) : 0;
  }

  private async calculateOutcomeCorrelation(
    successfulContent: ContentVersion,
    failedContent: ContentVersion
  ): Promise<number> {
    // This would analyze historical correlation between similar content changes and outcomes
    // For now, return a baseline correlation
    return 0.6;
  }

  private categorizeContentChange(diffDetails: DiffDetail[]): { diffCategory: DiffCategory; changeType: ChangeType } {
    if (diffDetails.length === 0) {
      return { diffCategory: 'layout', changeType: 'structural_change' };
    }

    // Determine primary category based on most impactful change
    const primaryDiff = diffDetails.reduce((prev, current) =>
      current.changeIntensity > prev.changeIntensity ? current : prev
    );

    const diffCategory = this.mapElementTypeToDiffCategory(primaryDiff.elementType);
    const changeType = this.determineChangeType(diffDetails);

    return { diffCategory, changeType };
  }

  private mapElementTypeToDiffCategory(elementType: ElementType): DiffCategory {
    const mapping: Record<ElementType, DiffCategory> = {
      'headline': 'headline',
      'pricing': 'pricing',
      'benefit': 'benefits',
      'feature': 'features',
      'cta': 'cta',
      'testimonial': 'testimonials',
      'social-proof': 'social_proof'
    };
    return mapping[elementType] || 'layout';
  }

  private determineChangeType(diffDetails: DiffDetail[]): ChangeType {
    const hasAdditions = diffDetails.some(d => d.failedValue === null);
    const hasRemovals = diffDetails.some(d => d.successfulValue === null);
    const hasTextChanges = diffDetails.some(d => 
      d.successfulValue !== null && d.failedValue !== null && 
      typeof d.successfulValue === 'string' && typeof d.failedValue === 'string'
    );

    if (hasAdditions || hasRemovals) return 'structural_change';
    if (hasTextChanges) return 'text_change';
    return 'element_addition'; // Default
  }

  // Helper methods
  private extractElementsByType(contentElements: ContentElements, elementType: ElementType): any[] {
    switch (elementType) {
      case 'headline':
        return contentElements.headline ? [contentElements.headline] : [];
      case 'pricing':
        return contentElements.pricing ? [contentElements.pricing] : [];
      case 'benefit':
        return contentElements.benefits || [];
      case 'feature':
        return contentElements.features || [];
      case 'cta':
        return contentElements.callToActions || [];
      case 'testimonial':
        return contentElements.testimonials || [];
      case 'social-proof':
        return contentElements.socialProof || [];
      default:
        return [];
    }
  }

  private normalizeElementForComparison(element: any): string {
    if (typeof element === 'string') return element.toLowerCase().trim();
    if (typeof element === 'object') return JSON.stringify(element);
    return String(element);
  }

  private async calculateChangeIntensity(str1: string, str2: string, elementType: ElementType): Promise<number> {
    // Calculate Levenshtein distance ratio
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? distance / maxLength : 0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateVisualImpact(elementType: ElementType, position: number): number {
    const typeWeights: Record<ElementType, number> = {
      'headline': 0.9,
      'pricing': 0.8,
      'cta': 0.85,
      'benefit': 0.7,
      'feature': 0.6,
      'testimonial': 0.5,
      'social-proof': 0.5
    };

    const baseWeight = typeWeights[elementType] || 0.5;
    const positionWeight = Math.max(0.3, 1 - (position * 0.1)); // Earlier elements more impactful
    
    return Math.min(1.0, baseWeight * positionWeight);
  }

  private getElementTypeWeight(elementType: ElementType): number {
    const weights: Record<ElementType, number> = {
      'headline': 0.25,
      'pricing': 0.2,
      'cta': 0.2,
      'benefit': 0.15,
      'feature': 0.1,
      'testimonial': 0.05,
      'social-proof': 0.05
    };
    return weights[elementType] || 0.1;
  }

  private generateChangeDescription(successful: any, failed: any, elementType: ElementType): string {
    if (successful && !failed) return `${elementType} added`;
    if (!successful && failed) return `${elementType} removed`;
    return `${elementType} modified`;
  }

  private generateChangeContext(elementType: ElementType, position: number): string {
    return `${elementType} at position ${position}`;
  }

  private generateDiffId(contentId1: string, contentId2: string): string {
    return `diff-${createHash('md5').update(`${contentId1}-${contentId2}`).digest('hex')}`;
  }

  private generateChangeId(elementType: ElementType, position: number, type: string = 'change'): string {
    return `${type}-${elementType}-${position}-${Date.now()}`;
  }

  private isDiffSignificant(diff: ContentDiff): boolean {
    return diff.impactScore >= 0.3 || diff.correlationStrength >= 0.5;
  }

  private async createMissingContentDiff(
    successfulContentId?: string,
    failedContentId?: string,
    pageType: JourneyPageType
  ): Promise<ContentDiff> {
    // Create diff for missing content scenario
    const emptyContent: ContentVersion = {
      id: 'empty',
      versionHash: 'empty',
      contentElements: {},
      rawContent: '',
      structuralElements: {} as any,
      visualElements: {} as any,
      performanceMetrics: {} as any,
      createdAt: new Date()
    };

    const presentContent = successfulContentId ? 
      await this.fetchContentVersion(successfulContentId) :
      await this.fetchContentVersion(failedContentId!);

    return {
      id: this.generateDiffId(successfulContentId || 'empty', failedContentId || 'empty'),
      comparisonId: '',
      pageType,
      changeType: 'structural_change',
      diffCategory: 'layout',
      successfulContent: successfulContentId ? presentContent! : emptyContent,
      failedContent: failedContentId ? presentContent! : emptyContent,
      diffDetails: [],
      impactScore: 0.8, // High impact for missing content
      correlationStrength: 0.7,
      semanticSimilarity: 0,
      structuralSimilarity: 0,
      visualDiff: this.getEmptyVisualDiff(),
      createdAt: new Date()
    };
  }

  private getEmptyVisualDiff(): VisualDiffData {
    return {
      pixelDifference: 0,
      layoutChanges: [],
      colorChanges: [],
      typographyChanges: [],
      imageChanges: [],
      prominenceChanges: []
    };
  }

  // Placeholder method - would integrate with actual content storage
  private async fetchContentVersion(contentId: string): Promise<ContentVersion | null> {
    // This would query the actual content_versions table
    // For now, return a mock content version
    return {
      id: contentId,
      versionHash: createHash('md5').update(contentId).digest('hex'),
      contentElements: await extractElementsFromContent(`Mock content for ${contentId}`),
      rawContent: `Mock content for ${contentId}`,
      structuralElements: {} as any,
      visualElements: {} as any,
      performanceMetrics: {} as any,
      createdAt: new Date()
    };
  }
}

// ============================================================================
// SUPPORTING ANALYZER CLASSES
// ============================================================================

class SemanticAnalyzer {
  constructor(private config: ContentDiffConfig) {}

  async calculateSimilarity(content1: ContentVersion, content2: ContentVersion): Promise<number> {
    // Implement semantic similarity analysis
    // This would use NLP techniques or external APIs
    return 0.7; // Placeholder
  }

  async calculateSemanticImpact(text1: string, text2: string, elementType: ElementType): Promise<number> {
    // Calculate semantic impact of text changes
    return 0.6; // Placeholder
  }
}

class VisualAnalyzer {
  constructor(private config: ContentDiffConfig) {}

  async calculateSimilarity(content1: ContentVersion, content2: ContentVersion): Promise<number> {
    // Implement visual similarity analysis
    return 0.8; // Placeholder
  }

  async generateVisualDiff(content1: ContentVersion, content2: ContentVersion): Promise<VisualDiffData> {
    // Generate visual diff data
    return {
      pixelDifference: 0.3,
      layoutChanges: [],
      colorChanges: [],
      typographyChanges: [],
      imageChanges: [],
      prominenceChanges: []
    };
  }
}

class StructuralAnalyzer {
  constructor(private config: ContentDiffConfig) {}

  async calculateSimilarity(content1: ContentVersion, content2: ContentVersion): Promise<number> {
    // Implement structural similarity analysis
    return 0.75; // Placeholder
  }
}

export type {
  ContentDiffConfig,
  SemanticAnalysisResult,
  ElementChange,
  ChangeContext
};