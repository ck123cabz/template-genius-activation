-- Migration: Success Pattern Recognition Schema
-- Epic 4, Story 4.1: Success Pattern Identification
-- Purpose: Create tables for automated pattern recognition and analysis

-- Success Patterns Table - Core pattern storage
CREATE TABLE success_patterns (
  id VARCHAR(191) PRIMARY KEY,
  pattern_type ENUM('hypothesis', 'content-element', 'timing', 'mixed') NOT NULL,
  pattern_data JSON NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1), 
  sample_size INTEGER NOT NULL CHECK (sample_size >= 3), -- Minimum 3 for pattern identification
  success_rate DECIMAL(5,4) NOT NULL CHECK (success_rate >= 0 AND success_rate <= 1),
  statistical_significance DECIMAL(10,8), -- P-value for pattern validity
  identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_validated DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Performance indexes
  INDEX idx_pattern_type (pattern_type),
  INDEX idx_confidence_score (confidence_score DESC),
  INDEX idx_success_rate (success_rate DESC),
  INDEX idx_identified_at (identified_at),
  INDEX idx_active_patterns (is_active, confidence_score DESC)
);

-- Pattern Elements Table - Content element analysis
CREATE TABLE pattern_elements (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  element_type ENUM('headline', 'pricing', 'benefit', 'feature', 'cta', 'testimonial', 'social-proof') NOT NULL,
  element_content TEXT NOT NULL,
  element_hash VARCHAR(64) NOT NULL, -- For similarity matching via SHA-256
  success_count INTEGER DEFAULT 0 CHECK (success_count >= 0),
  total_count INTEGER DEFAULT 0 CHECK (total_count >= 0),
  success_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN total_count > 0 THEN success_count / total_count ELSE 0 END
  ) STORED,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Performance indexes
  INDEX idx_pattern_elements (pattern_id),
  INDEX idx_element_type (element_type),
  INDEX idx_element_hash (element_hash),
  INDEX idx_success_rate (success_rate DESC),
  INDEX idx_element_performance (element_type, success_rate DESC),
  
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern Recommendations Table - AI-generated recommendations
CREATE TABLE pattern_recommendations (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  recommendation_type ENUM('content', 'hypothesis', 'ab-test', 'timing-optimization') NOT NULL,
  recommendation_data JSON NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  expected_improvement DECIMAL(5,4), -- Expected conversion improvement percentage
  priority_score INTEGER DEFAULT 1 CHECK (priority_score >= 1 AND priority_score <= 10), -- 1=lowest, 10=highest
  target_client_segments JSON, -- Applicable client types/industries
  validation_data JSON, -- A/B test results or validation metrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- Recommendations can expire
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- Track recommendation usage
  success_count INTEGER DEFAULT 0, -- Track successful applications
  
  -- Performance indexes
  INDEX idx_pattern_recommendations (pattern_id),
  INDEX idx_recommendation_type (recommendation_type),
  INDEX idx_confidence_score (confidence_score DESC),
  INDEX idx_priority_score (priority_score DESC),
  INDEX idx_active_recommendations (is_active, priority_score DESC),
  INDEX idx_expiry (expires_at),
  
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern Analytics Table - Track pattern performance over time
CREATE TABLE pattern_analytics (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  analytics_date DATE NOT NULL,
  daily_success_count INTEGER DEFAULT 0,
  daily_total_count INTEGER DEFAULT 0,
  daily_success_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN daily_total_count > 0 THEN daily_success_count / daily_total_count ELSE 0 END
  ) STORED,
  confidence_score DECIMAL(3,2),
  trend_indicator ENUM('improving', 'declining', 'stable') DEFAULT 'stable',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance indexes
  INDEX idx_pattern_analytics (pattern_id, analytics_date),
  INDEX idx_analytics_date (analytics_date),
  INDEX idx_daily_performance (daily_success_rate DESC),
  INDEX idx_trend_indicator (trend_indicator),
  
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pattern_date (pattern_id, analytics_date)
);

-- Pattern Similarity Mapping - For clustering similar patterns
CREATE TABLE pattern_similarities (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id_1 VARCHAR(191) NOT NULL,
  pattern_id_2 VARCHAR(191) NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_type ENUM('content', 'hypothesis', 'outcome', 'timing') NOT NULL,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance indexes
  INDEX idx_similarity_pattern1 (pattern_id_1),
  INDEX idx_similarity_pattern2 (pattern_id_2),
  INDEX idx_similarity_score (similarity_score DESC),
  INDEX idx_similarity_type (similarity_type),
  
  FOREIGN KEY (pattern_id_1) REFERENCES success_patterns(id) ON DELETE CASCADE,
  FOREIGN KEY (pattern_id_2) REFERENCES success_patterns(id) ON DELETE CASCADE,
  
  -- Ensure no duplicate similarities (A-B = B-A)
  CONSTRAINT check_pattern_order CHECK (pattern_id_1 < pattern_id_2),
  UNIQUE KEY unique_pattern_pair (pattern_id_1, pattern_id_2, similarity_type)
);

-- Background Job Queue - For async pattern processing
CREATE TABLE pattern_processing_queue (
  id VARCHAR(191) PRIMARY KEY,
  job_type ENUM('pattern-detection', 'confidence-recalc', 'recommendation-generation', 'similarity-analysis') NOT NULL,
  job_data JSON NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1=lowest, 10=highest
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Performance indexes
  INDEX idx_job_status (status),
  INDEX idx_job_priority (priority DESC, created_at),
  INDEX idx_job_type (job_type),
  INDEX idx_pending_jobs (status, priority DESC),
  INDEX idx_retry_jobs (status, retry_count, max_retries)
);

-- Create indexes for cross-table queries
CREATE INDEX idx_content_versions_client_outcome ON content_versions(client_id, created_at) 
  WHERE EXISTS (
    SELECT 1 FROM client_learning_data cld 
    WHERE cld.client_id = content_versions.client_id 
    AND cld.outcome IS NOT NULL
  );

-- Create view for high-confidence patterns
CREATE VIEW high_confidence_patterns AS
SELECT 
  sp.*,
  COUNT(pe.id) as element_count,
  AVG(pe.success_rate) as avg_element_success_rate,
  COUNT(pr.id) as recommendation_count
FROM success_patterns sp
LEFT JOIN pattern_elements pe ON sp.id = pe.pattern_id
LEFT JOIN pattern_recommendations pr ON sp.id = pr.pattern_id AND pr.is_active = true
WHERE sp.is_active = true 
  AND sp.confidence_score >= 0.7 
  AND sp.sample_size >= 5
GROUP BY sp.id
ORDER BY sp.confidence_score DESC, sp.success_rate DESC;

-- Create view for pattern performance trends
CREATE VIEW pattern_performance_trends AS
SELECT 
  sp.id as pattern_id,
  sp.pattern_type,
  sp.confidence_score,
  pa.analytics_date,
  pa.daily_success_rate,
  pa.trend_indicator,
  LAG(pa.daily_success_rate) OVER (PARTITION BY sp.id ORDER BY pa.analytics_date) as previous_success_rate,
  (pa.daily_success_rate - LAG(pa.daily_success_rate) OVER (PARTITION BY sp.id ORDER BY pa.analytics_date)) as success_rate_change
FROM success_patterns sp
JOIN pattern_analytics pa ON sp.id = pa.pattern_id
WHERE sp.is_active = true
ORDER BY sp.id, pa.analytics_date DESC;

-- Insert initial system patterns for bootstrapping (optional)
INSERT INTO success_patterns (id, pattern_type, pattern_data, confidence_score, sample_size, success_rate, statistical_significance) VALUES
('bootstrap-pattern-001', 'hypothesis', '{"hypothesis": "Clear value proposition in headline increases conversion", "contextFactors": {"applicableIndustries": ["all"]}}', 0.75, 10, 0.8, 0.05),
('bootstrap-pattern-002', 'content-element', '{"contentElements": {"pricing": {"presentation": "prominently displayed"}, "benefits": ["immediate value", "clear ROI"]}}', 0.70, 8, 0.75, 0.08);

-- Create triggers for automatic analytics updates
DELIMITER //
CREATE TRIGGER update_pattern_analytics
AFTER INSERT ON client_learning_data
FOR EACH ROW
BEGIN
  -- This will be handled by application code for better error handling
  -- Trigger placeholder for future optimization
END //
DELIMITER ;

-- Comments for documentation
ALTER TABLE success_patterns COMMENT = 'Stores identified success patterns with confidence scoring and statistical validation';
ALTER TABLE pattern_elements COMMENT = 'Tracks individual content elements and their performance metrics';
ALTER TABLE pattern_recommendations COMMENT = 'AI-generated recommendations based on successful patterns';
ALTER TABLE pattern_analytics COMMENT = 'Daily analytics tracking for pattern performance over time';
ALTER TABLE pattern_similarities COMMENT = 'Maps similarities between patterns for clustering and analysis';
ALTER TABLE pattern_processing_queue COMMENT = 'Background job queue for async pattern processing tasks';