-- Admin Audit Log System Migration
-- This migration creates the audit log table and related functions for tracking admin actions

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'content', 'subscription', 'system', etc.
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_type ON admin_audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_id ON admin_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_composite ON admin_audit_log(admin_user_id, action_type, created_at DESC);

-- Create admin sessions tracking table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_start ON admin_sessions(session_start DESC);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id UUID,
  p_action_type VARCHAR(50),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
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
    p_admin_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start admin session
CREATE OR REPLACE FUNCTION start_admin_session(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- End any existing active sessions for this user
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO admin_sessions (
    user_id,
    ip_address,
    user_agent,
    is_active
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    true
  ) RETURNING id INTO session_id;
  
  -- Log the session start
  PERFORM log_admin_action(
    p_user_id,
    'SESSION_START',
    'session',
    session_id,
    jsonb_build_object('ip_address', p_ip_address, 'user_agent', p_user_agent),
    p_ip_address,
    p_user_agent
  );
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end admin session
CREATE OR REPLACE FUNCTION end_admin_session(
  p_user_id UUID,
  p_session_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_session_id IS NOT NULL THEN
    -- End specific session
    UPDATE admin_sessions 
    SET is_active = false, session_end = NOW()
    WHERE id = p_session_id AND user_id = p_user_id AND is_active = true;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- End all active sessions for user
    UPDATE admin_sessions 
    SET is_active = false, session_end = NOW()
    WHERE user_id = p_user_id AND is_active = true;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  -- Log the session end if any sessions were updated
  IF updated_count > 0 THEN
    PERFORM log_admin_action(
      p_user_id,
      'SESSION_END',
      'session',
      p_session_id,
      jsonb_build_object('sessions_ended', updated_count)
    );
  END IF;
  
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
--
 Trigger function to automatically log profile changes
CREATE OR REPLACE FUNCTION trigger_audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the change is made by an admin user
  IF NEW.app_role IS DISTINCT FROM OLD.app_role OR 
     NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
    
    -- Log role changes
    IF NEW.app_role IS DISTINCT FROM OLD.app_role THEN
      PERFORM log_admin_action(
        auth.uid(),
        'USER_ROLE_CHANGED',
        'user',
        NEW.id,
        jsonb_build_object(
          'old_role', OLD.app_role,
          'new_role', NEW.app_role,
          'user_email', NEW.email
        )
      );
    END IF;
    
    -- Log suspension changes
    IF NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
      IF NEW.suspended_at IS NOT NULL AND OLD.suspended_at IS NULL THEN
        PERFORM log_admin_action(
          auth.uid(),
          'USER_SUSPENDED',
          'user',
          NEW.id,
          jsonb_build_object(
            'user_email', NEW.email,
            'suspension_reason', NEW.suspension_reason,
            'suspended_by', NEW.suspended_by
          )
        );
      ELSIF NEW.suspended_at IS NULL AND OLD.suspended_at IS NOT NULL THEN
        PERFORM log_admin_action(
          auth.uid(),
          'USER_ACTIVATED',
          'user',
          NEW.id,
          jsonb_build_object(
            'user_email', NEW.email,
            'previously_suspended_at', OLD.suspended_at
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes (will be applied after profiles table is extended)
-- This will be activated when we extend the profiles table in subtask 2.3

-- Function to clean up old audit logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM admin_audit_log 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup action
  PERFORM log_admin_action(
    auth.uid(),
    'SYSTEM_MAINTENANCE',
    'system',
    NULL,
    jsonb_build_object(
      'action', 'audit_log_cleanup',
      'deleted_records', deleted_count,
      'days_kept', days_to_keep
    )
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO authenticated;

-- RLS policies for admin audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin users can view audit logs" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Only system can insert audit logs (via functions)
CREATE POLICY "System can insert audit logs" ON admin_audit_log
  FOR INSERT WITH CHECK (true);

-- RLS policies for admin sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can view their own sessions and other admin sessions
CREATE POLICY "Admin users can view admin sessions" ON admin_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Only system can manage sessions (via functions)
CREATE POLICY "System can manage admin sessions" ON admin_sessions
  FOR ALL WITH CHECK (true);