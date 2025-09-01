/**
 * Journey Session Tracking System
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Manages client journey sessions, page visits, and engagement tracking.
 * Provides core functionality for session creation, updates, and analytics.
 */

import { createHash, randomUUID } from 'crypto';
import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType,
  JourneyOutcome,
  ExitTrigger,
  ExitAction,
  PageTransition,
  EngagementMetrics,
  TimeAnalytics
} from '../data-models/journey-models';

export class JourneySessionManager {
  private activeSessions: Map<string, JourneySession> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.startSessionCleanupJob();
  }

  /**
   * Create a new journey session for a client
   */
  async createSession(clientId: string): Promise<JourneySession> {
    const sessionId = randomUUID();
    const session: JourneySession = {
      id: sessionId,
      clientId,
      sessionStart: new Date(),
      totalDuration: 0,
      pageVisits: [],
      finalOutcome: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeSessions.set(sessionId, session);
    this.setSessionTimeout(sessionId);

    // In production, save to database
    await this.saveSessionToDatabase(session);

    return session;
  }

  /**
   * Track a page visit within a session
   */
  async trackPageVisit(
    sessionId: string,
    pageType: JourneyPageType,
    contentVersionId?: string
  ): Promise<JourneyPageVisit> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // End previous page visit if exists
    const currentPageVisit = session.pageVisits[session.pageVisits.length - 1];
    if (currentPageVisit && !currentPageVisit.exitTime) {
      await this.endPageVisit(sessionId, currentPageVisit.id, 'next_page');
    }

    const pageVisit: JourneyPageVisit = {
      id: randomUUID(),
      sessionId,
      pageType,
      contentVersionId,
      entryTime: new Date(),
      timeOnPage: 0,
      engagementScore: 0,
      exitAction: 'next_page',
      scrollDepth: 0,
      interactions: 0,
      createdAt: new Date()
    };

    session.pageVisits.push(pageVisit);
    session.updatedAt = new Date();

    // Reset session timeout
    this.setSessionTimeout(sessionId);

    // In production, save to database
    await this.savePageVisitToDatabase(pageVisit);
    await this.updateSessionInDatabase(session);

    return pageVisit;
  }

  /**
   * End a page visit with engagement metrics
   */
  async endPageVisit(
    sessionId: string,
    pageVisitId: string,
    exitAction: ExitAction,
    engagementData?: {
      scrollDepth?: number;
      interactions?: number;
      customMetrics?: Record<string, any>;
    }
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const pageVisit = session.pageVisits.find(pv => pv.id === pageVisitId);
    if (!pageVisit) {
      throw new Error(`Page visit not found: ${pageVisitId}`);
    }

    const now = new Date();
    pageVisit.exitTime = now;
    pageVisit.timeOnPage = Math.floor((now.getTime() - pageVisit.entryTime.getTime()) / 1000);
    pageVisit.exitAction = exitAction;

    // Update engagement metrics
    if (engagementData) {
      pageVisit.scrollDepth = engagementData.scrollDepth || 0;
      pageVisit.interactions = engagementData.interactions || 0;
    }

    // Calculate engagement score based on time, scroll, and interactions
    pageVisit.engagementScore = this.calculateEngagementScore(pageVisit);

    session.updatedAt = now;

    // In production, update database
    await this.updatePageVisitInDatabase(pageVisit);
    await this.updateSessionInDatabase(session);

    // Check if this indicates session end
    if (exitAction === 'close' || exitAction === 'timeout' || exitAction === 'error') {
      await this.endSession(sessionId, this.determineExitTrigger(exitAction));
    }
  }

  /**
   * End a journey session
   */
  async endSession(
    sessionId: string,
    exitTrigger?: ExitTrigger,
    outcome?: JourneyOutcome
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return; // Session already ended or doesn't exist
    }

    const now = new Date();
    session.sessionEnd = now;
    session.totalDuration = Math.floor((now.getTime() - session.sessionStart.getTime()) / 1000);
    session.updatedAt = now;

    // Determine outcome if not provided
    if (!outcome) {
      outcome = this.determineSessionOutcome(session);
    }
    session.finalOutcome = outcome;

    // Determine exit trigger if session was dropped off
    if (outcome === 'dropped_off') {
      session.exitTrigger = exitTrigger || this.inferExitTrigger(session);
      session.exitPoint = this.getLastPageType(session);
    }

    // Clean up session from active sessions
    this.activeSessions.delete(sessionId);
    this.clearSessionTimeout(sessionId);

    // In production, update database
    await this.updateSessionInDatabase(session);

    // Trigger analytics processing
    await this.processSessionForAnalytics(session);
  }

  /**
   * Get current session for a client
   */
  getActiveSession(clientId: string): JourneySession | null {
    for (const session of this.activeSessions.values()) {
      if (session.clientId === clientId && session.finalOutcome === 'in_progress') {
        return session;
      }
    }
    return null;
  }

  /**
   * Calculate engagement score based on multiple factors
   */
  private calculateEngagementScore(pageVisit: JourneyPageVisit): number {
    let score = 0;

    // Time factor (30% weight) - optimal time is 60-300 seconds
    const timeScore = Math.min(1, Math.max(0, (pageVisit.timeOnPage - 10) / 290));
    score += timeScore * 0.3;

    // Scroll depth factor (35% weight)
    const scrollScore = Math.min(1, pageVisit.scrollDepth / 80); // 80% is considered good
    score += scrollScore * 0.35;

    // Interaction factor (35% weight)
    const interactionScore = Math.min(1, pageVisit.interactions / 5); // 5 interactions is considered high
    score += interactionScore * 0.35;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Determine exit trigger from exit action
   */
  private determineExitTrigger(exitAction: ExitAction): ExitTrigger {
    switch (exitAction) {
      case 'timeout':
        return 'time_based';
      case 'error':
        return 'technical';
      case 'close':
      case 'back':
        return 'content_based';
      default:
        return 'unknown';
    }
  }

  /**
   * Determine session outcome based on journey completion
   */
  private determineSessionOutcome(session: JourneySession): JourneyOutcome {
    const pageTypes = session.pageVisits.map(pv => pv.pageType);
    
    // Check if completed full journey
    const requiredPages: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const hasAllPages = requiredPages.every(page => pageTypes.includes(page));
    
    if (hasAllPages) {
      return 'completed';
    }
    
    // Check if still in progress (recent activity)
    const lastVisit = session.pageVisits[session.pageVisits.length - 1];
    if (lastVisit && !lastVisit.exitTime) {
      return 'in_progress';
    }
    
    return 'dropped_off';
  }

  /**
   * Infer exit trigger from session patterns
   */
  private inferExitTrigger(session: JourneySession): ExitTrigger {
    const lastPageVisit = session.pageVisits[session.pageVisits.length - 1];
    if (!lastPageVisit) return 'unknown';

    // Analyze patterns to infer trigger
    if (lastPageVisit.timeOnPage < 5) {
      return 'content_based'; // Quick exit suggests content issues
    }
    
    if (lastPageVisit.timeOnPage > 600) {
      return 'time_based'; // Very long time suggests user left
    }
    
    if (lastPageVisit.scrollDepth < 20) {
      return 'content_based'; // Low scroll suggests content not engaging
    }
    
    return 'unknown';
  }

  /**
   * Get the last page type visited in session
   */
  private getLastPageType(session: JourneySession): string {
    const lastPageVisit = session.pageVisits[session.pageVisits.length - 1];
    return lastPageVisit ? lastPageVisit.pageType : 'unknown';
  }

  /**
   * Set session timeout for automatic cleanup
   */
  private setSessionTimeout(sessionId: string): void {
    this.clearSessionTimeout(sessionId);
    
    const timeout = setTimeout(() => {
      this.endSession(sessionId, 'time_based', 'dropped_off');
    }, this.sessionTimeoutMs);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Start cleanup job for inactive sessions
   */
  private startSessionCleanupJob(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.activeSessions.entries()) {
        const timeSinceUpdate = now - session.updatedAt.getTime();
        if (timeSinceUpdate > this.sessionTimeoutMs) {
          this.endSession(sessionId, 'time_based', 'dropped_off');
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Calculate session statistics
   */
  async getSessionStatistics(sessionIds: string[]): Promise<{
    avgDuration: number;
    completionRate: number;
    dropOffRate: number;
    engagementMetrics: EngagementMetrics;
  }> {
    // In production, query database for sessions
    const sessions = Array.from(this.activeSessions.values())
      .filter(s => sessionIds.includes(s.id));

    const completedSessions = sessions.filter(s => s.finalOutcome === 'completed');
    const totalDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0);

    // Calculate engagement metrics
    const allPageVisits = sessions.flatMap(s => s.pageVisits);
    const avgScrollDepth = allPageVisits.length > 0 
      ? allPageVisits.reduce((sum, pv) => sum + pv.scrollDepth, 0) / allPageVisits.length
      : 0;

    const avgInteractions = allPageVisits.length > 0
      ? allPageVisits.reduce((sum, pv) => sum + pv.interactions, 0) / allPageVisits.length
      : 0;

    const avgEngagementScore = allPageVisits.length > 0
      ? allPageVisits.reduce((sum, pv) => sum + pv.engagementScore, 0) / allPageVisits.length
      : 0;

    const engagementDistribution = {
      low: allPageVisits.filter(pv => pv.engagementScore < 0.4).length,
      medium: allPageVisits.filter(pv => pv.engagementScore >= 0.4 && pv.engagementScore < 0.7).length,
      high: allPageVisits.filter(pv => pv.engagementScore >= 0.7).length
    };

    return {
      avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      completionRate: sessions.length > 0 ? completedSessions.length / sessions.length : 0,
      dropOffRate: sessions.length > 0 ? sessions.filter(s => s.finalOutcome === 'dropped_off').length / sessions.length : 0,
      engagementMetrics: {
        avgScrollDepth,
        avgInteractions,
        avgEngagementScore,
        highEngagementThreshold: 0.7,
        engagementDistribution
      }
    };
  }

  /**
   * Get time analytics for page types
   */
  async getTimeAnalytics(pageType: JourneyPageType): Promise<TimeAnalytics> {
    // In production, query database for page visits
    const allPageVisits = Array.from(this.activeSessions.values())
      .flatMap(s => s.pageVisits)
      .filter(pv => pv.pageType === pageType && pv.timeOnPage > 0);

    if (allPageVisits.length === 0) {
      return {
        pageType,
        avgTimeOnPage: 0,
        medianTimeOnPage: 0,
        percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
        dropOffTimeThreshold: 300, // 5 minutes default
        engagementTimeThreshold: 60 // 1 minute default
      };
    }

    const times = allPageVisits.map(pv => pv.timeOnPage).sort((a, b) => a - b);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

    const percentiles = {
      p25: times[Math.floor(times.length * 0.25)],
      p50: times[Math.floor(times.length * 0.50)],
      p75: times[Math.floor(times.length * 0.75)],
      p90: times[Math.floor(times.length * 0.90)],
      p95: times[Math.floor(times.length * 0.95)]
    };

    return {
      pageType,
      avgTimeOnPage: avgTime,
      medianTimeOnPage: percentiles.p50,
      percentiles,
      dropOffTimeThreshold: percentiles.p90, // 90th percentile as threshold
      engagementTimeThreshold: percentiles.p25 // 25th percentile as minimum engagement
    };
  }

  // Database interaction methods (would be implemented with actual database)
  private async saveSessionToDatabase(session: JourneySession): Promise<void> {
    // Implementation would save to database
    console.log(`Saving session to database: ${session.id}`);
  }

  private async savePageVisitToDatabase(pageVisit: JourneyPageVisit): Promise<void> {
    // Implementation would save to database
    console.log(`Saving page visit to database: ${pageVisit.id}`);
  }

  private async updateSessionInDatabase(session: JourneySession): Promise<void> {
    // Implementation would update database
    console.log(`Updating session in database: ${session.id}`);
  }

  private async updatePageVisitInDatabase(pageVisit: JourneyPageVisit): Promise<void> {
    // Implementation would update database
    console.log(`Updating page visit in database: ${pageVisit.id}`);
  }

  private async processSessionForAnalytics(session: JourneySession): Promise<void> {
    // Implementation would trigger background analytics processing
    console.log(`Processing session for analytics: ${session.id}`);
  }
}

// Singleton instance
export const journeySessionManager = new JourneySessionManager();

// Utility functions for external use
export async function createJourneySession(clientId: string): Promise<JourneySession> {
  return journeySessionManager.createSession(clientId);
}

export async function trackJourneyPageVisit(
  sessionId: string,
  pageType: JourneyPageType,
  contentVersionId?: string
): Promise<JourneyPageVisit> {
  return journeySessionManager.trackPageVisit(sessionId, pageType, contentVersionId);
}

export async function endJourneyPageVisit(
  sessionId: string,
  pageVisitId: string,
  exitAction: ExitAction,
  engagementData?: {
    scrollDepth?: number;
    interactions?: number;
    customMetrics?: Record<string, any>;
  }
): Promise<void> {
  return journeySessionManager.endPageVisit(sessionId, pageVisitId, exitAction, engagementData);
}

export async function endJourneySession(
  sessionId: string,
  exitTrigger?: ExitTrigger,
  outcome?: JourneyOutcome
): Promise<void> {
  return journeySessionManager.endSession(sessionId, exitTrigger, outcome);
}

export function getActiveJourneySession(clientId: string): JourneySession | null {
  return journeySessionManager.getActiveSession(clientId);
}