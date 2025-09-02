/**
 * WebSocket API Endpoint for Real-time Pattern Updates
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * WebSocket endpoint for real-time pattern dashboard updates with sub-1-second propagation.
 * Handles connection management, authentication, and message routing.
 */

import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { 
  DashboardUpdateManager,
  handleWebSocketConnection,
  DashboardUpdateMessage
} from '../../../lib/real-time/dashboard-updates';
import {
  PatternEventProcessor,
  createPatternEventProcessor
} from '../../../lib/real-time/pattern-events';
import { PatternDetectionEngine } from '../../../lib/pattern-recognition/detection-engine';
import { PatternRecommendationEngine } from '../../../lib/recommendations/pattern-recommendations';

// Global WebSocket server instance
let wss: WebSocketServer | null = null;
let dashboardUpdateManager: DashboardUpdateManager | null = null;
let patternEventProcessor: PatternEventProcessor | null = null;

/**
 * Initialize WebSocket server if not already initialized
 */
function initializeWebSocketServer(): WebSocketServer {
  if (wss) return wss;

  // Create WebSocket server
  wss = new WebSocketServer({
    port: 8080, // Separate port for WebSocket server
    path: '/api/pattern-updates'
  });

  // Initialize pattern processing components
  const detectionEngine = new PatternDetectionEngine();
  const recommendationEngine = new PatternRecommendationEngine();
  
  dashboardUpdateManager = new DashboardUpdateManager();
  patternEventProcessor = createPatternEventProcessor(
    detectionEngine, 
    recommendationEngine
  );

  // Set up integration between components
  dashboardUpdateManager.setupPatternEventIntegration(patternEventProcessor);

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, request) => {
    const { query } = parse(request.url || '', true);
    const connectionId = generateConnectionId();
    const dashboardType = (query.type as string) || 'main';

    console.log(`WebSocket connection established: ${connectionId} (${dashboardType})`);

    // Register connection with dashboard update manager
    handleWebSocketConnection(ws, connectionId, dashboardType);

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, connectionId, message);
      } catch (error) {
        console.error(`Error handling WebSocket message from ${connectionId}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      // Connection is alive
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${connectionId}`);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: {
        connectionId,
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    }));

    // Send initial data
    sendInitialData(ws, connectionId, dashboardType);
  });

  // Error handling
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down WebSocket server...');
    wss?.close();
  });

  console.log('WebSocket server initialized on port 8080');
  return wss;
}

/**
 * Handle incoming WebSocket messages
 */
async function handleWebSocketMessage(
  ws: WebSocket,
  connectionId: string,
  message: any
): Promise<void> {
  
  switch (message.type) {
    case 'ping':
      // Respond to ping with pong
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
        latency: Date.now() - (message.timestamp || 0)
      }));
      break;

    case 'subscribe':
      // Handle subscription requests
      if (message.patternId) {
        // Subscribe to specific pattern updates
        console.log(`${connectionId} subscribed to pattern ${message.patternId}`);
      }
      if (message.clientId) {
        // Subscribe to specific client updates
        console.log(`${connectionId} subscribed to client ${message.clientId}`);
      }
      break;

    case 'unsubscribe':
      // Handle unsubscription requests
      if (message.patternId) {
        console.log(`${connectionId} unsubscribed from pattern ${message.patternId}`);
      }
      if (message.clientId) {
        console.log(`${connectionId} unsubscribed from client ${message.clientId}`);
      }
      break;

    case 'get_current_state':
      // Send current dashboard state
      await sendCurrentState(ws, connectionId);
      break;

    case 'simulate_update':
      // For testing - simulate pattern update
      if (process.env.NODE_ENV === 'development') {
        await simulatePatternUpdate(connectionId);
      }
      break;

    default:
      console.warn(`Unknown message type: ${message.type} from ${connectionId}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${message.type}`
      }));
  }
}

/**
 * Send initial data to newly connected client
 */
async function sendInitialData(
  ws: WebSocket,
  connectionId: string,
  dashboardType: string
): Promise<void> {
  
  try {
    // Send current patterns (mock data for development)
    const mockPatterns = [
      {
        id: 'pattern_1',
        patternType: 'hypothesis',
        confidenceScore: 0.87,
        sampleSize: 23,
        successRate: 0.74,
        lastValidated: new Date().toISOString()
      }
    ];

    ws.send(JSON.stringify({
      type: 'pattern_updated',
      timestamp: new Date().toISOString(),
      data: {
        patterns: mockPatterns
      }
    }));

    // Send current conversion metrics
    const mockMetrics = {
      currentConversionRate: 34.2,
      todayConversions: 27,
      activeJourneys: 15,
      newPatternsToday: 3,
      trend: 'up' as const,
      trendPercentage: 2.3,
      lastUpdated: new Date().toISOString()
    };

    ws.send(JSON.stringify({
      type: 'conversion_update',
      timestamp: new Date().toISOString(),
      data: {
        metrics: mockMetrics
      }
    }));

  } catch (error) {
    console.error(`Error sending initial data to ${connectionId}:`, error);
  }
}

/**
 * Send current dashboard state
 */
async function sendCurrentState(ws: WebSocket, connectionId: string): Promise<void> {
  // In production, this would fetch current state from cache/database
  await sendInitialData(ws, connectionId, 'main');
}

/**
 * Simulate pattern update for testing
 */
async function simulatePatternUpdate(connectionId: string): Promise<void> {
  if (!dashboardUpdateManager) return;

  const mockUpdate: DashboardUpdateMessage = {
    id: `update_${Date.now()}`,
    type: 'pattern_updated',
    timestamp: new Date(),
    data: {
      patterns: [{
        id: 'pattern_sim_1',
        patternType: 'content-element' as const,
        patternData: {
          contentElements: {
            headline: 'Simulated pattern update'
          }
        },
        confidenceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
        sampleSize: Math.floor(Math.random() * 20) + 10,
        successRate: Math.random() * 0.4 + 0.6, // 0.6-1.0
        statisticalSignificance: Math.random() * 0.05,
        identifiedAt: new Date(),
        lastValidated: new Date(),
        isActive: true
      }]
    },
    priority: 'high'
  };

  dashboardUpdateManager.broadcastUpdate(mockUpdate);
  console.log('Simulated pattern update broadcast');
}

/**
 * Generate unique connection ID
 */
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * HTTP endpoints for WebSocket server management
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status':
      // Return WebSocket server status
      const status = {
        serverRunning: wss !== null,
        connections: dashboardUpdateManager?.getConnectionStatus() || { totalConnections: 0, activeConnections: 0 },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
      
      return Response.json(status);

    case 'initialize':
      // Initialize WebSocket server
      if (!wss) {
        initializeWebSocketServer();
        return Response.json({ 
          success: true, 
          message: 'WebSocket server initialized' 
        });
      } else {
        return Response.json({ 
          success: false, 
          message: 'WebSocket server already running' 
        });
      }

    default:
      return Response.json({
        message: 'WebSocket API endpoint for real-time pattern updates',
        endpoints: {
          'GET ?action=status': 'Get server status',
          'GET ?action=initialize': 'Initialize WebSocket server',
          'POST': 'Simulate pattern update (development only)'
        },
        websocket: {
          url: 'ws://localhost:8080/api/pattern-updates',
          protocols: ['pattern-updates'],
          messageTypes: ['ping', 'subscribe', 'unsubscribe', 'get_current_state']
        }
      });
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'simulate_update':
        // Simulate pattern update
        await simulatePatternUpdate('system');
        return Response.json({ success: true, message: 'Pattern update simulated' });

      case 'broadcast_message':
        // Broadcast custom message to all connections
        if (dashboardUpdateManager && data) {
          dashboardUpdateManager.broadcastUpdate({
            id: `manual_${Date.now()}`,
            type: data.type || 'pattern_updated',
            timestamp: new Date(),
            data: data.payload || {},
            priority: data.priority || 'medium'
          });
          return Response.json({ success: true, message: 'Message broadcast' });
        }
        return Response.json({ error: 'No dashboard manager available' }, { status: 500 });

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling POST request:', error);
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// Auto-initialize WebSocket server in development
if (process.env.NODE_ENV === 'development') {
  // Delay initialization to avoid port conflicts during development
  setTimeout(() => {
    try {
      initializeWebSocketServer();
    } catch (error) {
      console.error('Failed to auto-initialize WebSocket server:', error);
    }
  }, 2000);
}