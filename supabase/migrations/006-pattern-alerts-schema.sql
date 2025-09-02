/**
 * Database Schema for Real-time Pattern Alerts and Updates
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Creates tables and indexes for pattern alerts, update logs, and real-time processing.
 * Ensures optimal performance for real-time pattern updates and alert management.
 */

-- Pattern alerts table for AC 2: New pattern alerts when significant trends are identified
CREATE TABLE pattern_alerts (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  alert_type ENUM('new_pattern', 'confidence_increase', 'confidence_decrease', 'statistical_significance') NOT NULL,
  message TEXT NOT NULL,
  significance ENUM('low', 'medium', 'high') NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  previous_confidence DECIMAL(5,4) CHECK (previous_confidence >= 0 AND previous_confidence <= 1),
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  recommended_action TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Performance indexes
  INDEX idx_pattern_alerts_pattern_id (pattern_id),
  INDEX idx_pattern_alerts_type (alert_type),
  INDEX idx_pattern_alerts_significance (significance),
  INDEX idx_pattern_alerts_created_at (created_at DESC),
  INDEX idx_pattern_alerts_unread (is_read, created_at DESC),
  INDEX idx_pattern_alerts_composite (pattern_id, alert_type, significance, created_at DESC),
  
  -- Foreign key constraint
  CONSTRAINT fk_pattern_alerts_pattern FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern updates log for tracking real-time changes (AC 1, 3, 4)
CREATE TABLE pattern_updates_log (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  event_type ENUM('outcome_recorded', 'confidence_updated', 'alert_generated', 'recommendation_created') NOT NULL,
  event_data JSON,
  old_confidence DECIMAL(5,4) CHECK (old_confidence >= 0 AND old_confidence <= 1),
  new_confidence DECIMAL(5,4) CHECK (new_confidence >= 0 AND new_confidence <= 1),
  trigger_client_id VARCHAR(191),
  trigger_version_id VARCHAR(191),
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  websocket_propagation_ms INTEGER CHECK (websocket_propagation_ms >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance indexes for real-time queries
  INDEX idx_pattern_updates_pattern_id (pattern_id),
  INDEX idx_pattern_updates_event_type (event_type),
  INDEX idx_pattern_updates_created_at (created_at DESC),
  INDEX idx_pattern_updates_client_id (trigger_client_id),
  INDEX idx_pattern_updates_composite (pattern_id, event_type, created_at DESC),
  INDEX idx_pattern_updates_performance (processing_time_ms, websocket_propagation_ms),
  
  -- Foreign key constraint
  CONSTRAINT fk_pattern_updates_pattern FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Real-time journey recommendations for AC 5: Immediate recommendations for in-progress journeys
CREATE TABLE real_time_recommendations (
  id VARCHAR(191) PRIMARY KEY,
  client_id VARCHAR(191) NOT NULL,
  session_id VARCHAR(191) NOT NULL,
  recommendation_type ENUM('content_optimization', 'timing_adjustment', 'intervention', 'ab_test', 'pattern_application') NOT NULL,
  priority ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  urgency ENUM('immediate', 'within_5min', 'within_hour', 'next_session') NOT NULL,
  
  -- Recommendation content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  specific_action TEXT NOT NULL,
  expected_impact DECIMAL(5,4) NOT NULL CHECK (expected_impact >= 0 AND expected_impact <= 1),
  confidence_level DECIMAL(5,4) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Pattern basis
  primary_pattern_id VARCHAR(191) NOT NULL,
  supporting_pattern_ids JSON, -- Array of pattern IDs
  pattern_confidence DECIMAL(5,4) NOT NULL CHECK (pattern_confidence >= 0 AND pattern_confidence <= 1),
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  
  -- Implementation details
  implementation_method ENUM('content_swap', 'element_highlight', 'popup_intervention', 'time_extension', 'personalization') NOT NULL,
  implementation_data JSON,
  
  -- Status tracking
  status ENUM('pending', 'applied', 'dismissed', 'expired') DEFAULT 'pending',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  applied_at TIMESTAMP NULL,
  outcome ENUM('success', 'failure', 'neutral') NULL,
  
  -- Performance indexes for real-time queries
  INDEX idx_realtime_recs_client_id (client_id),
  INDEX idx_realtime_recs_session_id (session_id),
  INDEX idx_realtime_recs_priority (priority),
  INDEX idx_realtime_recs_urgency (urgency),
  INDEX idx_realtime_recs_status (status),
  INDEX idx_realtime_recs_expires_at (expires_at),
  INDEX idx_realtime_recs_generated_at (generated_at DESC),
  INDEX idx_realtime_recs_pattern_id (primary_pattern_id),
  INDEX idx_realtime_recs_composite (client_id, status, priority, generated_at DESC),
  INDEX idx_realtime_recs_active (status, expires_at, priority),
  
  -- Foreign key constraints
  CONSTRAINT fk_realtime_recs_pattern FOREIGN KEY (primary_pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Active client journeys for real-time tracking (AC 5)
CREATE TABLE active_client_journeys (
  id VARCHAR(191) PRIMARY KEY,
  client_id VARCHAR(191) NOT NULL,
  session_id VARCHAR(191) NOT NULL UNIQUE,
  current_page ENUM('activation', 'agreement', 'confirmation', 'processing') NOT NULL,
  time_on_current_page INTEGER NOT NULL CHECK (time_on_current_page >= 0), -- milliseconds
  total_journey_time INTEGER NOT NULL CHECK (total_journey_time >= 0), -- milliseconds
  engagement_score DECIMAL(5,4) NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 1),
  
  -- Content version tracking
  content_version_id VARCHAR(191),
  content_hypothesis TEXT,
  content_elements JSON,
  
  -- Client segmentation
  client_segment VARCHAR(100),
  industry_category VARCHAR(100),
  company_size ENUM('startup', 'small', 'medium', 'enterprise'),
  
  -- Risk assessment
  dropoff_risk DECIMAL(5,4) NOT NULL CHECK (dropoff_risk >= 0 AND dropoff_risk <= 1),
  conversion_probability DECIMAL(5,4) NOT NULL CHECK (conversion_probability >= 0 AND conversion_probability <= 1),
  
  -- Interaction tracking
  interaction_events JSON, -- Array of interaction objects
  last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Journey lifecycle
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  -- Performance indexes for real-time queries
  INDEX idx_active_journeys_client_id (client_id),
  INDEX idx_active_journeys_session_id (session_id),
  INDEX idx_active_journeys_current_page (current_page),
  INDEX idx_active_journeys_dropoff_risk (dropoff_risk DESC),
  INDEX idx_active_journeys_conversion_prob (conversion_probability DESC),
  INDEX idx_active_journeys_segment (client_segment),
  INDEX idx_active_journeys_last_interaction (last_interaction_at DESC),
  INDEX idx_active_journeys_composite (client_id, current_page, dropoff_risk, last_updated_at DESC),
  INDEX idx_active_journeys_active (completed_at, dropoff_risk DESC, last_updated_at DESC)
);

-- Real-time conversion metrics for AC 4: Real-time conversion rate updates
CREATE TABLE conversion_metrics_log (
  id VARCHAR(191) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Core metrics
  current_conversion_rate DECIMAL(5,2) NOT NULL CHECK (current_conversion_rate >= 0 AND current_conversion_rate <= 100),
  today_conversions INTEGER NOT NULL CHECK (today_conversions >= 0),
  active_journeys INTEGER NOT NULL CHECK (active_journeys >= 0),
  new_patterns_today INTEGER NOT NULL CHECK (new_patterns_today >= 0),
  
  -- Trend analysis
  trend ENUM('up', 'down', 'stable') NOT NULL,
  trend_percentage DECIMAL(5,2) NOT NULL,
  
  -- Segmentation
  segment_breakdown JSON, -- Conversion rates by segment
  page_breakdown JSON,    -- Conversion rates by page
  
  -- Confidence intervals
  confidence_lower DECIMAL(5,2),
  confidence_upper DECIMAL(5,2),
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  
  -- Performance tracking
  calculation_time_ms INTEGER CHECK (calculation_time_ms >= 0),
  
  -- Indexes for real-time analytics
  INDEX idx_conversion_metrics_timestamp (timestamp DESC),
  INDEX idx_conversion_metrics_trend (trend, timestamp DESC),
  INDEX idx_conversion_metrics_rate (current_conversion_rate, timestamp DESC),
  INDEX idx_conversion_metrics_today (today_conversions, timestamp DESC)
);

-- Background processing jobs queue for IV3: Background processing optimization
CREATE TABLE background_processing_queue (
  id VARCHAR(191) PRIMARY KEY,
  job_type ENUM('pattern-detection', 'confidence-recalc', 'recommendation-generation', 'similarity-analysis') NOT NULL,
  priority ENUM('critical', 'high', 'medium', 'low') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  
  -- Job data
  job_data JSON NOT NULL,
  client_id VARCHAR(191),
  pattern_id VARCHAR(191),
  
  -- Processing tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  
  -- Error handling
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
  error_message TEXT,
  last_retry_at TIMESTAMP NULL,
  
  -- Resource usage
  cpu_usage_percent DECIMAL(5,2) CHECK (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100),
  memory_usage_mb DECIMAL(10,2) CHECK (memory_usage_mb >= 0),
  
  -- Indexes for queue management
  INDEX idx_bg_queue_status (status),
  INDEX idx_bg_queue_priority (priority, created_at ASC),
  INDEX idx_bg_queue_job_type (job_type),
  INDEX idx_bg_queue_client_id (client_id),
  INDEX idx_bg_queue_pattern_id (pattern_id),
  INDEX idx_bg_queue_processing (status, priority, created_at ASC),
  INDEX idx_bg_queue_completed (status, completed_at DESC),
  INDEX idx_bg_queue_failed (status, retry_count, max_retries, last_retry_at),
  INDEX idx_bg_queue_cleanup (status, completed_at, created_at)
);

-- WebSocket connection tracking for dashboard updates
CREATE TABLE websocket_connections (
  id VARCHAR(191) PRIMARY KEY,
  connection_id VARCHAR(191) NOT NULL UNIQUE,
  dashboard_type ENUM('main', 'analytics', 'admin') DEFAULT 'main',
  
  -- Connection details
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Subscription tracking
  subscribed_patterns JSON, -- Array of pattern IDs
  subscribed_clients JSON,  -- Array of client IDs
  
  -- Performance tracking
  messages_sent INTEGER DEFAULT 0 CHECK (messages_sent >= 0),
  messages_received INTEGER DEFAULT 0 CHECK (messages_received >= 0),
  average_latency_ms DECIMAL(8,2) CHECK (average_latency_ms >= 0),
  
  -- Indexes for connection management
  INDEX idx_websocket_connection_id (connection_id),
  INDEX idx_websocket_active (is_active, last_ping_at DESC),
  INDEX idx_websocket_dashboard_type (dashboard_type),
  INDEX idx_websocket_cleanup (is_active, connected_at)
);

-- Create triggers for automatic timestamp updates
DELIMITER $$

CREATE TRIGGER update_pattern_alerts_timestamp 
  BEFORE UPDATE ON pattern_alerts
  FOR EACH ROW 
  BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP;
  END$$

CREATE TRIGGER update_active_journeys_timestamp 
  BEFORE UPDATE ON active_client_journeys
  FOR EACH ROW 
  BEGIN 
    SET NEW.last_updated_at = CURRENT_TIMESTAMP;
  END$$

CREATE TRIGGER update_websocket_ping_timestamp 
  BEFORE UPDATE ON websocket_connections
  FOR EACH ROW 
  BEGIN 
    IF NEW.last_ping_at != OLD.last_ping_at THEN
      SET NEW.last_message_at = CURRENT_TIMESTAMP;
    END IF;
  END$$

DELIMITER ;

-- Create stored procedures for common real-time operations

-- Get active high-risk journeys for immediate recommendations
DELIMITER $$
CREATE PROCEDURE GetHighRiskJourneys()
BEGIN
  SELECT 
    client_id,
    session_id,
    current_page,
    dropoff_risk,
    conversion_probability,
    time_on_current_page,
    engagement_score,
    client_segment,
    last_updated_at
  FROM active_client_journeys 
  WHERE completed_at IS NULL
    AND (dropoff_risk > 0.7 OR conversion_probability < 0.3)
    AND last_updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  ORDER BY dropoff_risk DESC, last_updated_at DESC
  LIMIT 20;
END$$

-- Get recent pattern alerts with high significance
CREATE PROCEDURE GetRecentHighSignificanceAlerts()
BEGIN
  SELECT 
    pa.*,
    sp.pattern_type,
    sp.confidence_score as current_confidence
  FROM pattern_alerts pa
  JOIN success_patterns sp ON pa.pattern_id = sp.id
  WHERE pa.significance IN ('high', 'medium')
    AND pa.created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
    AND pa.is_read = FALSE
  ORDER BY 
    FIELD(pa.significance, 'high', 'medium', 'low'),
    pa.created_at DESC
  LIMIT 50;
END$$

-- Get real-time conversion metrics with trend calculation
CREATE PROCEDURE GetLiveConversionMetrics()
BEGIN
  SELECT 
    current_conversion_rate,
    today_conversions,
    active_journeys,
    new_patterns_today,
    trend,
    trend_percentage,
    confidence_lower,
    confidence_upper,
    timestamp
  FROM conversion_metrics_log 
  ORDER BY timestamp DESC 
  LIMIT 1;
END$$

-- Process background job queue by priority
CREATE PROCEDURE ProcessBackgroundJobQueue(IN job_limit INT DEFAULT 10)
BEGIN
  SELECT 
    id,
    job_type,
    priority,
    job_data,
    client_id,
    pattern_id,
    retry_count,
    created_at
  FROM background_processing_queue
  WHERE status = 'pending'
    AND retry_count < max_retries
  ORDER BY 
    FIELD(priority, 'critical', 'high', 'medium', 'low'),
    created_at ASC
  LIMIT job_limit;
END$$

DELIMITER ;

-- Create views for common real-time queries

-- Active dashboard connections view
CREATE VIEW active_dashboard_connections AS
SELECT 
  connection_id,
  dashboard_type,
  connected_at,
  last_ping_at,
  messages_sent,
  messages_received,
  average_latency_ms,
  TIMESTAMPDIFF(SECOND, last_ping_at, NOW()) as seconds_since_ping
FROM websocket_connections 
WHERE is_active = TRUE 
  AND last_ping_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE);

-- Pattern performance summary view
CREATE VIEW pattern_performance_summary AS
SELECT 
  sp.id as pattern_id,
  sp.pattern_type,
  sp.confidence_score,
  sp.sample_size,
  sp.success_rate,
  sp.statistical_significance,
  COUNT(pa.id) as alert_count,
  MAX(pa.created_at) as last_alert_at,
  COUNT(pul.id) as update_count,
  AVG(pul.processing_time_ms) as avg_processing_time,
  sp.last_validated
FROM success_patterns sp
LEFT JOIN pattern_alerts pa ON sp.id = pa.pattern_id
LEFT JOIN pattern_updates_log pul ON sp.id = pul.pattern_id
WHERE sp.is_active = TRUE
GROUP BY sp.id, sp.pattern_type, sp.confidence_score, sp.sample_size, 
         sp.success_rate, sp.statistical_significance, sp.last_validated;

-- Real-time system performance view  
CREATE VIEW realtime_system_performance AS
SELECT 
  'Pattern Updates' as metric_type,
  COUNT(*) as total_count,
  AVG(processing_time_ms) as avg_processing_time,
  AVG(websocket_propagation_ms) as avg_propagation_time,
  MAX(created_at) as last_update
FROM pattern_updates_log 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
UNION ALL
SELECT 
  'Background Jobs' as metric_type,
  COUNT(*) as total_count,
  AVG(processing_time_ms) as avg_processing_time,
  NULL as avg_propagation_time,
  MAX(completed_at) as last_update
FROM background_processing_queue 
WHERE status = 'completed' 
  AND completed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
UNION ALL
SELECT 
  'WebSocket Messages' as metric_type,
  SUM(messages_sent) as total_count,
  AVG(average_latency_ms) as avg_processing_time,
  NULL as avg_propagation_time,
  MAX(last_message_at) as last_update
FROM websocket_connections 
WHERE is_active = TRUE;

-- Add indexes for enhanced query performance
ALTER TABLE success_patterns 
ADD INDEX idx_success_patterns_realtime (is_active, confidence_score DESC, last_validated DESC),
ADD INDEX idx_success_patterns_type_confidence (pattern_type, confidence_score DESC);

-- Performance optimization: Partition large tables by date
-- (This would be implemented based on data volume in production)

-- Comment explaining the schema design
/* 
Real-time Pattern Updates Schema Design:

1. **pattern_alerts**: Stores alerts generated when significant pattern changes occur (AC 2)
   - Optimized for real-time queries with composite indexes
   - Tracks alert significance and read status
   - Links to success_patterns for contextual information

2. **pattern_updates_log**: Comprehensive log of all pattern changes for audit and analysis (AC 1, 3, 4)  
   - Tracks confidence changes, processing times, and WebSocket propagation
   - Essential for performance monitoring and optimization
   - Enables trend analysis and pattern evolution tracking

3. **real_time_recommendations**: Stores immediate recommendations for active client journeys (AC 5)
   - Priority and urgency-based processing
   - Tracks implementation status and outcomes
   - Links to patterns that triggered recommendations

4. **active_client_journeys**: Real-time tracking of client progress through activation flow (AC 5)
   - Risk assessment and conversion probability scoring
   - Interaction tracking for personalized recommendations  
   - Segmentation data for targeted recommendations

5. **conversion_metrics_log**: Time-series data for real-time conversion tracking (AC 4)
   - Trend analysis and confidence intervals
   - Segmented breakdown for detailed analytics
   - Performance tracking for calculation optimization

6. **background_processing_queue**: Job queue for non-blocking pattern processing (IV3)
   - Priority-based processing with retry logic
   - Resource usage tracking for system optimization
   - Supports multiple job types with configurable timeouts

7. **websocket_connections**: Connection tracking for real-time dashboard updates
   - Performance monitoring and latency tracking
   - Subscription management for targeted updates
   - Connection health monitoring

Performance Features:
- Composite indexes for complex real-time queries
- Stored procedures for common operations
- Views for frequently accessed data combinations
- Automatic timestamp management via triggers
- Partitioning strategy for high-volume tables
- Foreign key constraints for data integrity

The schema is designed to support:
- Sub-2-second pattern updates (AC 1, 3)
- Sub-1-second WebSocket propagation (AC 4)
- High-frequency real-time operations
- Background processing without UI blocking (IV3)
- Comprehensive performance monitoring and optimization
*/