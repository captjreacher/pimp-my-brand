-- Setup missing admin functions
-- Run this in your Supabase SQL Editor

-- Create admin audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content moderation queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_by UUID,
  flag_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_id UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin config table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);

-- Create the log_admin_action function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type VARCHAR(50),
  p_admin_user_id UUID DEFAULT NULL,
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_admin_user_id, auth.uid());
  
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details,
    user_agent
  ) VALUES (
    current_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    CASE WHEN p_details IS NOT NULL THEN p_details::jsonb ELSE NULL END,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create the start_admin_session function
CREATE OR REPLACE FUNCTION start_admin_session(
  p_user_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_user_id, auth.uid());
  
  -- End any existing active sessions
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO admin_sessions (
    user_id,
    user_agent
  ) VALUES (
    current_user_id,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  -- Log the admin login
  PERFORM log_admin_action(
    'admin_login',
    current_user_id,
    'session',
    session_id,
    jsonb_build_object('session_id', session_id)::text,
    p_user_agent
  );
  
  RETURN session_id;
END;
$$;

-- Create the end_admin_session function
CREATE OR REPLACE FUNCTION end_admin_session(
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_user_id, auth.uid());
  
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Log the admin logout
  PERFORM log_admin_action('admin_logout', current_user_id, 'session', NULL);
  
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION start_admin_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_admin_session TO authenticated;

-- Insert default config
INSERT INTO admin_config (key, value, description) VALUES
  ('max_session_duration', '"8 hours"', 'Maximum duration for admin sessions')
ON CONFLICT (key) DO NOTHING;

-- Verify setup
SELECT 'Admin functions setup complete!' as status;