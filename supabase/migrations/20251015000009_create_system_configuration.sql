-- Create system configuration management tables
-- This migration creates the infrastructure for admin system configuration

-- System configuration table for storing key-value settings
CREATE TABLE admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  config_type VARCHAR(50) NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
  is_sensitive BOOLEAN DEFAULT false, -- For API keys, passwords, etc.
  validation_schema JSONB, -- JSON schema for validation
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration history for tracking changes and rollback
CREATE TABLE admin_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags table for enabling/disabling features
CREATE TABLE feature_flags (
  flag_name VARCHAR(100) PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  target_audience JSONB DEFAULT '{"type": "all"}', -- 'all', 'percentage', 'user_list', 'role_based'
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  enabled_for_users UUID[] DEFAULT '{}',
  enabled_for_roles TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting configuration
CREATE TABLE rate_limit_config (
  endpoint_pattern VARCHAR(200) PRIMARY KEY,
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  requests_per_hour INTEGER NOT NULL DEFAULT 1000,
  requests_per_day INTEGER NOT NULL DEFAULT 10000,
  burst_limit INTEGER NOT NULL DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  applies_to_roles TEXT[] DEFAULT '{"user"}', -- Which roles this applies to
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys and integration management
CREATE TABLE api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL UNIQUE,
  api_key_encrypted TEXT, -- Encrypted API key
  endpoint_url TEXT,
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_admin_config_type ON admin_config(config_type);
CREATE INDEX idx_admin_config_updated_at ON admin_config(updated_at);
CREATE INDEX idx_config_history_key ON admin_config_history(config_key);
CREATE INDEX idx_config_history_created_at ON admin_config_history(created_at);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_rate_limit_enabled ON rate_limit_config(is_enabled);
CREATE INDEX idx_api_integrations_active ON api_integrations(is_active);
CREATE INDEX idx_api_integrations_health ON api_integrations(health_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_config_updated_at BEFORE UPDATE ON rate_limit_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log configuration changes
CREATE OR REPLACE FUNCTION log_config_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_config_history (config_key, old_value, new_value, changed_by)
        VALUES (NEW.key, OLD.value, NEW.value, NEW.updated_by);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO admin_config_history (config_key, old_value, new_value, changed_by)
        VALUES (NEW.key, NULL, NEW.value, NEW.created_by);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER log_admin_config_changes
    AFTER INSERT OR UPDATE ON admin_config
    FOR EACH ROW EXECUTE FUNCTION log_config_changes();

-- RLS Policies (Admin only access)
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- Only admins can access configuration
CREATE POLICY "Admin only access to config" ON admin_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.app_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin only access to config history" ON admin_config_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.app_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin only access to feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.app_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin only access to rate limits" ON rate_limit_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.app_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin only access to integrations" ON api_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.app_role IN ('admin', 'super_admin')
        )
    );

-- Insert default configuration values
INSERT INTO admin_config (key, value, description, config_type, created_by) VALUES
('app.maintenance_mode', 'false', 'Enable maintenance mode to disable user access', 'boolean', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('app.max_file_size_mb', '10', 'Maximum file upload size in MB', 'number', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('app.allowed_file_types', '["pdf", "docx", "txt", "jpg", "png"]', 'Allowed file types for upload', 'array', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('ai.max_tokens_per_request', '4000', 'Maximum tokens per AI request', 'number', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('ai.rate_limit_per_user_per_hour', '50', 'AI requests per user per hour', 'number', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('notifications.email_enabled', 'true', 'Enable email notifications', 'boolean', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('storage.cleanup_interval_days', '30', 'Days before cleaning up unused files', 'number', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1));

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description, created_by) VALUES
('cv_generation', true, 'Enable CV generation feature', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('brand_generation', true, 'Enable brand generation feature', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('file_upload', true, 'Enable file upload functionality', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('premium_features', true, 'Enable premium subscription features', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('analytics_tracking', true, 'Enable user analytics tracking', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1));

-- Insert default rate limiting rules
INSERT INTO rate_limit_config (endpoint_pattern, requests_per_minute, requests_per_hour, requests_per_day, created_by) VALUES
('/api/generate/*', 10, 50, 200, (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('/api/upload/*', 20, 100, 500, (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('/api/auth/*', 30, 200, 1000, (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('/api/admin/*', 60, 500, 2000, (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1));

-- Insert default API integrations (without actual keys)
INSERT INTO api_integrations (service_name, endpoint_url, configuration, created_by) VALUES
('openai', 'https://api.openai.com/v1', '{"model": "gpt-4", "temperature": 0.7}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('stripe', 'https://api.stripe.com/v1', '{"webhook_endpoint": "/api/webhooks/stripe"}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('supabase_storage', '', '{"bucket": "user-uploads", "max_file_size": 10485760}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1));