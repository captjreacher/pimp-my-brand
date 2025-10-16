-- Admin Analytics System Migration
-- Creates tables and functions for collecting and aggregating admin dashboard metrics

-- Create admin metrics collection table
CREATE TABLE IF NOT EXISTS admin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for efficient querying
  INDEX idx_admin_metrics_type_name (metric_type, metric_name),
  INDEX idx_admin_metrics_collected_at (collected_at),
  INDEX idx_admin_metrics_type_time (metric_type, collected_at)
);

-- Create system health metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(200),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  user_agent TEXT,
  ip_address INET,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance monitoring
  INDEX idx_system_health_endpoint (endpoint),
  INDEX idx_system_health_recorded_at (recorded_at),
  INDEX idx_system_health_status (status_code),
  INDEX idx_system_health_endpoint_time (endpoint, recorded_at)
);

-- Create admin dashboard cache table for expensive queries
CREATE TABLE IF NOT EXISTS admin_dashboard_cache (
  cache_key VARCHAR(200) PRIMARY KEY,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(
  time_range INTERVAL DEFAULT '24 hours'::INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := NOW() - time_range;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users_period', (
      SELECT COUNT(DISTINCT user_id) 
      FROM auth.sessions 
      WHERE created_at >= start_time
    ),
    'new_users_period', (
      SELECT COUNT(*) 
      FROM auth.users 
      WHERE created_at >= start_time
    ),
    'users_by_tier', (
      SELECT jsonb_object_agg(
        COALESCE(subscription_tier, 'free'), 
        user_count
      )
      FROM (
        SELECT 
          subscription_tier,
          COUNT(*) as user_count
        FROM profiles
        GROUP BY subscription_tier
      ) tier_counts
    ),
    'suspended_users', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE suspended_at IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content generation statistics
CREATE OR REPLACE FUNCTION get_content_statistics(
  time_range INTERVAL DEFAULT '24 hours'::INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := NOW() - time_range;
  
  SELECT jsonb_build_object(
    'total_brands', (SELECT COUNT(*) FROM brands),
    'total_cvs', (SELECT COUNT(*) FROM cvs),
    'brands_created_period', (
      SELECT COUNT(*) 
      FROM brands 
      WHERE created_at >= start_time
    ),
    'cvs_created_period', (
      SELECT COUNT(*) 
      FROM cvs 
      WHERE created_at >= start_time
    ),
    'content_by_status', (
      SELECT jsonb_build_object(
        'brands', (
          SELECT jsonb_object_agg(status, count)
          FROM (
            SELECT 
              CASE 
                WHEN is_public THEN 'public'
                ELSE 'private'
              END as status,
              COUNT(*) as count
            FROM brands
            GROUP BY is_public
          ) brand_status
        ),
        'cvs', (
          SELECT jsonb_object_agg(status, count)
          FROM (
            SELECT 
              CASE 
                WHEN is_public THEN 'public'
                ELSE 'private'
              END as status,
              COUNT(*) as count
            FROM cvs
            GROUP BY is_public
          ) cv_status
        )
      )
    ),
    'avg_content_per_user', (
      SELECT ROUND(
        (SELECT COUNT(*) FROM brands)::NUMERIC + 
        (SELECT COUNT(*) FROM cvs)::NUMERIC
      ) / NULLIF((SELECT COUNT(*) FROM auth.users), 0), 2
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system performance metrics
CREATE OR REPLACE FUNCTION get_performance_statistics(
  time_range INTERVAL DEFAULT '24 hours'::INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := NOW() - time_range;
  
  SELECT jsonb_build_object(
    'avg_response_time', (
      SELECT COALESCE(AVG(response_time_ms), 0)
      FROM system_health_metrics
      WHERE recorded_at >= start_time
    ),
    'error_rate', (
      SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status_code >= 400))::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 0
      )
      FROM system_health_metrics
      WHERE recorded_at >= start_time
    ),
    'total_requests', (
      SELECT COUNT(*)
      FROM system_health_metrics
      WHERE recorded_at >= start_time
    ),
    'requests_by_status', (
      SELECT jsonb_object_agg(
        status_group,
        request_count
      )
      FROM (
        SELECT 
          CASE 
            WHEN status_code < 300 THEN '2xx'
            WHEN status_code < 400 THEN '3xx'
            WHEN status_code < 500 THEN '4xx'
            ELSE '5xx'
          END as status_group,
          COUNT(*) as request_count
        FROM system_health_metrics
        WHERE recorded_at >= start_time
        GROUP BY status_group
      ) status_groups
    ),
    'slowest_endpoints', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'endpoint', endpoint,
          'avg_response_time', avg_time,
          'request_count', request_count
        )
      )
      FROM (
        SELECT 
          endpoint,
          ROUND(AVG(response_time_ms)) as avg_time,
          COUNT(*) as request_count
        FROM system_health_metrics
        WHERE recorded_at >= start_time
        GROUP BY endpoint
        ORDER BY avg_time DESC
        LIMIT 10
      ) slow_endpoints
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_statistics(
  time_range INTERVAL DEFAULT '24 hours'::INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := NOW() - time_range;
  
  SELECT jsonb_build_object(
    'pending_moderation', (
      SELECT COUNT(*)
      FROM content_moderation_queue
      WHERE status = 'pending'
    ),
    'moderated_period', (
      SELECT COUNT(*)
      FROM content_moderation_queue
      WHERE moderated_at >= start_time
    ),
    'approval_rate', (
      SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'approved'))::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')), 0) * 100, 0
      )
      FROM content_moderation_queue
      WHERE moderated_at >= start_time
    ),
    'avg_moderation_time', (
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600), 0
      )
      FROM content_moderation_queue
      WHERE moderated_at >= start_time
      AND moderated_at IS NOT NULL
    ),
    'moderation_by_type', (
      SELECT jsonb_object_agg(content_type, type_count)
      FROM (
        SELECT 
          content_type,
          COUNT(*) as type_count
        FROM content_moderation_queue
        WHERE created_at >= start_time
        GROUP BY content_type
      ) type_counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to collect and store system metrics
CREATE OR REPLACE FUNCTION collect_system_metrics()
RETURNS VOID AS $$
BEGIN
  -- Collect user metrics
  INSERT INTO admin_metrics (metric_type, metric_name, metric_value, metadata)
  SELECT 
    'user',
    key,
    CASE 
      WHEN jsonb_typeof(value) = 'number' THEN (value::TEXT)::NUMERIC
      ELSE 0
    END,
    jsonb_build_object('raw_value', value)
  FROM jsonb_each(get_user_statistics('1 hour'::INTERVAL))
  WHERE jsonb_typeof(value) = 'number';
  
  -- Collect content metrics
  INSERT INTO admin_metrics (metric_type, metric_name, metric_value, metadata)
  SELECT 
    'content',
    key,
    CASE 
      WHEN jsonb_typeof(value) = 'number' THEN (value::TEXT)::NUMERIC
      ELSE 0
    END,
    jsonb_build_object('raw_value', value)
  FROM jsonb_each(get_content_statistics('1 hour'::INTERVAL))
  WHERE jsonb_typeof(value) = 'number';
  
  -- Collect performance metrics
  INSERT INTO admin_metrics (metric_type, metric_name, metric_value, metadata)
  SELECT 
    'performance',
    key,
    CASE 
      WHEN jsonb_typeof(value) = 'number' THEN (value::TEXT)::NUMERIC
      ELSE 0
    END,
    jsonb_build_object('raw_value', value)
  FROM jsonb_each(get_performance_statistics('1 hour'::INTERVAL))
  WHERE jsonb_typeof(value) = 'number';
  
  -- Clean up old metrics (keep last 30 days)
  DELETE FROM admin_metrics 
  WHERE collected_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM system_health_metrics 
  WHERE recorded_at < NOW() - INTERVAL '30 days';
  
  -- Clean up expired cache entries
  DELETE FROM admin_dashboard_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION collect_system_metrics TO authenticated;

-- Enable RLS on new tables
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admin users can view metrics" ON admin_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can view health metrics" ON system_health_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage cache" ON admin_dashboard_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );