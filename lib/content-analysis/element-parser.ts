/**
 * Content Element Analysis System
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Advanced content parsing and element extraction for pattern recognition.
 * This system analyzes content structure to identify high-performing elements.
 */

import { createHash } from 'crypto';
import {
  ContentElements,
  ElementType,
  ElementPerformance,
  TrendIndicator
} from '../data-models/pattern-models';

// Content parsing configuration
export interface ParsingConfig {
  enableSemanticAnalysis: boolean;
  extractSentiment: boolean;
  minElementLength: number;
  maxElementLength: number;
  confidenceThreshold: number;
}

// Default parsing configuration
const DEFAULT_CONFIG: ParsingConfig = {
  enableSemanticAnalysis: true,
  extractSentiment: true,
  minElementLength: 5,
  maxElementLength: 500,
  confidenceThreshold: 0.6
};

// Content element parser class
export class ContentElementParser {
  private config: ParsingConfig;

  constructor(config: Partial<ParsingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main content parsing method
   * Extracts structured elements from raw content
   */
  parseContentElements(content: any): ContentElements {
    try {
      const elements: ContentElements = {};

      // Parse different content formats
      if (typeof content === 'string') {
        return this.parseTextContent(content);
      }

      if (typeof content === 'object' && content !== null) {
        return this.parseStructuredContent(content);
      }

      return elements;
    } catch (error) {
      console.error('Content parsing error:', error);
      return {};
    }
  }

  /**
   * Parse plain text content using NLP techniques
   */
  private parseTextContent(text: string): ContentElements {
    const elements: ContentElements = {};

    // Extract headlines (typically first line or lines starting with #)
    const headlines = this.extractHeadlines(text);
    if (headlines.length > 0) {
      elements.headline = headlines[0]; // Primary headline
    }

    // Extract pricing information
    const pricing = this.extractPricing(text);
    if (pricing) {
      elements.pricing = pricing;
    }

    // Extract benefits and features
    const benefits = this.extractBenefits(text);
    if (benefits.length > 0) {
      elements.benefits = benefits;
    }

    const features = this.extractFeatures(text);
    if (features.length > 0) {
      elements.features = features;
    }

    // Extract call-to-actions
    const ctas = this.extractCallToActions(text);
    if (ctas.length > 0) {
      elements.callToActions = ctas;
    }

    // Extract testimonials
    const testimonials = this.extractTestimonials(text);
    if (testimonials.length > 0) {
      elements.testimonials = testimonials;
    }

    // Extract social proof
    const socialProof = this.extractSocialProof(text);
    if (socialProof.length > 0) {
      elements.socialProof = socialProof;
    }

    return elements;
  }

  /**
   * Parse structured content (JSON, objects)
   */
  private parseStructuredContent(content: any): ContentElements {
    const elements: ContentElements = {};

    // Direct mapping from structured content
    if (content.headline || content.title) {
      elements.headline = content.headline || content.title;
    }

    if (content.pricing) {
      elements.pricing = this.normalizePricing(content.pricing);
    }

    if (content.benefits && Array.isArray(content.benefits)) {
      elements.benefits = content.benefits.filter(this.isValidElement.bind(this));
    }

    if (content.features && Array.isArray(content.features)) {
      elements.features = content.features.filter(this.isValidElement.bind(this));
    }

    if (content.callToActions || content.ctas) {
      const ctas = content.callToActions || content.ctas;
      if (Array.isArray(ctas)) {
        elements.callToActions = ctas.filter(this.isValidElement.bind(this));
      }
    }

    if (content.testimonials && Array.isArray(content.testimonials)) {
      elements.testimonials = content.testimonials.filter(this.isValidElement.bind(this));
    }

    if (content.socialProof && Array.isArray(content.socialProof)) {
      elements.socialProof = content.socialProof.filter(this.isValidElement.bind(this));
    }

    // Try to extract from nested content
    if (content.content || content.body) {
      const nestedElements = this.parseTextContent(content.content || content.body);
      // Merge nested elements with existing ones
      Object.keys(nestedElements).forEach(key => {
        const elementKey = key as keyof ContentElements;
        if (!elements[elementKey] && nestedElements[elementKey]) {
          elements[elementKey] = nestedElements[elementKey] as any;
        }
      });
    }

    return elements;
  }

  /**
   * Extract headlines from text content
   */
  private extractHeadlines(text: string): string[] {
    const headlines: string[] = [];

    // Markdown-style headers
    const markdownHeaders = text.match(/^#{1,3}\s+(.+)$/gm);
    if (markdownHeaders) {
      headlines.push(...markdownHeaders.map(h => h.replace(/^#+\s+/, '').trim()));
    }

    // HTML-style headers
    const htmlHeaders = text.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
    if (htmlHeaders) {
      headlines.push(...htmlHeaders.map(h => h.replace(/<[^>]+>/g, '').trim()));
    }

    // First line if it looks like a headline (short, capitalized)
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length < 150 && this.looksLikeHeadline(firstLine)) {
      headlines.unshift(firstLine);
    }

    return [...new Set(headlines)].filter(this.isValidElement.bind(this));
  }

  /**
   * Extract pricing information from text
   */
  private extractPricing(text: string): ContentElements['pricing'] | null {
    // Price patterns: $100, €50, £75, 100 USD, etc.
    const pricePatterns = [
      /[$€£¥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD|AUD)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(dollars?|euros?|pounds?)/gi
    ];

    for (const pattern of pricePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const currency = this.extractCurrency(match[0]);
        
        return {
          amount,
          currency: currency || 'USD',
          presentation: match[0].trim()
        };
      }
    }

    return null;
  }

  /**
   * Extract benefits from text (value propositions)
   */
  private extractBenefits(text: string): string[] {
    const benefits: string[] = [];

    // Look for benefit keywords and patterns
    const benefitPatterns = [
      // Bullet points or numbered lists
      /^[-*•]\s+(.+)$/gm,
      /^\d+\.\s+(.+)$/gm,
      // Sentences with benefit keywords
      /([^.!?]*(?:save|increase|improve|boost|enhance|reduce|eliminate|achieve|gain|get|receive)[^.!?]*[.!?])/gi,
      // Value proposition patterns
      /([^.!?]*(?:faster|better|easier|more|less|without)[^.!?]*[.!?])/gi
    ];

    benefitPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const benefit = match[1]?.trim();
        if (benefit && this.looksLikeBenefit(benefit)) {
          benefits.push(benefit);
        }
      });
    });

    return [...new Set(benefits)]
      .filter(this.isValidElement.bind(this))
      .slice(0, 10); // Limit to top 10 benefits
  }

  /**
   * Extract features from text
   */
  private extractFeatures(text: string): string[] {
    const features: string[] = [];

    // Look for feature-indicating patterns
    const featurePatterns = [
      // Includes/Features lists
      /(?:includes?|features?|offers?)\s*:?\s*(.+)/gi,
      // Technical specifications
      /([^.!?]*(?:built|designed|equipped|powered|integrated|compatible)[^.!?]*[.!?])/gi,
      // Capability statements
      /([^.!?]*(?:can|able to|supports?|provides?|delivers?)[^.!?]*[.!?])/gi
    ];

    featurePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const feature = match[1]?.trim();
        if (feature && this.looksLikeFeature(feature)) {
          features.push(feature);
        }
      });
    });

    // Also extract from structured lists
    const listItems = this.extractListItems(text);
    features.push(...listItems.filter(item => this.looksLikeFeature(item)));

    return [...new Set(features)]
      .filter(this.isValidElement.bind(this))
      .slice(0, 15); // Limit to top 15 features
  }

  /**
   * Extract call-to-action phrases
   */
  private extractCallToActions(text: string): string[] {
    const ctas: string[] = [];

    // Common CTA patterns
    const ctaPatterns = [
      // Button-like text
      /(?:^|\s)((?:get|start|try|buy|order|purchase|subscribe|download|sign up|learn more|contact|call|book|schedule)[^.!?]*)/gi,
      // Imperative commands
      /(?:^|\s)((?:click|tap|visit|call|email|register|join)[^.!?]*)/gi,
      // Urgency patterns
      /(?:^|\s)((?:limited time|act now|don't wait|hurry)[^.!?]*)/gi
    ];

    ctaPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const cta = match[1]?.trim();
        if (cta && this.looksLikeCTA(cta)) {
          ctas.push(cta);
        }
      });
    });

    return [...new Set(ctas)]
      .filter(this.isValidElement.bind(this))
      .slice(0, 8); // Limit to top 8 CTAs
  }

  /**
   * Extract testimonials and reviews
   */
  private extractTestimonials(text: string): string[] {
    const testimonials: string[] = [];

    // Look for quoted text or testimonial patterns
    const testimonialPatterns = [
      // Quoted text
      /"([^"]+)"/g,
      /'([^']+)'/g,
      // Testimonial indicators
      /(?:testimonial|review|said|states?|mentioned|commented):\s*["']?([^"'.!?]+)["']?/gi,
      // Customer feedback patterns
      /(?:customer|client|user)\s+(?:said|wrote|mentioned|commented):\s*["']?([^"'.!?]+)["']?/gi
    ];

    testimonialPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const testimonial = match[1]?.trim();
        if (testimonial && this.looksLikeTestimonial(testimonial)) {
          testimonials.push(testimonial);
        }
      });
    });

    return [...new Set(testimonials)]
      .filter(this.isValidElement.bind(this))
      .slice(0, 5); // Limit to top 5 testimonials
  }

  /**
   * Extract social proof elements
   */
  private extractSocialProof(text: string): string[] {
    const socialProof: string[] = [];

    // Social proof patterns
    const socialProofPatterns = [
      // Numbers and statistics
      /(\d+[,.]?\d*)\s*(?:k|thousand|million|billion)?\s*(?:customers?|users?|clients?|companies?)/gi,
      /(\d+[,.]?\d*%)\s*(?:satisfaction|success|improvement|increase)/gi,
      // Awards and recognition
      /(?:award|winner|certified|accredited|verified|trusted|featured|mentioned)\s+(?:by|in)\s+([^.!?]+)/gi,
      // Company names and logos
      /(?:trusted by|used by|chosen by|partnered with)\s+([^.!?]+)/gi
    ];

    socialProofPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const proof = match[0]?.trim();
        if (proof && this.looksLikeSocialProof(proof)) {
          socialProof.push(proof);
        }
      });
    });

    return [...new Set(socialProof)]
      .filter(this.isValidElement.bind(this))
      .slice(0, 6); // Limit to top 6 social proof elements
  }

  /**
   * Generate element hash for similarity matching
   */
  generateElementHash(elementContent: string, elementType: ElementType): string {
    const normalizedContent = this.normalizeElementContent(elementContent, elementType);
    return createHash('sha256').update(`${elementType}-${normalizedContent}`).digest('hex');
  }

  /**
   * Analyze element performance across multiple content versions
   */
  analyzeElementPerformance(
    elements: Array<{ content: string; type: ElementType; successful: boolean; clientId: string }>
  ): ElementPerformance[] {
    const performanceMap = new Map<string, {
      elementType: ElementType;
      elementContent: string;
      successes: number;
      total: number;
      clientIds: Set<string>;
      recentOutcomes: boolean[];
    }>();

    // Group elements by hash for similarity
    elements.forEach(element => {
      const hash = this.generateElementHash(element.content, element.type);
      
      if (!performanceMap.has(hash)) {
        performanceMap.set(hash, {
          elementType: element.type,
          elementContent: element.content,
          successes: 0,
          total: 0,
          clientIds: new Set(),
          recentOutcomes: []
        });
      }

      const perf = performanceMap.get(hash)!;
      perf.total++;
      if (element.successful) perf.successes++;
      perf.clientIds.add(element.clientId);
      perf.recentOutcomes.push(element.successful);
      
      // Keep only last 10 outcomes for trend analysis
      if (perf.recentOutcomes.length > 10) {
        perf.recentOutcomes.shift();
      }
    });

    // Convert to ElementPerformance array
    return Array.from(performanceMap.entries()).map(([hash, data]) => {
      const successRate = data.total > 0 ? data.successes / data.total : 0;
      const confidence = this.calculateElementConfidence(data.successes, data.total, data.clientIds.size);
      const trend = this.calculateTrend(data.recentOutcomes);

      return {
        elementType: data.elementType,
        elementContent: data.elementContent,
        successRate,
        confidence,
        sampleSize: data.total,
        trend
      };
    }).sort((a, b) => b.successRate - a.successRate); // Sort by success rate descending
  }

  // Helper methods
  private isValidElement(element: string): boolean {
    if (!element || typeof element !== 'string') return false;
    
    const trimmed = element.trim();
    return trimmed.length >= this.config.minElementLength && 
           trimmed.length <= this.config.maxElementLength;
  }

  private extractCurrency(priceText: string): string | null {
    const currencyMap: { [key: string]: string } = {
      '$': 'USD',
      '€': 'EUR', 
      '£': 'GBP',
      '¥': 'JPY',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'CAD': 'CAD',
      'AUD': 'AUD'
    };

    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (priceText.includes(symbol)) {
        return code;
      }
    }

    return null;
  }

  private extractListItems(text: string): string[] {
    const items: string[] = [];
    
    // Extract bullet points and numbered lists
    const listPatterns = [
      /^[-*•]\s+(.+)$/gm,
      /^\d+\.\s+(.+)$/gm
    ];

    listPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      items.push(...matches.map(m => m[1].trim()));
    });

    return items;
  }

  private looksLikeHeadline(text: string): boolean {
    // Headlines are typically short, have important words capitalized
    return text.length < 150 && 
           /[A-Z]/.test(text) && 
           !text.endsWith('.') &&
           !/^\d+\./.test(text); // Not a numbered list item
  }

  private looksLikeBenefit(text: string): boolean {
    const benefitKeywords = ['save', 'increase', 'improve', 'boost', 'enhance', 'reduce', 'eliminate', 'achieve', 'gain', 'get', 'receive'];
    const lowerText = text.toLowerCase();
    return benefitKeywords.some(keyword => lowerText.includes(keyword)) ||
           /(?:faster|better|easier|more|less|without)/.test(lowerText);
  }

  private looksLikeFeature(text: string): boolean {
    const featureKeywords = ['includes', 'features', 'built', 'designed', 'equipped', 'powered', 'integrated', 'compatible', 'supports', 'provides', 'delivers'];
    const lowerText = text.toLowerCase();
    return featureKeywords.some(keyword => lowerText.includes(keyword)) ||
           /(?:can|able to)/.test(lowerText);
  }

  private looksLikeCTA(text: string): boolean {
    const ctaKeywords = ['get', 'start', 'try', 'buy', 'order', 'purchase', 'subscribe', 'download', 'sign up', 'learn more', 'contact', 'call', 'book', 'schedule', 'click', 'tap'];
    const lowerText = text.toLowerCase();
    return ctaKeywords.some(keyword => lowerText.includes(keyword));
  }

  private looksLikeTestimonial(text: string): boolean {
    // Testimonials are typically personal statements, quotes
    return text.length > 20 && text.length < 500 &&
           (/\b(?:I|we|my|our|this|great|amazing|excellent|love|recommend)\b/i.test(text) ||
            /["']/.test(text));
  }

  private looksLikeSocialProof(text: string): boolean {
    return /\d/.test(text) && // Contains numbers
           /(?:customers?|users?|clients?|companies?|satisfaction|success|improvement|award|certified|trusted|featured)/i.test(text);
  }

  private normalizePricing(pricing: any): ContentElements['pricing'] {
    if (typeof pricing === 'object' && pricing.amount !== undefined) {
      return {
        amount: parseFloat(pricing.amount),
        currency: pricing.currency || 'USD',
        presentation: pricing.presentation || `${pricing.currency || '$'}${pricing.amount}`
      };
    }

    if (typeof pricing === 'string') {
      const extracted = this.extractPricing(pricing);
      return extracted || { amount: 0, currency: 'USD', presentation: pricing };
    }

    return { amount: 0, currency: 'USD', presentation: 'Free' };
  }

  private normalizeElementContent(content: string, type: ElementType): string {
    // Normalize content for consistent hashing
    let normalized = content.toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, ''); // Remove punctuation for similarity matching

    // Type-specific normalization
    switch (type) {
      case 'pricing':
        // Normalize pricing to just numbers
        normalized = normalized.replace(/[^\d]/g, '');
        break;
      case 'headline':
        // Keep word order but normalize case
        break;
      default:
        // Standard normalization
        break;
    }

    return normalized;
  }

  private calculateElementConfidence(successes: number, total: number, uniqueClients: number): number {
    if (total === 0) return 0;

    const successRate = successes / total;
    const sampleWeight = Math.min(total / 10, 1); // Max confidence at 10+ samples
    const diversityWeight = Math.min(uniqueClients / 3, 1); // Max confidence at 3+ clients
    const successWeight = successRate;

    return (sampleWeight * 0.4 + diversityWeight * 0.3 + successWeight * 0.3);
  }

  private calculateTrend(recentOutcomes: boolean[]): TrendIndicator {
    if (recentOutcomes.length < 3) return 'stable';

    const firstHalf = recentOutcomes.slice(0, Math.floor(recentOutcomes.length / 2));
    const secondHalf = recentOutcomes.slice(Math.floor(recentOutcomes.length / 2));

    const firstHalfRate = firstHalf.filter(Boolean).length / firstHalf.length;
    const secondHalfRate = secondHalf.filter(Boolean).length / secondHalf.length;

    const difference = secondHalfRate - firstHalfRate;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }
}

// Export additional helper functions
export function extractElementsFromContent(content: any, config?: Partial<ParsingConfig>): ContentElements {
  const parser = new ContentElementParser(config);
  return parser.parseContentElements(content);
}

export function generateContentHash(content: string, type: ElementType): string {
  const parser = new ContentElementParser();
  return parser.generateElementHash(content, type);
}

// Content analysis result interface
export interface ContentAnalysisResult {
  elements: ContentElements;
  elementHashes: Map<ElementType, string[]>;
  confidence: number;
  parsingTime: number;
  warnings: string[];
}

// Comprehensive content analysis function
export async function analyzeContentStructure(content: any, config?: Partial<ParsingConfig>): Promise<ContentAnalysisResult> {
  const startTime = Date.now();
  const parser = new ContentElementParser(config);
  const warnings: string[] = [];

  try {
    const elements = parser.parseContentElements(content);
    const elementHashes = new Map<ElementType, string[]>();

    // Generate hashes for all extracted elements
    Object.entries(elements).forEach(([type, value]) => {
      const elementType = type as ElementType;
      if (Array.isArray(value)) {
        elementHashes.set(elementType, value.map(v => parser.generateElementHash(v, elementType)));
      } else if (typeof value === 'string') {
        elementHashes.set(elementType, [parser.generateElementHash(value, elementType)]);
      } else if (value && typeof value === 'object') {
        // Handle complex objects like pricing
        elementHashes.set(elementType, [parser.generateElementHash(JSON.stringify(value), elementType)]);
      }
    });

    // Calculate overall confidence
    const elementCount = Object.keys(elements).length;
    const expectedElements = ['headline', 'benefits', 'features'];
    const foundExpected = expectedElements.filter(e => elements[e as keyof ContentElements]).length;
    const confidence = elementCount > 0 ? (foundExpected / expectedElements.length) * 0.7 + (elementCount / 10) * 0.3 : 0;

    // Add warnings for missing important elements
    expectedElements.forEach(element => {
      if (!elements[element as keyof ContentElements]) {
        warnings.push(`Missing ${element} element`);
      }
    });

    return {
      elements,
      elementHashes,
      confidence: Math.min(confidence, 1),
      parsingTime: Date.now() - startTime,
      warnings
    };
  } catch (error) {
    warnings.push(`Parsing error: ${error.message}`);
    return {
      elements: {},
      elementHashes: new Map(),
      confidence: 0,
      parsingTime: Date.now() - startTime,
      warnings
    };
  }
}