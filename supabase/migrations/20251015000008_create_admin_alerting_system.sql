-- Admin Alerting System Migration
-- Creates tables and functions for admin alerts and notifications

-- Create admin alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  threshold NUMERIC,
  current_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for efficient querying
  INDEX idx_admin_alerts_type (type),
  INDEX idx_admin_alerts_severity (severity),
  INDEX idx_admin_alerts_acknowledged (acknowledged),
  INDEX idx_admin_alerts_created_at (created_at),
  INDEX idx_admin_alerts_type_severity (type, severity)
);

-- Create alert thresholds configuration table
CREATE TABLE IF NOT EXISTS admin_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL UNIQUE,
  operator VARCHAR(10) NOT NULL CHECK (operator IN ('gt', 'gte', 'lt', 'lte', 'eq')),
  value NUMERIC NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT TRUE,
  notification_channels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_alert_thresholds_metric (metric_name),
  INDEX idx_alert_thresholds_enabled (enabled)
);

-- Create notification channels configuration table
CREATE TABLE IF NOT EXISTS admin_notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'webhook', 'in_app')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_notification_channels_type (type),
  INDEX idx_notification_channels_enabled (enabled)
);

-- Create in-app notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES admin_alerts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  read BOOLEAN DEFAULT FALSE,
  read_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_admin_notifications_read (read),
  INDEX idx_admin_notifications_severity (severity),
  INDEX idx_admin_notifications_created_at (created_at),
  INDEX idx_admin_notifications_expires_at (expires_at)
);

-- Create notification delivery log table
CREATE TABLE IF NOT EXISTS admin_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES admin_alerts(id) ON DELETE CASCADE,
  channel_type VARCHAR(20) NOT NULL,
  channel_config JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_notification_log_status (status),
  INDEX idx_notification_log_channel (channel_type),
  INDEX idx_notification_log_created_at (created_at)
);

-- Function to get active alerts count by severity
CREATE OR REPLACE FUNCTION get_active_alerts_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_active', (SELECT COUNT(*) FROM admin_alerts WHERE acknowledged = FALSE),
    'critical', (SELECT COUNT(*) FROM admin_alerts WHERE acknowledged = FALSE AND severity = 'critical'),
    'high', (SELECT COUNT(*) FROM admin_alerts WHERE acknowledged = FALSE AND severity = 'high'),
    'medium', (SELECT COUNT(*) FROM admin_alerts WHERE acknowledged = FALSE AND severity = 'medium'),
    'low', (SELECT COUNT(*) FROM admin_alerts WHERE acknowledged = FALSE AND severity = 'low'),
    'by_type', (
      SELECT jsonb_object_agg(type, alert_count)
      FROM (
        SELECT 
          type,
          COUNT(*) as alert_count
        FROM admin_alerts
        WHERE acknowledged = FALSE
        GROUP BY type
      ) type_counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to acknowledge multiple alerts
CREATE OR REPLACE FUNCTION acknowledge_alerts(
  alert_ids UUID[],
  acknowledged_by_user UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE admin_alerts 
  SET 
    acknowledged = TRUE,
    acknowledged_by = acknowledged_by_user,
    acknowledged_at = NOW()
  WHERE 
    id = ANY(alert_ids)
    AND acknowledged = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old alerts and notifications
CREATE OR REPLACE FUNCTION cleanup_old_alerts_and_notifications()
RETURNS VOID AS $$
BEGIN
  -- Delete acknowledged alerts older than 30 days
  DELETE FROM admin_alerts 
  WHERE acknowledged = TRUE 
  AND acknowledged_at < NOW() - INTERVAL '30 days';
  
  -- Delete expired in-app notifications
  DELETE FROM admin_notifications 
  WHERE expires_at < NOW();
  
  -- Delete old notification logs (keep last 90 days)
  DELETE FROM admin_notification_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old unacknowledged alerts (keep last 7 days for critical, 3 days for others)
  DELETE FROM admin_alerts 
  WHERE acknowledged = FALSE 
  AND (
    (severity = 'critical' AND created_at < NOW() - INTERVAL '7 days') OR
    (severity != 'critical' AND created_at < NOW() - INTERVAL '3 days')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_statistics(
  time_range INTERVAL DEFAULT '24 hours'::INTERVAL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := NOW() - time_range;
  
  SELECT jsonb_build_object(
    'alerts_created', (
      SELECT COUNT(*) 
      FROM admin_alerts 
      WHERE created_at >= start_time
    ),
    'alerts_acknowledged', (
      SELECT COUNT(*) 
      FROM admin_alerts 
      WHERE acknowledged_at >= start_time
    ),
    'notifications_sent', (
      SELECT COUNT(*) 
      FROM admin_notification_log 
      WHERE sent_at >= start_time AND status = 'sent'
    ),
    'notification_failures', (
      SELECT COUNT(*) 
      FROM admin_notification_log 
      WHERE created_at >= start_time AND status = 'failed'
    ),
    'avg_acknowledgment_time', (
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 3600), 0
      )
      FROM admin_alerts 
      WHERE acknowledged_at >= start_time
      AND acknowledged_at IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default alert thresholds
INSERT INTO admin_alert_thresholds (metric_name, operator, value, severity, notification_channels) VALUES
('error_rate', 'gt', 5.0, 'high', ARRAY['email', 'in_app']),
('error_rate', 'gt', 10.0, 'critical', ARRAY['email', 'webhook', 'in_app']),
('response_time', 'gt', 1000, 'medium', ARRAY['in_app']),
('response_time', 'gt', 2000, 'high', ARRAY['email', 'in_app']),
('response_time', 'gt', 5000, 'critical', ARRAY['email', 'webhook', 'in_app']),
('uptime_percentage', 'lt', 99.0, 'high', ARRAY['email', 'in_app']),
('uptime_percentage', 'lt', 95.0, 'critical', ARRAY['email', 'webhook', 'in_app']),
('pending_moderation', 'gt', 50, 'medium', ARRAY['in_app']),
('pending_moderation', 'gt', 100, 'high', ARRAY['email', 'in_app'])
ON CONFLICT (metric_name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admin users can manage alerts" ON admin_alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage alert thresholds" ON admin_alert_thresholds
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can manage notification channels" ON admin_notification_channels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can view notifications" ON admin_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can update notifications" ON admin_notifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can view notification logs" ON admin_notification_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_active_alerts_summary TO authenticated;
GRANT EXECUTE ON FUNCTION acknowledge_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_alerts_and_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_statistics TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alert_thresholds_updated_at
  BEFORE UPDATE ON admin_alert_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at
  BEFORE UPDATE ON admin_notification_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();