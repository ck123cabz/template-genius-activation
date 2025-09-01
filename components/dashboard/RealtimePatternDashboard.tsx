/**
 * Real-time Pattern Dashboard
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Live pattern dashboard with WebSocket integration for sub-1-second updates.
 * Implements AC 1, 4: Real-time pattern visualization and dashboard updates.
 */

'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity,
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  Users,
  BarChart3,
  Wifi,
  WifiOff,
  Pause,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { PatternAlerts, CompactPatternAlerts } from './PatternAlerts';
import { LiveConversionMetrics } from './LiveConversionMetrics';
import { cn } from '../../lib/utils';

// Type definitions for real-time data
import { SuccessPattern } from '../../lib/data-models/pattern-models';
import { PatternAlert } from '../../lib/real-time/pattern-events';
import { ConversionMetrics } from '../../lib/real-time/dashboard-updates';

/**
 * WebSocket message types for real-time updates
 */
interface WebSocketMessage {
  id: string;
  type: 'pattern_updated' | 'new_alert' | 'conversion_update' | 'connection_status';
  timestamp: string;
  data: {
    patterns?: SuccessPattern[];
    alert?: PatternAlert;
    metrics?: ConversionMetrics;
    status?: 'connected' | 'disconnected' | 'reconnecting';
  };
}

/**
 * Dashboard connection status
 */
interface ConnectionStatus {
  isConnected: boolean;
  reconnectAttempts: number;
  lastPingTime: number;
  latency: number;
  status: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * Sample data for development (would come from WebSocket in production)
 */
const SAMPLE_PATTERNS: SuccessPattern[] = [
  {
    id: 'pattern_1',
    patternType: 'hypothesis',
    patternData: {
      hypothesis: 'Clear value proposition in headline increases conversions',
      metadata: { sourceClientIds: ['client_1', 'client_2'] }
    },
    confidenceScore: 0.87,
    sampleSize: 23,
    successRate: 0.74,
    statisticalSignificance: 0.031,
    identifiedAt: new Date(Date.now() - 86400000),
    lastValidated: new Date(Date.now() - 3600000),
    isActive: true
  },
  {
    id: 'pattern_2',
    patternType: 'content-element',
    patternData: {
      contentElements: { 
        headline: 'Get results in 14 days or money back',
        benefits: ['Risk-free guarantee', 'Fast results', 'Expert support']
      },
      metadata: { sourceClientIds: ['client_3', 'client_4', 'client_5'] }
    },
    confidenceScore: 0.92,
    sampleSize: 31,
    successRate: 0.81,
    statisticalSignificance: 0.007,
    identifiedAt: new Date(Date.now() - 172800000),
    lastValidated: new Date(Date.now() - 1800000),
    isActive: true
  },
  {
    id: 'pattern_3',
    patternType: 'timing',
    patternData: {
      timingFactors: { avgTimeToPayment: 180, engagementDuration: 420, pageViews: 3, interactionEvents: 12 },
      metadata: { sourceClientIds: ['client_6'], averageConversionTime: 180 }
    },
    confidenceScore: 0.64,
    sampleSize: 12,
    successRate: 0.58,
    statisticalSignificance: 0.156,
    identifiedAt: new Date(Date.now() - 259200000),
    lastValidated: new Date(Date.now() - 900000),
    isActive: true
  },
  {
    id: 'pattern_4',
    patternType: 'mixed',
    patternData: {
      hypothesis: 'Testimonial + urgency combination',
      contentElements: { testimonials: ['Amazing results in 2 weeks - Sarah K.'] },
      metadata: { sourceClientIds: ['client_7', 'client_8'] }
    },
    confidenceScore: 0.79,
    sampleSize: 18,
    successRate: 0.67,
    statisticalSignificance: 0.089,
    identifiedAt: new Date(Date.now() - 345600000),
    lastValidated: new Date(Date.now() - 2700000),
    isActive: true
  }
];

export interface RealtimePatternDashboardProps {
  patterns?: SuccessPattern[];
  alerts?: PatternAlert[];
  metrics?: ConversionMetrics;
  onPatternClick?: (pattern: SuccessPattern) => void;
  onAlertAction?: (alertId: string, action: string) => void;
  autoConnect?: boolean;
  className?: string;
}

export function RealtimePatternDashboard({
  patterns: initialPatterns = SAMPLE_PATTERNS,
  alerts: initialAlerts = [],
  metrics: initialMetrics,
  onPatternClick,
  onAlertAction,
  autoConnect = true,
  className
}: RealtimePatternDashboardProps) {
  
  // State management for real-time data
  const [patterns, setPatterns] = useState<SuccessPattern[]>(initialPatterns);
  const [alerts, setAlerts] = useState<PatternAlert[]>(initialAlerts);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(initialMetrics || null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0,
    lastPingTime: 0,
    latency: 0,
    status: 'disconnected'
  });
  
  // Dashboard state
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation states for visual feedback
  const [animatingPatterns, setAnimatingPatterns] = useState<Set<string>>(new Set());
  const [recentUpdates, setRecentUpdates] = useState<Map<string, Date>>(new Map());

  /**
   * WebSocket connection management
   */
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // In production, this would be the actual WebSocket endpoint
      const wsUrl = `ws://localhost:3000/api/pattern-updates`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          reconnectAttempts: 0,
          status: 'connected'
        }));
        
        // Start ping/pong for connection health
        startPingInterval();
        
        console.log('Real-time dashboard connected');
      };

      ws.onmessage = (event) => {
        if (isPaused) return; // Don't process updates when paused

        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          status: 'disconnected'
        }));
        
        clearPingInterval();
        
        // Attempt reconnection if not manually closed
        if (autoConnect) {
          scheduleReconnect();
        }
        
        console.log('Real-time dashboard disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          status: 'disconnected'
        }));
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      scheduleReconnect();
    }
  };

  /**
   * Handle incoming WebSocket messages with animations
   */
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    const now = new Date();
    setLastUpdateTime(now);
    setUpdateCount(prev => prev + 1);

    switch (message.type) {
      case 'pattern_updated':
        if (message.data.patterns) {
          setPatterns(prevPatterns => {
            const updatedPatterns = [...prevPatterns];
            
            message.data.patterns!.forEach(updatedPattern => {
              const index = updatedPatterns.findIndex(p => p.id === updatedPattern.id);
              if (index >= 0) {
                updatedPatterns[index] = updatedPattern;
                // Trigger animation
                setAnimatingPatterns(prev => new Set(prev).add(updatedPattern.id));
                setTimeout(() => {
                  setAnimatingPatterns(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(updatedPattern.id);
                    return newSet;
                  });
                }, 2000);
              } else {
                updatedPatterns.push(updatedPattern);
              }
              
              // Track recent update
              setRecentUpdates(prev => new Map(prev).set(updatedPattern.id, now));
            });
            
            return updatedPatterns.sort((a, b) => b.confidenceScore - a.confidenceScore);
          });
        }
        break;

      case 'new_alert':
        if (message.data.alert) {
          setAlerts(prev => [message.data.alert!, ...prev.slice(0, 9)]);
        }
        break;

      case 'conversion_update':
        if (message.data.metrics) {
          setConversionMetrics(message.data.metrics);
        }
        break;

      case 'connection_status':
        if (message.data.status) {
          setConnectionStatus(prev => ({
            ...prev,
            status: message.data.status!
          }));
        }
        break;
    }
  };

  /**
   * Connection management helpers
   */
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;

    setConnectionStatus(prev => ({
      ...prev,
      status: 'reconnecting',
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connectWebSocket();
    }, delay);
  };

  const startPingInterval = () => {
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: pingTime }));
        
        setConnectionStatus(prev => ({
          ...prev,
          lastPingTime: pingTime
        }));
      }
    }, 15000);
  };

  const clearPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  /**
   * Effects for connection management
   */
  useEffect(() => {
    if (autoConnect) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearPingInterval();
    };
  }, [autoConnect]);

  // Simulate real-time updates for development
  useEffect(() => {
    if (!connectionStatus.isConnected && process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        if (isPaused) return;

        // Simulate pattern updates
        if (Math.random() < 0.3) {
          setPatterns(prev => prev.map(pattern => {
            if (Math.random() < 0.2) { // 20% chance to update each pattern
              const confidenceChange = (Math.random() - 0.5) * 0.1; // ±5% change
              const newConfidence = Math.max(0, Math.min(1, pattern.confidenceScore + confidenceChange));
              
              const updatedPattern = {
                ...pattern,
                confidenceScore: newConfidence,
                lastValidated: new Date()
              };
              
              // Trigger animation
              setAnimatingPatterns(prev => new Set(prev).add(pattern.id));
              setTimeout(() => {
                setAnimatingPatterns(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(pattern.id);
                  return newSet;
                });
              }, 2000);
              
              return updatedPattern;
            }
            return pattern;
          }));
          
          setLastUpdateTime(new Date());
          setUpdateCount(prev => prev + 1);
        }

        // Simulate conversion metrics updates
        if (Math.random() < 0.4) {
          setConversionMetrics(prev => ({
            currentConversionRate: 34.2 + (Math.random() - 0.5) * 5,
            todayConversions: Math.floor(Math.random() * 50) + 25,
            activeJourneys: Math.floor(Math.random() * 20) + 10,
            newPatternsToday: Math.floor(Math.random() * 5) + 1,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            trendPercentage: Math.random() * 5,
            lastUpdated: new Date()
          }));
        }
      }, 3000); // Update every 3 seconds in dev mode

      return () => clearInterval(interval);
    }
  }, [connectionStatus.isConnected, isPaused]);

  /**
   * Pattern display helpers
   */
  const getPatternIcon = (pattern: SuccessPattern) => {
    const isAnimating = animatingPatterns.has(pattern.id);
    const iconClass = cn(
      "h-4 w-4 transition-all duration-500",
      isAnimating && "animate-pulse scale-110",
      pattern.confidenceScore >= 0.8 ? "text-green-500" :
      pattern.confidenceScore >= 0.6 ? "text-yellow-500" : "text-blue-500"
    );

    switch (pattern.patternType) {
      case 'hypothesis': return <Zap className={iconClass} />;
      case 'content-element': return <BarChart3 className={iconClass} />;
      case 'timing': return <Clock className={iconClass} />;
      case 'mixed': return <Activity className={iconClass} />;
      default: return <CheckCircle className={iconClass} />;
    }
  };

  const getConfidenceBadge = (pattern: SuccessPattern) => {
    const isRecent = recentUpdates.has(pattern.id) && 
      (Date.now() - (recentUpdates.get(pattern.id)?.getTime() || 0)) < 5000;

    const variant = pattern.confidenceScore >= 0.8 ? 'default' :
                   pattern.confidenceScore >= 0.6 ? 'secondary' : 'outline';

    return (
      <Badge variant={variant} className={cn(
        "transition-all duration-300",
        isRecent && "ring-2 ring-blue-300 animate-pulse"
      )}>
        {Math.round(pattern.confidenceScore * 100)}%
      </Badge>
    );
  };

  const formatRelativeTime = (date: Date): string => {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Memoized sorted patterns for performance
  const sortedPatterns = useMemo(() => {
    return patterns.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }, [patterns]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Real-time Pattern Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Live pattern insights with sub-second updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : connectionStatus.status === 'reconnecting' ? (
              <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs font-medium">
              {connectionStatus.status === 'connected' && 'Live'}
              {connectionStatus.status === 'reconnecting' && 'Reconnecting...'}
              {connectionStatus.status === 'disconnected' && 'Offline'}
            </span>
          </div>

          {/* Pause/Resume Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2"
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          {/* Update Counter */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updates: {updateCount}
          </div>
        </div>
      </div>

      {/* Conversion Metrics - Top Priority */}
      {conversionMetrics && (
        <LiveConversionMetrics 
          metrics={conversionMetrics}
          showTrends={true}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Pattern Grid - Left Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Pattern Analysis
                  <Badge variant="outline" className="ml-2">
                    {sortedPatterns.length} patterns
                  </Badge>
                </CardTitle>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last update: {formatRelativeTime(lastUpdateTime)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedPatterns.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns detected yet</p>
                  <p className="text-xs mt-1">Patterns will appear as data is collected</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className={cn(
                        "relative p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md",
                        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
                        animatingPatterns.has(pattern.id) && "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950",
                        pattern.confidenceScore >= 0.8 && "border-l-4 border-l-green-500",
                        pattern.confidenceScore >= 0.6 && pattern.confidenceScore < 0.8 && "border-l-4 border-l-yellow-500",
                        pattern.confidenceScore < 0.6 && "border-l-4 border-l-blue-500"
                      )}
                      onClick={() => onPatternClick?.(pattern)}
                    >
                      {/* Pattern Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPatternIcon(pattern)}
                          <Badge variant="outline" className="text-xs">
                            {pattern.patternType}
                          </Badge>
                        </div>
                        {getConfidenceBadge(pattern)}
                      </div>

                      {/* Pattern Content */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                          {pattern.patternData.hypothesis?.substring(0, 80) + '...' ||
                           pattern.patternData.contentElements?.headline?.substring(0, 80) + '...' ||
                           `${pattern.patternType} pattern`}
                        </p>
                      </div>

                      {/* Pattern Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                          <div className="font-mono font-medium">
                            {Math.round(pattern.successRate * 100)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Sample Size:</span>
                          <div className="font-mono font-medium">{pattern.sampleSize}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Statistical Sig:</span>
                          <div className={cn(
                            "font-mono font-medium",
                            pattern.statisticalSignificance <= 0.05 ? "text-green-600" : "text-gray-600"
                          )}>
                            p={pattern.statisticalSignificance.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                          <div className="font-mono font-medium">
                            {formatRelativeTime(pattern.lastValidated)}
                          </div>
                        </div>
                      </div>

                      {/* Confidence Progress Bar */}
                      <div className="mt-3">
                        <Progress 
                          value={pattern.confidenceScore * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Animation Indicator */}
                      {animatingPatterns.has(pattern.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Status - Right Column */}
        <div className="space-y-6">
          {/* Compact Alerts */}
          <CompactPatternAlerts 
            alerts={alerts}
            onAlertClick={(alert) => console.log('Alert clicked:', alert)}
          />

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Connection:</span>
                  <span className={cn(
                    "font-medium",
                    connectionStatus.isConnected ? "text-green-600" : "text-red-600"
                  )}>
                    {connectionStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updates:</span>
                  <span className="font-mono">{updateCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Patterns:</span>
                  <span className="font-mono">{patterns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Alerts:</span>
                  <span className="font-mono">{alerts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={cn(
                    "font-medium",
                    isPaused ? "text-yellow-600" : "text-green-600"
                  )}>
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}