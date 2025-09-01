-- Journey Comparison Schema Migration
-- Epic 5, Story 5.1: Journey Comparison Analysis
-- 
-- Creates comprehensive database schema for journey comparison analysis,
-- content diff tracking, hypothesis correlations, and statistical significance testing.

-- ============================================================================
-- JOURNEY COMPARISONS TABLE
-- ============================================================================
CREATE TABLE journey_comparisons (
  id VARCHAR(191) PRIMARY KEY,
  successful_journey_id VARCHAR(191) NOT NULL,
  failed_journey_id VARCHAR(191) NOT NULL,
  comparison_type ENUM('content_focused', 'timing_focused', 'engagement_focused', 'comprehensive') DEFAULT 'comprehensive',
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  statistical_significance DECIMAL(10,8), -- p-value
  effect_size DECIMAL(5,3), -- Cohen's d or similar effect size measure
  statistical_power DECIMAL(3,2) CHECK (statistical_power >= 0.00 AND statistical_power <= 1.00),
  sample_size INTEGER NOT NULL DEFAULT 2,
  processing_time INTEGER, -- milliseconds
  analysis_version VARCHAR(20) DEFAULT '5.1.0',
  comparison_metadata JSON, -- Additional metadata including algorithm config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  
  -- Performance indexes
  INDEX idx_journey_comparisons_successful (successful_journey_id),
  INDEX idx_journey_comparisons_failed (failed_journey_id),
  INDEX idx_journey_comparisons_confidence (confidence_score DESC),
  INDEX idx_journey_comparisons_significance (statistical_significance ASC),
  INDEX idx_journey_comparisons_type (comparison_type),
  INDEX idx_journey_comparisons_created (created_at DESC),
  
  -- Composite indexes for analytics queries
  INDEX idx_journey_comparisons_type_confidence (comparison_type, confidence_score DESC),
  INDEX idx_journey_comparisons_significance_effect (statistical_significance ASC, effect_size DESC),
  
  -- Foreign key constraints
  FOREIGN KEY (successful_journey_id) REFERENCES journey_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (failed_journey_id) REFERENCES journey_sessions(id) ON DELETE CASCADE,
  
  -- Prevent duplicate comparisons
  UNIQUE KEY unique_journey_pair (successful_journey_id, failed_journey_id, comparison_type)
);

-- ============================================================================
-- CONTENT DIFFERENCES TABLE
-- ============================================================================
CREATE TABLE content_diffs (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  page_type ENUM('activation', 'agreement', 'confirmation', 'processing') NOT NULL,
  change_type ENUM('text_change', 'structural_change', 'element_addition', 'element_removal') NOT NULL,
  diff_category ENUM('headline', 'pricing', 'benefits', 'features', 'cta', 'testimonials', 'social_proof', 'layout') NOT NULL,
  successful_content_id VARCHAR(191), -- Reference to content_versions table
  failed_content_id VARCHAR(191), -- Reference to content_versions table
  diff_details JSON NOT NULL, -- Detailed diff information
  impact_score DECIMAL(3,2) NOT NULL CHECK (impact_score >= 0.00 AND impact_score <= 1.00),
  correlation_strength DECIMAL(3,2) NOT NULL CHECK (correlation_strength >= 0.00 AND correlation_strength <= 1.00),
  semantic_similarity DECIMAL(3,2) CHECK (semantic_similarity >= 0.00 AND semantic_similarity <= 1.00),
  structural_similarity DECIMAL(3,2) CHECK (structural_similarity >= 0.00 AND structural_similarity <= 1.00),
  visual_diff_data JSON, -- Visual difference information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_content_diffs_comparison (comparison_id),
  INDEX idx_content_diffs_page_type (page_type),
  INDEX idx_content_diffs_change_type (change_type),
  INDEX idx_content_diffs_category (diff_category),
  INDEX idx_content_diffs_impact (impact_score DESC),
  INDEX idx_content_diffs_correlation (correlation_strength DESC),
  
  -- Composite indexes for analytics
  INDEX idx_content_diffs_type_impact (change_type, impact_score DESC),
  INDEX idx_content_diffs_category_correlation (diff_category, correlation_strength DESC),
  INDEX idx_content_diffs_page_impact (page_type, impact_score DESC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE,
  FOREIGN KEY (successful_content_id) REFERENCES content_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (failed_content_id) REFERENCES content_versions(id) ON DELETE SET NULL
);

-- ============================================================================
-- TIMING DIFFERENCES TABLE
-- ============================================================================
CREATE TABLE timing_diffs (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  page_type ENUM('activation', 'agreement', 'confirmation', 'processing') NOT NULL,
  successful_avg_time INTEGER NOT NULL, -- seconds
  failed_avg_time INTEGER NOT NULL, -- seconds
  time_differential INTEGER NOT NULL, -- seconds (successful - failed)
  engagement_differential DECIMAL(4,2), -- engagement score difference
  interaction_differential INTEGER, -- interaction count difference
  scroll_depth_differential INTEGER, -- scroll depth percentage difference
  statistical_significance DECIMAL(10,8), -- p-value for timing difference
  t_statistic DECIMAL(8,4), -- t-test statistic
  degrees_of_freedom INTEGER,
  effect_size DECIMAL(5,3), -- Cohen's d
  confidence_interval_lower DECIMAL(8,4),
  confidence_interval_upper DECIMAL(8,4),
  test_type VARCHAR(50) DEFAULT 'welch_t_test',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_timing_diffs_comparison (comparison_id),
  INDEX idx_timing_diffs_page_type (page_type),
  INDEX idx_timing_diffs_differential (ABS(time_differential) DESC),
  INDEX idx_timing_diffs_significance (statistical_significance ASC),
  INDEX idx_timing_diffs_effect_size (ABS(effect_size) DESC),
  
  -- Composite indexes
  INDEX idx_timing_diffs_page_significance (page_type, statistical_significance ASC),
  INDEX idx_timing_diffs_effect_significance (ABS(effect_size) DESC, statistical_significance ASC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- ENGAGEMENT DIFFERENCES TABLE
-- ============================================================================
CREATE TABLE engagement_diffs (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  page_type ENUM('activation', 'agreement', 'confirmation', 'processing') NOT NULL,
  successful_engagement_score DECIMAL(3,2) NOT NULL,
  failed_engagement_score DECIMAL(3,2) NOT NULL,
  engagement_differential DECIMAL(4,2) NOT NULL,
  successful_scroll_depth INTEGER,
  failed_scroll_depth INTEGER,
  successful_interaction_count INTEGER,
  failed_interaction_count INTEGER,
  successful_time_on_page INTEGER, -- seconds
  failed_time_on_page INTEGER, -- seconds
  statistical_significance DECIMAL(10,8), -- p-value
  z_score DECIMAL(6,3),
  chi_square_statistic DECIMAL(8,4),
  effect_size DECIMAL(5,3),
  confidence_interval_lower DECIMAL(4,2),
  confidence_interval_upper DECIMAL(4,2),
  test_type VARCHAR(50) DEFAULT 'z_test',
  interaction_patterns JSON, -- Detailed interaction pattern differences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_engagement_diffs_comparison (comparison_id),
  INDEX idx_engagement_diffs_page_type (page_type),
  INDEX idx_engagement_diffs_differential (ABS(engagement_differential) DESC),
  INDEX idx_engagement_diffs_significance (statistical_significance ASC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- HYPOTHESIS CORRELATIONS TABLE
-- ============================================================================
CREATE TABLE hypothesis_correlations (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  successful_hypothesis TEXT NOT NULL,
  failed_hypothesis TEXT NOT NULL,
  hypothesis_similarity DECIMAL(3,2), -- 0-1 semantic similarity
  correlation_strength DECIMAL(3,2) NOT NULL CHECK (correlation_strength >= 0.00 AND correlation_strength <= 1.00),
  causality_score DECIMAL(3,2) CHECK (causality_score >= 0.00 AND causality_score <= 1.00),
  confidence_interval_lower DECIMAL(4,2),
  confidence_interval_upper DECIMAL(4,2),
  sample_size INTEGER NOT NULL,
  statistical_significance DECIMAL(10,8), -- p-value
  correlation_coefficient DECIMAL(6,4), -- Pearson correlation coefficient
  hypothesis_diff_data JSON, -- Detailed hypothesis difference analysis
  outcome_correlation_data JSON, -- Outcome correlation details
  validation_metrics JSON, -- Validation accuracy, precision, recall
  temporal_analysis JSON, -- Temporal relationship analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_hypothesis_correlations_comparison (comparison_id),
  INDEX idx_hypothesis_correlations_strength (correlation_strength DESC),
  INDEX idx_hypothesis_correlations_causality (causality_score DESC),
  INDEX idx_hypothesis_correlations_significance (statistical_significance ASC),
  INDEX idx_hypothesis_correlations_sample_size (sample_size DESC),
  
  -- Text indexes for hypothesis search
  FULLTEXT INDEX idx_hypothesis_correlations_successful_text (successful_hypothesis),
  FULLTEXT INDEX idx_hypothesis_correlations_failed_text (failed_hypothesis),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- COMPARISON RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE comparison_recommendations (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  category ENUM('content_optimization', 'timing_adjustment', 'engagement_enhancement', 'hypothesis_refinement') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  expected_impact DECIMAL(3,2) CHECK (expected_impact >= 0.00 AND expected_impact <= 1.00),
  implementation_effort ENUM('low', 'medium', 'high') DEFAULT 'medium',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  action_items JSON, -- Array of specific action items
  supporting_evidence JSON, -- Evidence supporting this recommendation
  validation_suggestions JSON, -- A/B testing and validation approaches
  estimated_duration INTEGER, -- days to implement
  dependencies JSON, -- Array of dependencies
  success_metrics JSON, -- How to measure success
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
  
  -- Performance indexes
  INDEX idx_comparison_recommendations_comparison (comparison_id),
  INDEX idx_comparison_recommendations_priority (priority),
  INDEX idx_comparison_recommendations_category (category),
  INDEX idx_comparison_recommendations_impact (expected_impact DESC),
  INDEX idx_comparison_recommendations_confidence (confidence_score DESC),
  INDEX idx_comparison_recommendations_status (status),
  INDEX idx_comparison_recommendations_created (created_at DESC),
  
  -- Composite indexes
  INDEX idx_comparison_recommendations_priority_impact (priority, expected_impact DESC),
  INDEX idx_comparison_recommendations_category_priority (category, priority),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- COMPARISON INSIGHTS TABLE
-- ============================================================================
CREATE TABLE comparison_insights (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  insight_type ENUM('primary_differentiator', 'success_factor', 'failure_indicator', 'pattern_match', 'anomaly') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact_score DECIMAL(3,2) CHECK (impact_score >= 0.00 AND impact_score <= 1.00),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
  statistical_significance DECIMAL(10,8),
  supporting_data JSON, -- Data supporting this insight
  related_pages JSON, -- Pages where this insight applies
  frequency_score DECIMAL(3,2), -- How often this insight appears
  uniqueness_score DECIMAL(3,2), -- How unique/novel this insight is
  actionability_score DECIMAL(3,2), -- How actionable this insight is
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_comparison_insights_comparison (comparison_id),
  INDEX idx_comparison_insights_type (insight_type),
  INDEX idx_comparison_insights_impact (impact_score DESC),
  INDEX idx_comparison_insights_confidence (confidence_score DESC),
  INDEX idx_comparison_insights_significance (statistical_significance ASC),
  
  -- Composite indexes
  INDEX idx_comparison_insights_type_impact (insight_type, impact_score DESC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- STATISTICAL EVIDENCE TABLE
-- ============================================================================
CREATE TABLE statistical_evidence (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  evidence_type ENUM('correlation', 'causality', 'significance', 'effect_size', 'confidence_interval') NOT NULL,
  component ENUM('overall', 'content', 'timing', 'engagement', 'hypothesis') NOT NULL,
  test_name VARCHAR(100), -- e.g., 'welch_t_test', 'chi_square', 'fisher_exact'
  test_statistic DECIMAL(10,6),
  p_value DECIMAL(12,10),
  effect_size DECIMAL(6,4),
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  confidence_interval_lower DECIMAL(10,6),
  confidence_interval_upper DECIMAL(10,6),
  degrees_of_freedom INTEGER,
  sample_size INTEGER,
  assumptions_met JSON, -- Which statistical assumptions were met
  methodology TEXT, -- Description of statistical methodology used
  interpretation TEXT, -- Human-readable interpretation of results
  limitations TEXT, -- Known limitations of this analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_statistical_evidence_comparison (comparison_id),
  INDEX idx_statistical_evidence_type (evidence_type),
  INDEX idx_statistical_evidence_component (component),
  INDEX idx_statistical_evidence_p_value (p_value ASC),
  INDEX idx_statistical_evidence_effect_size (ABS(effect_size) DESC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE
);

-- ============================================================================
-- COMPARISON PERFORMANCE METRICS TABLE
-- ============================================================================
CREATE TABLE comparison_performance_metrics (
  id VARCHAR(191) PRIMARY KEY,
  comparison_id VARCHAR(191) NOT NULL,
  processing_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  processing_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_processing_time INTEGER NOT NULL, -- milliseconds
  content_analysis_time INTEGER, -- milliseconds
  timing_analysis_time INTEGER, -- milliseconds
  engagement_analysis_time INTEGER, -- milliseconds
  statistical_analysis_time INTEGER, -- milliseconds
  cache_hit BOOLEAN DEFAULT FALSE,
  cache_key VARCHAR(255),
  memory_usage_mb DECIMAL(8,2),
  cpu_usage_percent DECIMAL(5,2),
  database_queries INTEGER,
  database_query_time INTEGER, -- milliseconds
  background_processing BOOLEAN DEFAULT FALSE,
  queue_wait_time INTEGER, -- milliseconds if queued
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  optimization_applied JSON, -- Which optimizations were used
  performance_grade ENUM('A', 'B', 'C', 'D', 'F') DEFAULT 'C',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_comparison_performance_comparison (comparison_id),
  INDEX idx_comparison_performance_processing_time (total_processing_time ASC),
  INDEX idx_comparison_performance_cache_hit (cache_hit),
  INDEX idx_comparison_performance_grade (performance_grade),
  INDEX idx_comparison_performance_created (created_at DESC),
  
  -- Foreign key constraints
  FOREIGN KEY (comparison_id) REFERENCES journey_comparisons(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate performance records
  UNIQUE KEY unique_comparison_performance (comparison_id)
);

-- ============================================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- ============================================================================

-- View for comparison summary statistics
CREATE VIEW comparison_summary_stats AS
SELECT 
  jc.id,
  jc.comparison_type,
  jc.confidence_score,
  jc.statistical_significance,
  jc.effect_size,
  jc.sample_size,
  COUNT(cd.id) as content_differences_count,
  COUNT(td.id) as timing_differences_count,
  COUNT(ed.id) as engagement_differences_count,
  COUNT(hc.id) as hypothesis_correlations_count,
  COUNT(cr.id) as recommendations_count,
  AVG(cd.impact_score) as avg_content_impact,
  AVG(td.effect_size) as avg_timing_effect,
  AVG(ed.effect_size) as avg_engagement_effect,
  AVG(hc.correlation_strength) as avg_hypothesis_correlation,
  jc.created_at
FROM journey_comparisons jc
LEFT JOIN content_diffs cd ON jc.id = cd.comparison_id
LEFT JOIN timing_diffs td ON jc.id = td.comparison_id  
LEFT JOIN engagement_diffs ed ON jc.id = ed.comparison_id
LEFT JOIN hypothesis_correlations hc ON jc.id = hc.comparison_id
LEFT JOIN comparison_recommendations cr ON jc.id = cr.comparison_id
GROUP BY jc.id;

-- View for high-impact findings
CREATE VIEW high_impact_findings AS
SELECT 
  jc.id as comparison_id,
  jc.comparison_type,
  jc.confidence_score,
  'content' as finding_type,
  cd.diff_category as category,
  cd.page_type,
  cd.impact_score as impact,
  cd.correlation_strength as strength,
  cd.change_type as change_description
FROM journey_comparisons jc
JOIN content_diffs cd ON jc.id = cd.comparison_id
WHERE cd.impact_score >= 0.7

UNION ALL

SELECT 
  jc.id as comparison_id,
  jc.comparison_type,
  jc.confidence_score,
  'timing' as finding_type,
  'timing' as category,
  td.page_type,
  LEAST(ABS(td.effect_size), 1.0) as impact,
  CASE WHEN td.statistical_significance < 0.05 THEN 0.8 ELSE 0.4 END as strength,
  CONCAT('Time differential: ', td.time_differential, 's') as change_description
FROM journey_comparisons jc
JOIN timing_diffs td ON jc.id = td.comparison_id
WHERE ABS(td.effect_size) >= 0.5

UNION ALL

SELECT 
  jc.id as comparison_id,
  jc.comparison_type, 
  jc.confidence_score,
  'engagement' as finding_type,
  'engagement' as category,
  ed.page_type,
  LEAST(ABS(ed.effect_size), 1.0) as impact,
  CASE WHEN ed.statistical_significance < 0.05 THEN 0.8 ELSE 0.4 END as strength,
  CONCAT('Engagement differential: ', ed.engagement_differential) as change_description
FROM journey_comparisons jc
JOIN engagement_diffs ed ON jc.id = ed.comparison_id
WHERE ABS(ed.engagement_differential) >= 0.3;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update journey_comparisons.updated_at when related records change
DELIMITER $$

CREATE TRIGGER update_comparison_timestamp_on_content_diff
    AFTER INSERT ON content_diffs
    FOR EACH ROW
BEGIN
    UPDATE journey_comparisons 
    SET updated_at = NOW() 
    WHERE id = NEW.comparison_id;
END$$

CREATE TRIGGER update_comparison_timestamp_on_timing_diff
    AFTER INSERT ON timing_diffs
    FOR EACH ROW
BEGIN
    UPDATE journey_comparisons 
    SET updated_at = NOW() 
    WHERE id = NEW.comparison_id;
END$$

CREATE TRIGGER update_comparison_timestamp_on_engagement_diff
    AFTER INSERT ON engagement_diffs
    FOR EACH ROW
BEGIN
    UPDATE journey_comparisons 
    SET updated_at = NOW() 
    WHERE id = NEW.comparison_id;
END$$

CREATE TRIGGER update_comparison_timestamp_on_hypothesis_correlation
    AFTER INSERT ON hypothesis_correlations
    FOR EACH ROW
BEGIN
    UPDATE journey_comparisons 
    SET updated_at = NOW() 
    WHERE id = NEW.comparison_id;
END$$

DELIMITER ;

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Create indexes for optimal performance
-- (Additional indexes may be created based on query patterns)

-- Insert initial configuration data if needed
-- (This would typically be done through application code)

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions to application user
-- (Specific grants would be configured based on your security requirements)
-- Example:
-- GRANT SELECT, INSERT, UPDATE ON journey_comparisons TO 'app_user'@'%';
-- GRANT SELECT, INSERT ON content_diffs TO 'app_user'@'%';
-- etc.

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================

-- 1. All foreign keys cascade on delete to maintain referential integrity
-- 2. JSON columns store complex data structures for flexibility
-- 3. Decimal precision chosen to balance storage and accuracy for statistical values
-- 4. Indexes optimized for common query patterns in comparison analysis
-- 5. Views provide convenient access to aggregated data
-- 6. Triggers maintain data consistency automatically
-- 7. FULLTEXT indexes on hypothesis text for search functionality
-- 8. Performance metrics table enables monitoring and optimization
-- 9. Statistical evidence table provides audit trail for all statistical tests
-- 10. ENUM values constrain data to valid options and improve query performance