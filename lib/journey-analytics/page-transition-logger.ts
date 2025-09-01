/**
 * Page Transition Logging System
 * 
 * Comprehensive system for tracking client page transitions, timing,
 * and engagement patterns across the 4-page journey flow.
 */

import {
  JourneyEvent,
  TrackPageVisitData,
  UpdateSessionData
} from '../data-models/journey-models';
import { journeySessionManager } from './session-tracking';

/**
 * Browser-side engagement tracking utilities
 */
export class EngagementTracker {
  private scrollDepth = 0;
  private interactionCount = 0;
  private clickCount = 0;
  private formInputCount = 0;
  private startTime: Date;
  private isTracking = false;
  private observers: Map<string, any> = new Map();

  constructor() {
    this.startTime = new Date();
  }

  /**
   * Initialize engagement tracking for current page
   */
  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.startTime = new Date();
    this.resetCounters();

    // Set up event listeners
    this.setupScrollTracking();
    this.setupClickTracking();
    this.setupFormTracking();
    this.setupVisibilityTracking();
  }

  /**
   * Stop engagement tracking and return metrics
   */
  stopTracking(): {
    scrollDepth: number;
    interactionCount: number;
    clickCount: number;
    formInputCount: number;
    timeOnPage: number;
  } {
    this.isTracking = false;
    this.cleanup();

    const timeOnPage = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return {
      scrollDepth: this.scrollDepth,
      interactionCount: this.interactionCount,
      clickCount: this.clickCount,
      formInputCount: this.formInputCount,
      timeOnPage
    };
  }

  /**
   * Set up scroll depth tracking
   */
  private setupScrollTracking(): void {
    const updateScrollDepth = () => {
      if (!this.isTracking) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      const currentScrollDepth = Math.min(
        Math.round(((scrollTop + windowHeight) / documentHeight) * 100),
        100
      );
      
      this.scrollDepth = Math.max(this.scrollDepth, currentScrollDepth);
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    this.observers.set('scroll', updateScrollDepth);
  }

  /**
   * Set up click interaction tracking
   */
  private setupClickTracking(): void {
    const trackClick = (event: MouseEvent) => {
      if (!this.isTracking) return;
      
      this.clickCount++;
      this.interactionCount++;
      
      // Log specific click targets for analysis
      const target = event.target as HTMLElement;
      console.log('Click tracked:', {
        tag: target.tagName,
        className: target.className,
        id: target.id,
        time: Date.now() - this.startTime.getTime()
      });
    };

    document.addEventListener('click', trackClick, { passive: true });
    this.observers.set('click', trackClick);
  }

  /**
   * Set up form interaction tracking
   */
  private setupFormTracking(): void {
    const trackFormInput = (event: Event) => {
      if (!this.isTracking) return;
      
      const target = event.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.formInputCount++;
        this.interactionCount++;
      }
    };

    document.addEventListener('input', trackFormInput, { passive: true });
    document.addEventListener('change', trackFormInput, { passive: true });
    this.observers.set('form', trackFormInput);
  }

  /**
   * Set up page visibility tracking for accurate timing
   */
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden - pause tracking
        this.isTracking = false;
      } else {
        // Page became visible - resume tracking
        this.isTracking = true;
        this.startTime = new Date(); // Reset start time
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.observers.set('visibility', handleVisibilityChange);
  }

  /**
   * Clean up event listeners
   */
  private cleanup(): void {
    const scrollHandler = this.observers.get('scroll');
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
    }

    const clickHandler = this.observers.get('click');
    if (clickHandler) {
      document.removeEventListener('click', clickHandler);
    }

    const formHandler = this.observers.get('form');
    if (formHandler) {
      document.removeEventListener('input', formHandler);
      document.removeEventListener('change', formHandler);
    }

    const visibilityHandler = this.observers.get('visibility');
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }

    this.observers.clear();
  }

  /**
   * Reset all counters
   */
  private resetCounters(): void {
    this.scrollDepth = 0;
    this.interactionCount = 0;
    this.clickCount = 0;
    this.formInputCount = 0;
  }

  /**
   * Get current engagement metrics without stopping tracking
   */
  getCurrentMetrics(): {
    scrollDepth: number;
    interactionCount: number;
    clickCount: number;
    formInputCount: number;
    timeOnPage: number;
  } {
    const timeOnPage = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    return {
      scrollDepth: this.scrollDepth,
      interactionCount: this.interactionCount,
      clickCount: this.clickCount,
      formInputCount: this.formInputCount,
      timeOnPage
    };
  }
}

/**
 * Journey Page Transition Manager
 * 
 * Manages page transitions within the client journey flow
 */
export class JourneyPageTransitionManager {
  private currentPage: string | null = null;
  private currentSessionId: string | null = null;
  private currentVisitId: string | null = null;
  private engagementTracker = new EngagementTracker();
  private exitTimeoutId: number | null = null;

  /**
   * Log entry to a page in the client journey
   */
  async logPageEntry(
    pageType: 'activation' | 'agreement' | 'confirmation' | 'processing',
    sessionId: string,
    contentVersionId?: string
  ): Promise<void> {
    // End previous page if exists
    if (this.currentPage && this.currentSessionId) {
      await this.logPageExit('next_page');
    }

    this.currentPage = pageType;
    this.currentSessionId = sessionId;
    const entryTime = new Date();

    // Start engagement tracking
    this.engagementTracker.startTracking();

    // Track page visit with session manager
    const pageVisit = await journeySessionManager.trackPageVisit({
      sessionId,
      pageType,
      contentVersionId,
      entryTime
    });

    this.currentVisitId = pageVisit.id;

    // Set up exit timeout for time-based drop-off detection
    this.setupExitTimeout(pageType);

    console.log(`Journey page entry: ${pageType} at ${entryTime.toISOString()}`);
  }

  /**
   * Log exit from current page
   */
  async logPageExit(
    exitAction: 'next_page' | 'back' | 'close' | 'timeout' | 'error' = 'next_page'
  ): Promise<void> {
    if (!this.currentPage || !this.currentSessionId || !this.currentVisitId) {
      return;
    }

    // Clear exit timeout
    if (this.exitTimeoutId) {
      clearTimeout(this.exitTimeoutId);
      this.exitTimeoutId = null;
    }

    const exitTime = new Date();
    const engagementData = this.engagementTracker.stopTracking();

    // Update page visit with exit information
    await journeySessionManager.updatePageExit(
      this.currentVisitId,
      exitTime,
      exitAction
    );

    console.log(`Journey page exit: ${this.currentPage}`, {
      exitAction,
      ...engagementData
    });

    // Reset current state
    this.currentPage = null;
    this.currentSessionId = null;
    this.currentVisitId = null;
  }

  /**
   * Setup automatic exit timeout for drop-off detection
   */
  private setupExitTimeout(pageType: string): void {
    // Clear existing timeout
    if (this.exitTimeoutId) {
      clearTimeout(this.exitTimeoutId);
    }

    // Set page-specific timeout thresholds
    const timeoutDurations = {
      activation: 300000,   // 5 minutes
      agreement: 600000,    // 10 minutes
      confirmation: 120000, // 2 minutes
      processing: 60000     // 1 minute
    };

    const timeout = timeoutDurations[pageType as keyof typeof timeoutDurations] || 300000;

    this.exitTimeoutId = setTimeout(() => {
      this.logPageExit('timeout');
    }, timeout) as unknown as number;
  }

  /**
   * Get current page engagement metrics
   */
  getCurrentEngagement(): {
    scrollDepth: number;
    interactionCount: number;
    clickCount: number;
    formInputCount: number;
    timeOnPage: number;
  } | null {
    if (!this.currentPage) return null;
    return this.engagementTracker.getCurrentMetrics();
  }

  /**
   * Force end current page (for emergency cleanup)
   */
  async forceEndCurrentPage(
    exitTrigger: 'time_based' | 'content_based' | 'technical' | 'unknown' = 'unknown'
  ): Promise<void> {
    if (this.currentSessionId) {
      await this.logPageExit('error');
      
      // Also end the session if this was an unexpected exit
      await journeySessionManager.endSession(
        this.currentSessionId,
        'dropped_off',
        this.currentPage || undefined,
        exitTrigger
      );
    }
  }

  /**
   * Check if currently tracking a page
   */
  isActivelyTracking(): boolean {
    return this.currentPage !== null && this.currentSessionId !== null;
  }

  /**
   * Get current page information
   */
  getCurrentPageInfo(): {
    page: string | null;
    sessionId: string | null;
    visitId: string | null;
  } {
    return {
      page: this.currentPage,
      sessionId: this.currentSessionId,
      visitId: this.currentVisitId
    };
  }
}

/**
 * Journey Flow Data Collector
 * 
 * Collects comprehensive journey flow data for analysis
 */
export class JourneyFlowCollector {
  private collectionInterval: number | null = null;
  private isCollecting = false;

  /**
   * Start collecting journey flow data
   */
  startCollection(intervalMs: number = 30000): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      this.collectCurrentState();
    }, intervalMs) as unknown as number;
  }

  /**
   * Stop collecting journey flow data
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
  }

  /**
   * Collect current journey state
   */
  private collectCurrentState(): void {
    if (typeof window === 'undefined') return;

    const state = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: this.getPerformanceMetrics(),
      connection: this.getConnectionInfo()
    };

    console.log('Journey flow state:', state);
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): any {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      pageLoad: navigation.loadEventEnd - navigation.fetchStart,
      ttfb: navigation.responseStart - navigation.requestStart
    };
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): any {
    if (typeof navigator === 'undefined') return null;
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
}

/**
 * Singleton instances for global usage
 */
export const journeyPageTransitionManager = new JourneyPageTransitionManager();
export const journeyFlowCollector = new JourneyFlowCollector();

/**
 * Utility function to setup page tracking
 */
export function setupPageTracking(
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing',
  sessionId: string,
  contentVersionId?: string
): void {
  // Log page entry
  journeyPageTransitionManager.logPageEntry(pageType, sessionId, contentVersionId);

  // Start flow collection
  journeyFlowCollector.startCollection();

  // Setup page unload handling
  const handleUnload = () => {
    journeyPageTransitionManager.logPageExit('close');
    journeyFlowCollector.stopCollection();
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);
}

/**
 * Utility function to track page progression
 */
export function trackPageProgression(
  fromPage: string,
  toPage: string,
  sessionId: string
): void {
  console.log(`Journey progression: ${fromPage} → ${toPage}`, {
    sessionId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Utility function for client-side drop-off detection
 */
export function setupDropOffDetection(sessionId: string): void {
  let idleTimer: number;
  let isIdle = false;

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    isIdle = false;
    
    idleTimer = setTimeout(() => {
      isIdle = true;
      console.log('Client appears idle, potential drop-off risk');
      
      // Log engagement pause event
      const currentEngagement = journeyPageTransitionManager.getCurrentEngagement();
      if (currentEngagement) {
        console.log('Pre-drop-off engagement:', currentEngagement);
      }
    }, 60000) as unknown as number; // 1 minute idle threshold
  };

  // Reset timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, { passive: true });
  });

  resetIdleTimer();
}