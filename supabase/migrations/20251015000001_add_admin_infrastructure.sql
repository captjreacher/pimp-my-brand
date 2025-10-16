-- Add admin infrastructure to the database
-- This migration adds admin role support, audit logging, and session tracking

-- Add app_role column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user';

-- Add admin-specific fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'content', 'subscription', etc.
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin sessions tracking table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content moderation queue table
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'brand' or 'cv'
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flagged_by UUID REFERENCES auth.users(id),
  flag_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_id UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system configuration table
CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_content_type ON content_moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles(app_role);

-- Row Level Security (RLS) policies

-- Admin audit log - only admins can read, system can write
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Admin sessions - only admins can view their own sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Content moderation queue - admins and moderators can access
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can access moderation queue" ON content_moderation_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Admin config - only super admins can access
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage config" ON admin_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role = 'super_admin'
    )
  );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type VARCHAR(50),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to start admin session
CREATE OR REPLACE FUNCTION start_admin_session(
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  user_role public.app_role;
BEGIN
  -- Check if user has admin privileges
  SELECT app_role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_role NOT IN ('admin', 'moderator', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges for admin session';
  END IF;
  
  -- End any existing active sessions
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Create new session
  INSERT INTO admin_sessions (
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  -- Log the admin login
  PERFORM log_admin_action(
    'admin_login',
    'session',
    session_id,
    jsonb_build_object('ip_address', p_ip_address),
    p_ip_address,
    p_user_agent
  );
  
  RETURN session_id;
END;
$$;

-- Function to end admin session
CREATE OR REPLACE FUNCTION end_admin_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Log the admin logout
  PERFORM log_admin_action('admin_logout', 'session', NULL);
  
  RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION start_admin_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_admin_session TO authenticated;

-- Insert default admin config values
INSERT INTO admin_config (key, value, description) VALUES
  ('max_session_duration', '"8 hours"', 'Maximum duration for admin sessions')
ON CONFLICT (key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit trail for all administrative actions';
COMMENT ON TABLE admin_sessions IS 'Tracks admin user sessions for security monitoring';
COMMENT ON TABLE content_moderation_queue IS 'Queue for content that requires moderation review';
COMMENT ON TABLE admin_config IS 'System-wide configuration managed by super admins';