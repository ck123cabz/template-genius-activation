/**
 * Payment Metadata Enhancement System for Story 2.3
 * Collects and manages rich metadata for payment-outcome correlation
 */

import { EnhancedPaymentMetadata } from "@/app/actions/correlation-actions";

/**
 * Journey timing data interface
 */
export interface JourneyTiming {
  journey_start_time: string;
  page_entry_times: Record<string, string>;
  page_durations: Record<string, number>;
  total_journey_duration?: number;
}

/**
 * Journey context interface for metadata collection
 */
export interface JourneyMetadataContext {
  client_token: string;
  client_id?: string;
  journey_id?: string;
  content_version_id?: string;
  journey_hypothesis?: string;
  page_hypotheses?: Record<string, string>;
  page_sequence: string[];
  timing: JourneyTiming;
  attribution: {
    referrer: string;
    user_agent: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

/**
 * Browser-side metadata collection class
 * Tracks user journey through client activation flow
 */
export class JourneyMetadataCollector {
  private startTime: Date;
  private pageEntryTimes: Record<string, Date> = {};
  private pageSequence: string[] = [];
  private attribution: JourneyMetadataContext['attribution'];
  
  constructor() {
    this.startTime = new Date();
    this.attribution = this.collectAttributionData();
  }

  /**
   * Records entry to a new page in the journey
   */
  recordPageEntry(pageName: string): void {
    this.pageEntryTimes[pageName] = new Date();
    if (!this.pageSequence.includes(pageName)) {
      this.pageSequence.push(pageName);
    }
  }

  /**
   * Calculates time spent on a specific page
   */
  getPageDuration(pageName: string): number {
    const entryTime = this.pageEntryTimes[pageName];
    if (!entryTime) return 0;
    
    return new Date().getTime() - entryTime.getTime();
  }

  /**
   * Gets total journey duration
   */
  getTotalDuration(): number {
    return new Date().getTime() - this.startTime.getTime();
  }

  /**
   * Collects browser attribution data
   */
  private collectAttributionData(): JourneyMetadataContext['attribution'] {
    if (typeof window === 'undefined') {
      return {
        referrer: 'server-side',
        user_agent: 'server-side',
      };
    }

    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
    };
  }

  /**
   * Generates comprehensive metadata for Stripe payment
   */
  generatePaymentMetadata(context: {
    client_token: string;
    client_id?: string;
    journey_id?: string;
    content_version_id?: string;
    journey_hypothesis?: string;
    page_hypotheses?: Record<string, string>;
  }): EnhancedPaymentMetadata {
    const currentTime = new Date();
    const totalDuration = this.getTotalDuration();

    // Calculate page durations
    const pageDurations: Record<string, number> = {};
    Object.keys(this.pageEntryTimes).forEach(page => {
      pageDurations[page] = this.getPageDuration(page);
    });

    return {
      // Core identification
      client_token: context.client_token,
      client_id: context.client_id || '',
      journey_id: context.journey_id,

      // Story 2.3 enhanced metadata
      content_version_id: context.content_version_id,
      journey_start_time: this.startTime.toISOString(),
      page_sequence: JSON.stringify(this.pageSequence),
      conversion_duration: totalDuration.toString(),

      // Hypothesis context
      journey_hypothesis: context.journey_hypothesis,
      page_hypotheses: context.page_hypotheses ? JSON.stringify(context.page_hypotheses) : undefined,

      // Attribution data
      referrer: this.attribution.referrer,
      user_agent: this.attribution.user_agent,
    };
  }

  /**
   * Generates journey context data for correlation records
   */
  generateJourneyContext(additionalContext?: Record<string, any>): Record<string, any> {
    const pageDurations: Record<string, number> = {};
    Object.keys(this.pageEntryTimes).forEach(page => {
      pageDurations[page] = this.getPageDuration(page);
    });

    return {
      pages_visited: this.pageSequence,
      page_durations: pageDurations,
      total_duration: this.getTotalDuration(),
      journey_start_time: this.startTime.toISOString(),
      attribution: this.attribution,
      ...additionalContext,
    };
  }
}

/**
 * Server-side metadata validation and sanitization
 */
export class PaymentMetadataValidator {
  /**
   * Validates and sanitizes payment metadata
   */
  static validateMetadata(metadata: Partial<EnhancedPaymentMetadata>): EnhancedPaymentMetadata {
    // Ensure required fields
    if (!metadata.client_token && !metadata.client_id) {
      throw new Error("Payment metadata must include either client_token or client_id");
    }

    // Sanitize and validate timing data
    let validatedDuration: string | undefined;
    if (metadata.conversion_duration) {
      const duration = parseInt(metadata.conversion_duration);
      if (!isNaN(duration) && duration > 0 && duration < 86400000) { // Max 24 hours
        validatedDuration = duration.toString();
      }
    }

    // Validate and sanitize page sequence
    let validatedPageSequence: string | undefined;
    if (metadata.page_sequence) {
      try {
        const parsed = JSON.parse(metadata.page_sequence);
        if (Array.isArray(parsed) && parsed.length <= 20) { // Max 20 pages
          validatedPageSequence = JSON.stringify(parsed.slice(0, 20));
        }
      } catch (error) {
        console.warn("Invalid page_sequence in payment metadata:", error);
      }
    }

    // Sanitize hypothesis data
    const sanitizeText = (text?: string, maxLength = 500) => {
      if (!text) return undefined;
      return text.substring(0, maxLength).trim();
    };

    return {
      client_token: metadata.client_token || '',
      client_id: metadata.client_id || '',
      journey_id: metadata.journey_id,
      content_version_id: metadata.content_version_id,
      journey_start_time: metadata.journey_start_time,
      page_sequence: validatedPageSequence,
      conversion_duration: validatedDuration,
      journey_hypothesis: sanitizeText(metadata.journey_hypothesis, 1000),
      page_hypotheses: metadata.page_hypotheses,
      referrer: sanitizeText(metadata.referrer, 200),
      user_agent: sanitizeText(metadata.user_agent, 300),
    };
  }

  /**
   * Extracts key metrics from metadata for analysis
   */
  static extractMetrics(metadata: EnhancedPaymentMetadata): {
    conversion_time_minutes: number;
    page_count: number;
    has_hypothesis: boolean;
    traffic_source: 'direct' | 'referral' | 'search' | 'social' | 'unknown';
    device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  } {
    // Calculate conversion time
    let conversionMinutes = 0;
    if (metadata.conversion_duration) {
      const duration = parseInt(metadata.conversion_duration);
      if (!isNaN(duration)) {
        conversionMinutes = Math.round(duration / 60000); // Convert ms to minutes
      }
    }

    // Count pages visited
    let pageCount = 0;
    if (metadata.page_sequence) {
      try {
        const pages = JSON.parse(metadata.page_sequence);
        pageCount = Array.isArray(pages) ? pages.length : 0;
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Determine traffic source
    let trafficSource: 'direct' | 'referral' | 'search' | 'social' | 'unknown' = 'unknown';
    if (metadata.referrer) {
      if (metadata.referrer === 'direct') {
        trafficSource = 'direct';
      } else if (metadata.referrer.includes('google.com') || metadata.referrer.includes('bing.com')) {
        trafficSource = 'search';
      } else if (metadata.referrer.includes('facebook.com') || metadata.referrer.includes('linkedin.com') || metadata.referrer.includes('twitter.com')) {
        trafficSource = 'social';
      } else {
        trafficSource = 'referral';
      }
    }

    // Determine device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    if (metadata.user_agent) {
      const ua = metadata.user_agent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
        deviceType = 'mobile';
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
      } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
        deviceType = 'desktop';
      }
    }

    return {
      conversion_time_minutes: conversionMinutes,
      page_count: pageCount,
      has_hypothesis: Boolean(metadata.journey_hypothesis),
      traffic_source: trafficSource,
      device_type: deviceType,
    };
  }
}

/**
 * Hook for React components to use metadata collection
 */
export const useJourneyMetadata = () => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  // Create or retrieve existing collector from window
  if (!(window as any).__journeyMetadataCollector) {
    (window as any).__journeyMetadataCollector = new JourneyMetadataCollector();
  }

  return (window as any).__journeyMetadataCollector as JourneyMetadataCollector;
};

/**
 * Utility function to create Stripe payment intent with enhanced metadata
 */
export const createEnhancedPaymentIntent = async (
  amount: number,
  currency: string,
  metadata: EnhancedPaymentMetadata
): Promise<{ client_secret?: string; error?: string }> => {
  try {
    const validatedMetadata = PaymentMetadataValidator.validateMetadata(metadata);
    
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata: validatedMetadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Payment intent creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { client_secret: data.client_secret };

  } catch (error) {
    console.error('Error creating enhanced payment intent:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Default metadata context for fallback scenarios
 */
export const createDefaultMetadataContext = (clientToken: string): Partial<JourneyMetadataContext> => {
  return {
    client_token: clientToken,
    page_sequence: ['activation'],
    timing: {
      journey_start_time: new Date().toISOString(),
      page_entry_times: {
        activation: new Date().toISOString(),
      },
      page_durations: {},
    },
    attribution: {
      referrer: 'direct',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
    },
  };
};