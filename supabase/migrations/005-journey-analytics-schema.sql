-- Journey Analytics Schema Migration
-- Epic 4, Story 4.2: Drop-off Point Analysis
-- 
-- Creates comprehensive database schema for journey tracking, session management,
-- and drop-off pattern analysis with performance optimization.

-- ============================================================================
-- JOURNEY SESSIONS TABLE
-- ============================================================================
CREATE TABLE journey_sessions (
  id VARCHAR(191) PRIMARY KEY,
  client_id VARCHAR(191) NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER DEFAULT 0, -- in seconds
  final_outcome VARCHAR(20) DEFAULT 'in_progress' CHECK (final_outcome IN ('completed', 'dropped_off', 'in_progress')),
  exit_point VARCHAR(50), -- page where client dropped off
  exit_trigger VARCHAR(50) CHECK (exit_trigger IN ('time_based', 'content_based', 'technical', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_journey_sessions_client_id (client_id),
  INDEX idx_journey_sessions_final_outcome (final_outcome),
  INDEX idx_journey_sessions_exit_point (exit_point),
  INDEX idx_journey_sessions_session_start (session_start DESC),
  INDEX idx_journey_sessions_created_at (created_at DESC),
  
  -- Composite indexes for analytics queries
  INDEX idx_journey_sessions_outcome_created (final_outcome, created_at DESC),
  INDEX idx_journey_sessions_client_outcome (client_id, final_outcome),
  
  -- Foreign key constraints
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================================================
-- JOURNEY PAGE VISITS TABLE
-- ============================================================================
CREATE TABLE journey_page_visits (
  id VARCHAR(191) PRIMARY KEY,
  session_id VARCHAR(191) NOT NULL,
  page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('activation', 'agreement', 'confirmation', 'processing')),
  content_version_id VARCHAR(191),
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  time_on_page INTEGER DEFAULT 0, -- in seconds
  engagement_score DECIMAL(3,2) DEFAULT 0.00 CHECK (engagement_score >= 0.00 AND engagement_score <= 1.00),
  exit_action VARCHAR(20) CHECK (exit_action IN ('next_page', 'back', 'close', 'timeout', 'error')),
  scroll_depth INTEGER DEFAULT 0 CHECK (scroll_depth >= 0 AND scroll_depth <= 100), -- percentage
  interactions INTEGER DEFAULT 0 CHECK (interactions >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_journey_page_visits_session_id (session_id),
  INDEX idx_journey_page_visits_page_type (page_type),
  INDEX idx_journey_page_visits_entry_time (entry_time DESC),
  INDEX idx_journey_page_visits_time_on_page (time_on_page DESC),
  INDEX idx_journey_page_visits_engagement_score (engagement_score DESC),
  
  -- Composite indexes for analytics queries
  INDEX idx_journey_page_visits_page_engagement (page_type, engagement_score DESC),
  INDEX idx_journey_page_visits_session_page (session_id, page_type),
  INDEX idx_journey_page_visits_exit_action (exit_action, page_type),
  
  -- Foreign key constraints
  FOREIGN KEY (session_id) REFERENCES journey_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE SET NULL
);

-- ============================================================================
-- DROP-OFF PATTERNS TABLE
-- ============================================================================
CREATE TABLE drop_off_patterns (
  id VARCHAR(191) PRIMARY KEY,
  page_type VARCHAR(50) NOT NULL,
  exit_trigger VARCHAR(50) NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  avg_time_before_exit INTEGER, -- in seconds
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  associated_content JSON,
  recommendations JSON,
  identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Performance indexes
  INDEX idx_drop_off_patterns_page_type (page_type),
  INDEX idx_drop_off_patterns_frequency (frequency DESC),
  INDEX idx_drop_off_patterns_confidence_score (confidence_score DESC),
  INDEX idx_drop_off_patterns_identified_at (identified_at DESC),
  INDEX idx_drop_off_patterns_is_active (is_active),
  
  -- Composite indexes for pattern analysis
  INDEX idx_drop_off_patterns_page_trigger (page_type, exit_trigger),
  INDEX idx_drop_off_patterns_active_confidence (is_active, confidence_score DESC)
);

-- ============================================================================
-- PAGE TRANSITIONS TABLE (for flow analysis)
-- ============================================================================
CREATE TABLE journey_page_transitions (
  id VARCHAR(191) PRIMARY KEY,
  session_id VARCHAR(191) NOT NULL,
  from_page VARCHAR(50) NOT NULL,
  to_page VARCHAR(50) NOT NULL,
  transition_time INTEGER NOT NULL, -- in milliseconds
  transition_type VARCHAR(20) DEFAULT 'navigation' CHECK (transition_type IN ('navigation', 'back', 'forward', 'direct')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_journey_transitions_session_id (session_id),
  INDEX idx_journey_transitions_from_page (from_page),
  INDEX idx_journey_transitions_to_page (to_page),
  INDEX idx_journey_transitions_timestamp (timestamp DESC),
  
  -- Composite indexes for flow analysis
  INDEX idx_journey_transitions_flow (from_page, to_page),
  INDEX idx_journey_transitions_session_flow (session_id, timestamp ASC),
  
  -- Foreign key constraints
  FOREIGN KEY (session_id) REFERENCES journey_sessions(id) ON DELETE CASCADE
);

-- ============================================================================
-- REAL-TIME JOURNEY EVENTS TABLE (for live tracking)
-- ============================================================================
CREATE TABLE journey_events (
  id VARCHAR(191) PRIMARY KEY,
  session_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('page_enter', 'page_exit', 'interaction', 'scroll', 'error')),
  page_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSON,
  processed BOOLEAN DEFAULT FALSE,
  
  -- Performance indexes for real-time processing
  INDEX idx_journey_events_session_id (session_id),
  INDEX idx_journey_events_processed (processed, timestamp ASC),
  INDEX idx_journey_events_timestamp (timestamp DESC),
  INDEX idx_journey_events_event_type (event_type),
  
  -- Composite indexes for event processing
  INDEX idx_journey_events_unprocessed (processed, event_type, timestamp ASC),
  
  -- Foreign key constraints
  FOREIGN KEY (session_id) REFERENCES journey_sessions(id) ON DELETE CASCADE
);

-- ============================================================================
-- JOURNEY RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE journey_recommendations (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191),
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('content', 'timing', 'technical', 'ux')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  expected_improvement DECIMAL(5,2) CHECK (expected_improvement >= 0.00), -- percentage
  implementation_effort VARCHAR(10) CHECK (implementation_effort IN ('low', 'medium', 'high')),
  target_page VARCHAR(50) NOT NULL,
  based_on_pattern VARCHAR(191),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Performance indexes
  INDEX idx_journey_recommendations_priority (priority),
  INDEX idx_journey_recommendations_type (type),
  INDEX idx_journey_recommendations_target_page (target_page),
  INDEX idx_journey_recommendations_created_at (created_at DESC),
  INDEX idx_journey_recommendations_is_active (is_active),
  
  -- Composite indexes for recommendation queries
  INDEX idx_journey_recommendations_active_priority (is_active, priority, created_at DESC),
  INDEX idx_journey_recommendations_page_type (target_page, type),
  
  -- Foreign key constraints
  FOREIGN KEY (pattern_id) REFERENCES drop_off_patterns(id) ON DELETE SET NULL
);

-- ============================================================================
-- JOURNEY ALERTS TABLE (for real-time monitoring)
-- ============================================================================
CREATE TABLE journey_alerts (
  id VARCHAR(191) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('high_drop_off', 'low_engagement', 'technical_issue')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  affected_page VARCHAR(50) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by VARCHAR(191),
  
  -- Performance indexes
  INDEX idx_journey_alerts_type (type),
  INDEX idx_journey_alerts_severity (severity),
  INDEX idx_journey_alerts_acknowledged (acknowledged, timestamp DESC),
  INDEX idx_journey_alerts_affected_page (affected_page),
  INDEX idx_journey_alerts_timestamp (timestamp DESC),
  
  -- Composite indexes for alert management
  INDEX idx_journey_alerts_unacknowledged (acknowledged, severity, timestamp DESC),
  INDEX idx_journey_alerts_page_type (affected_page, type)
);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR MAINTENANCE
-- ============================================================================

-- Trigger to update updated_at timestamp on journey_sessions
CREATE OR REPLACE FUNCTION update_journey_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journey_sessions_updated_at
  BEFORE UPDATE ON journey_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_session_updated_at();

-- Trigger to update last_updated timestamp on drop_off_patterns
CREATE OR REPLACE FUNCTION update_drop_off_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_drop_off_patterns_updated_at
  BEFORE UPDATE ON drop_off_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_drop_off_pattern_updated_at();

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE (Analytics Aggregations)
-- ============================================================================

-- Daily journey analytics summary
CREATE MATERIALIZED VIEW journey_daily_analytics AS
SELECT 
  DATE(session_start) as analysis_date,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN final_outcome = 'completed' THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN final_outcome = 'dropped_off' THEN 1 END) as dropped_sessions,
  ROUND(
    COUNT(CASE WHEN final_outcome = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate,
  AVG(total_duration) as avg_duration_seconds,
  COUNT(DISTINCT client_id) as unique_clients
FROM journey_sessions 
WHERE session_start >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(session_start)
ORDER BY analysis_date DESC;

-- Page-level conversion analytics
CREATE MATERIALIZED VIEW page_conversion_analytics AS
SELECT 
  jpv.page_type,
  COUNT(*) as total_visits,
  COUNT(CASE WHEN js.final_outcome = 'completed' THEN 1 END) as successful_visits,
  ROUND(
    COUNT(CASE WHEN js.final_outcome = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate,
  AVG(jpv.time_on_page) as avg_time_on_page,
  AVG(jpv.engagement_score) as avg_engagement_score,
  COUNT(CASE WHEN jpv.exit_action IN ('close', 'back', 'timeout', 'error') THEN 1 END) as drop_offs
FROM journey_page_visits jpv
JOIN journey_sessions js ON jpv.session_id = js.id
WHERE jpv.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY jpv.page_type
ORDER BY conversion_rate DESC;

-- Drop-off pattern frequency analysis
CREATE MATERIALIZED VIEW drop_off_frequency_analytics AS
SELECT 
  js.exit_point as page_type,
  js.exit_trigger,
  COUNT(*) as frequency,
  AVG(jpv.time_on_page) as avg_time_before_exit,
  AVG(jpv.engagement_score) as avg_engagement_score,
  ROUND(
    COUNT(*)::DECIMAL / 
    (SELECT COUNT(*) FROM journey_sessions WHERE final_outcome = 'dropped_off' AND created_at >= CURRENT_DATE - INTERVAL '30 days') * 100, 2
  ) as percentage_of_dropoffs
FROM journey_sessions js
LEFT JOIN journey_page_visits jpv ON (
  js.id = jpv.session_id AND 
  jpv.page_type = js.exit_point AND 
  jpv.exit_time IS NOT NULL
)
WHERE js.final_outcome = 'dropped_off'
  AND js.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND js.exit_point IS NOT NULL
GROUP BY js.exit_point, js.exit_trigger
ORDER BY frequency DESC;

-- ============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh all journey analytics views
CREATE OR REPLACE FUNCTION refresh_journey_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW journey_daily_analytics;
  REFRESH MATERIALIZED VIEW page_conversion_analytics;
  REFRESH MATERIALIZED VIEW drop_off_frequency_analytics;
END;
$$ LANGUAGE plpgsql;

-- Schedule materialized view refresh (requires pg_cron extension)
-- This would be set up in production to run every hour
-- SELECT cron.schedule('refresh-journey-analytics', '0 * * * *', 'SELECT refresh_journey_analytics_views();');

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Partitioning strategy for large datasets (optional, for high-volume scenarios)
-- This creates monthly partitions for journey_sessions table

-- Enable partitioning on journey_sessions by created_at (monthly)
-- ALTER TABLE journey_sessions 
-- PARTITION BY RANGE (created_at);

-- Create partitions for current and next few months
-- This would be automated in production with a partition management system

-- ============================================================================
-- DATA RETENTION POLICIES
-- ============================================================================

-- Function to clean up old journey events (processed events older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_journey_events()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM journey_events 
  WHERE processed = true 
    AND timestamp < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old journey sessions (older than 2 years)
CREATE OR REPLACE FUNCTION archive_old_journey_sessions()
RETURNS integer AS $$
DECLARE
  archived_count integer;
BEGIN
  -- In production, this would move data to archive tables instead of deleting
  UPDATE journey_sessions 
  SET updated_at = NOW()
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND final_outcome != 'in_progress';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA VALIDATION
-- ============================================================================

-- Add constraints to ensure data quality
ALTER TABLE journey_sessions 
ADD CONSTRAINT chk_session_duration 
CHECK (total_duration >= 0);

ALTER TABLE journey_sessions 
ADD CONSTRAINT chk_session_end_after_start 
CHECK (session_end IS NULL OR session_end >= session_start);

ALTER TABLE journey_page_visits 
ADD CONSTRAINT chk_page_visit_duration 
CHECK (time_on_page >= 0);

ALTER TABLE journey_page_visits 
ADD CONSTRAINT chk_page_visit_exit_after_entry 
CHECK (exit_time IS NULL OR exit_time >= entry_time);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE journey_sessions IS 'Tracks complete client journey sessions with outcomes and performance metrics';
COMMENT ON TABLE journey_page_visits IS 'Records individual page visits within journey sessions with engagement data';
COMMENT ON TABLE drop_off_patterns IS 'Stores identified drop-off patterns with statistical confidence and recommendations';
COMMENT ON TABLE journey_page_transitions IS 'Tracks page-to-page transitions for flow analysis';
COMMENT ON TABLE journey_events IS 'Real-time event tracking for live session monitoring';
COMMENT ON TABLE journey_recommendations IS 'AI-generated recommendations for improving journey conversion rates';
COMMENT ON TABLE journey_alerts IS 'Real-time alerts for journey performance issues';

COMMENT ON MATERIALIZED VIEW journey_daily_analytics IS 'Daily aggregated journey performance metrics';
COMMENT ON MATERIALIZED VIEW page_conversion_analytics IS 'Page-level conversion and engagement statistics';
COMMENT ON MATERIALIZED VIEW drop_off_frequency_analytics IS 'Drop-off pattern frequency and timing analysis';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Journey Analytics schema migration completed successfully';
  RAISE NOTICE 'Created 7 tables, 3 materialized views, and optimization functions';
  RAISE NOTICE 'Schema is ready for Epic 4 Story 4.2 - Drop-off Point Analysis';
END $$;