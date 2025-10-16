-- Add auto-flagging support to content moderation queue
ALTER TABLE content_moderation_queue 
ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_factors JSONB,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);

-- Add index for auto-flagged content queries
CREATE INDEX IF NOT EXISTS idx_content_moderation_auto_flagged 
ON content_moderation_queue(auto_flagged, created_at);

-- Add index for risk score queries
CREATE INDEX IF NOT EXISTS idx_content_moderation_risk_score 
ON content_moderation_queue(risk_score DESC) 
WHERE auto_flagged = true;

-- Create function to get auto-flagging statistics
CREATE OR REPLACE FUNCTION get_auto_flagging_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_flagged BIGINT,
  avg_risk_score NUMERIC,
  high_risk_count BIGINT,
  medium_risk_count BIGINT,
  low_risk_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_flagged,
    COALESCE(AVG(risk_score), 0) as avg_risk_score,
    COUNT(*) FILTER (WHERE risk_score >= 70) as high_risk_count,
    COUNT(*) FILTER (WHERE risk_score >= 40 AND risk_score < 70) as medium_risk_count,
    COUNT(*) FILTER (WHERE risk_score < 40) as low_risk_count
  FROM content_moderation_queue
  WHERE auto_flagged = true
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get risk factor breakdown
CREATE OR REPLACE FUNCTION get_risk_factor_breakdown(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  risk_type TEXT,
  count BIGINT,
  avg_severity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH risk_factors_expanded AS (
    SELECT 
      jsonb_array_elements(risk_factors) as factor,
      created_at
    FROM content_moderation_queue
    WHERE auto_flagged = true
      AND risk_factors IS NOT NULL
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
  )
  SELECT 
    factor->>'type' as risk_type,
    COUNT(*) as count,
    AVG((factor->>'score')::NUMERIC) as avg_severity_score
  FROM risk_factors_expanded
  WHERE factor->>'type' IS NOT NULL
  GROUP BY factor->>'type'
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins will be checked at app level)
GRANT EXECUTE ON FUNCTION get_auto_flagging_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_factor_breakdown(INTEGER) TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN content_moderation_queue.auto_flagged IS 'Whether this content was automatically flagged by the system';
COMMENT ON COLUMN content_moderation_queue.risk_score IS 'Calculated risk score (0-100) from automated analysis';
COMMENT ON COLUMN content_moderation_queue.risk_factors IS 'JSON array of risk factors identified during analysis';
COMMENT ON COLUMN content_moderation_queue.confidence IS 'Confidence level (0.0-1.0) in the risk assessment';