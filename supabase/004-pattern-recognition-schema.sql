-- Story 4.1: Success Pattern Identification - Database Schema Migration
-- Creates tables for pattern recognition, confidence scoring, and recommendation engine

-- Success Patterns Table - Stores identified conversion patterns
CREATE TABLE success_patterns (
  id VARCHAR(191) PRIMARY KEY,
  pattern_type ENUM('hypothesis', 'content-element', 'timing', 'mixed') NOT NULL,
  pattern_data JSON NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  success_rate DECIMAL(5,4) NOT NULL CHECK (success_rate >= 0 AND success_rate <= 1),
  statistical_significance DECIMAL(10,8), -- P-value for pattern validity
  identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_validated DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Indexes for efficient pattern queries
  INDEX idx_pattern_type (pattern_type),
  INDEX idx_confidence_score (confidence_score DESC),
  INDEX idx_identified_at (identified_at),
  INDEX idx_active_patterns (is_active, confidence_score DESC)
);

-- Pattern Elements Table - Stores individual content elements for pattern analysis
CREATE TABLE pattern_elements (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  element_type ENUM('headline', 'pricing', 'benefit', 'feature', 'cta', 'testimonial', 'social-proof') NOT NULL,
  element_content TEXT NOT NULL,
  element_hash VARCHAR(64) NOT NULL, -- For similarity matching using content hash
  success_count INTEGER DEFAULT 0 CHECK (success_count >= 0),
  total_count INTEGER DEFAULT 0 CHECK (total_count >= 0),
  success_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN total_count > 0 THEN success_count / total_count ELSE 0 END
  ) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for efficient element queries
  INDEX idx_pattern_elements (pattern_id),
  INDEX idx_element_type (element_type),
  INDEX idx_element_hash (element_hash),
  INDEX idx_success_rate (success_rate DESC),
  INDEX idx_element_performance (element_type, success_rate DESC),
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern Recommendations Table - Stores AI-generated recommendations based on patterns
CREATE TABLE pattern_recommendations (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  recommendation_type ENUM('content', 'hypothesis', 'ab-test', 'timing') NOT NULL,
  recommendation_data JSON NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  expected_improvement DECIMAL(5,4), -- Expected conversion rate improvement
  target_audience TEXT, -- Client industry or segment
  use_count INTEGER DEFAULT 0, -- Track recommendation usage
  success_count INTEGER DEFAULT 0, -- Track recommendation success
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,
  is_active BOOLEAN DEFAULT true,
  
  -- Indexes for efficient recommendation queries
  INDEX idx_pattern_recommendations (pattern_id),
  INDEX idx_recommendation_type (recommendation_type),
  INDEX idx_confidence_score (confidence_score DESC),
  INDEX idx_active_recommendations (is_active, confidence_score DESC),
  INDEX idx_recommendation_performance (use_count DESC, success_count DESC),
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern Similarity Cache - Pre-computed similarity scores for performance optimization
CREATE TABLE pattern_similarity_cache (
  id VARCHAR(191) PRIMARY KEY,
  pattern1_id VARCHAR(191) NOT NULL,
  pattern2_id VARCHAR(191) NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_type ENUM('content', 'hypothesis', 'timing', 'outcome') NOT NULL,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique pattern pairs
  UNIQUE KEY unique_pattern_pairs (pattern1_id, pattern2_id, similarity_type),
  INDEX idx_similarity_score (similarity_score DESC),
  INDEX idx_pattern1_similarity (pattern1_id, similarity_score DESC),
  INDEX idx_pattern2_similarity (pattern2_id, similarity_score DESC),
  FOREIGN KEY (pattern1_id) REFERENCES success_patterns(id) ON DELETE CASCADE,
  FOREIGN KEY (pattern2_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Pattern Performance Metrics - Track pattern effectiveness over time
CREATE TABLE pattern_performance_metrics (
  id VARCHAR(191) PRIMARY KEY,
  pattern_id VARCHAR(191) NOT NULL,
  metric_date DATE NOT NULL,
  applications_count INTEGER DEFAULT 0,
  successes_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE WHEN applications_count > 0 THEN successes_count / applications_count ELSE 0 END
  ) STORED,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  avg_time_to_conversion INTEGER, -- Average time in seconds
  
  -- Ensure unique pattern-date combinations
  UNIQUE KEY unique_pattern_date (pattern_id, metric_date),
  INDEX idx_pattern_metrics (pattern_id, metric_date DESC),
  INDEX idx_conversion_performance (conversion_rate DESC, metric_date DESC),
  INDEX idx_revenue_performance (revenue_generated DESC, metric_date DESC),
  FOREIGN KEY (pattern_id) REFERENCES success_patterns(id) ON DELETE CASCADE
);

-- Views for common pattern queries

-- High confidence patterns view
CREATE VIEW high_confidence_patterns AS
SELECT 
  sp.*,
  COUNT(pr.id) as recommendation_count,
  AVG(ppm.conversion_rate) as avg_conversion_rate,
  SUM(ppm.revenue_generated) as total_revenue_generated
FROM success_patterns sp
LEFT JOIN pattern_recommendations pr ON sp.id = pr.pattern_id AND pr.is_active = true
LEFT JOIN pattern_performance_metrics ppm ON sp.id = ppm.pattern_id
WHERE sp.confidence_score > 0.8 AND sp.is_active = true
GROUP BY sp.id
ORDER BY sp.confidence_score DESC, sp.success_rate DESC;

-- Top performing elements view  
CREATE VIEW top_performing_elements AS
SELECT 
  pe.*,
  sp.pattern_type,
  sp.confidence_score as pattern_confidence,
  COUNT(pr.id) as recommendation_count
FROM pattern_elements pe
JOIN success_patterns sp ON pe.pattern_id = sp.id
LEFT JOIN pattern_recommendations pr ON sp.id = pr.pattern_id AND pr.is_active = true
WHERE pe.success_rate > 0.7 AND pe.total_count >= 3 AND sp.is_active = true
GROUP BY pe.id
ORDER BY pe.success_rate DESC, pe.total_count DESC;

-- Pattern recommendations with performance view
CREATE VIEW pattern_recommendations_with_performance AS
SELECT 
  pr.*,
  sp.pattern_type,
  sp.confidence_score as pattern_confidence,
  sp.success_rate as pattern_success_rate,
  CASE 
    WHEN pr.use_count > 0 THEN pr.success_count / pr.use_count 
    ELSE NULL 
  END as recommendation_success_rate
FROM pattern_recommendations pr
JOIN success_patterns sp ON pr.pattern_id = sp.id
WHERE pr.is_active = true AND sp.is_active = true
ORDER BY pr.confidence_score DESC, pr.expected_improvement DESC;

-- Add indexes for views performance
CREATE INDEX idx_patterns_confidence_active ON success_patterns(confidence_score DESC, is_active);
CREATE INDEX idx_elements_performance_active ON pattern_elements(success_rate DESC, total_count DESC);
CREATE INDEX idx_recommendations_active_performance ON pattern_recommendations(is_active, confidence_score DESC, expected_improvement DESC);

COMMIT;