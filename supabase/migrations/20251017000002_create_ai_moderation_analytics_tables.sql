-- AI Content Moderation Logs Table
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES ai_generation_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flagged BOOLEAN NOT NULL DEFAULT false,
  categories TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.0,
  reason TEXT,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Background Jobs Table
CREATE TABLE IF NOT EXISTS ai_background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image_generation', 'voice_synthesis', 'video_generation', 'content_moderation')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDN Cache Entries Table
CREATE TABLE IF NOT EXISTS ai_cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size BIGINT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  hits INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit TEXT,
  tags JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics Table (for aggregated data)
CREATE TABLE IF NOT EXISTS ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  feature TEXT NOT NULL,
  subscription_tier TEXT,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, feature, subscription_tier)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_user_id ON ai_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_flagged ON ai_moderation_logs(flagged);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_review_status ON ai_moderation_logs(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_created_at ON ai_moderation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_background_jobs_status ON ai_background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_background_jobs_priority ON ai_background_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_ai_background_jobs_user_id ON ai_background_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_background_jobs_type ON ai_background_jobs(type);
CREATE INDEX IF NOT EXISTS idx_ai_background_jobs_created_at ON ai_background_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_cache_entries_cache_key ON ai_cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_entries_expires_at ON ai_cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_entries_hits ON ai_cache_entries(hits);
CREATE INDEX IF NOT EXISTS idx_ai_cache_entries_last_accessed ON ai_cache_entries(last_accessed);

CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_type_name ON ai_performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_timestamp ON ai_performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_date ON ai_usage_analytics(date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_feature ON ai_usage_analytics(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_tier ON ai_usage_analytics(subscription_tier);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_moderation_logs_updated_at 
  BEFORE UPDATE ON ai_moderation_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_background_jobs_updated_at 
  BEFORE UPDATE ON ai_background_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_cache_entries_updated_at 
  BEFORE UPDATE ON ai_cache_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_analytics_updated_at 
  BEFORE UPDATE ON ai_usage_analytics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE ai_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can access all moderation logs
CREATE POLICY "Admins can access all moderation logs" ON ai_moderation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can only see their own background jobs
CREATE POLICY "Users can access their own background jobs" ON ai_background_jobs
  FOR ALL USING (user_id = auth.uid());

-- Admins can access all background jobs
CREATE POLICY "Admins can access all background jobs" ON ai_background_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Cache entries are accessible to authenticated users (for reading)
CREATE POLICY "Authenticated users can read cache entries" ON ai_cache_entries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify cache entries
CREATE POLICY "Service role can modify cache entries" ON ai_cache_entries
  FOR ALL USING (auth.role() = 'service_role');

-- Performance metrics are admin-only
CREATE POLICY "Admins can access performance metrics" ON ai_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Usage analytics are admin-only
CREATE POLICY "Admins can access usage analytics" ON ai_usage_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create a function to aggregate daily usage analytics
CREATE OR REPLACE FUNCTION aggregate_daily_ai_usage()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage_analytics (
    date,
    feature,
    subscription_tier,
    total_requests,
    successful_requests,
    total_cost_cents,
    unique_users,
    avg_response_time_ms
  )
  SELECT 
    DATE(agr.created_at) as date,
    agr.feature,
    COALESCE(p.subscription_tier, 'free') as subscription_tier,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE agr.status = 'completed') as successful_requests,
    SUM(COALESCE(agr.cost_cents, 0)) as total_cost_cents,
    COUNT(DISTINCT agr.user_id) as unique_users,
    AVG(COALESCE(agr.processing_time_ms, 0))::INTEGER as avg_response_time_ms
  FROM ai_generation_requests agr
  LEFT JOIN profiles p ON p.id = agr.user_id
  WHERE DATE(agr.created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(agr.created_at), agr.feature, COALESCE(p.subscription_tier, 'free')
  ON CONFLICT (date, feature, subscription_tier) 
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    total_cost_cents = EXCLUDED.total_cost_cents,
    unique_users = EXCLUDED.unique_users,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_ai_data()
RETURNS void AS $$
BEGIN
  -- Clean up old performance metrics (keep 90 days)
  DELETE FROM ai_performance_metrics 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Clean up old moderation logs (keep 1 year)
  DELETE FROM ai_moderation_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up completed background jobs (keep 30 days)
  DELETE FROM ai_background_jobs 
  WHERE status IN ('completed', 'failed') 
  AND completed_at < NOW() - INTERVAL '30 days';
  
  -- Clean up expired cache entries
  DELETE FROM ai_cache_entries 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;