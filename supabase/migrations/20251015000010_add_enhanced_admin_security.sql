-- Enhanced Admin Security Features Migration
-- This migration adds multi-factor authentication, IP restrictions, enhanced session management, and login monitoring

-- Create admin security settings table
CREATE TABLE IF NOT EXISTS admin_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT, -- TOTP secret key (encrypted)
  backup_codes TEXT[], -- Array of backup codes (encrypted)
  ip_allowlist INET[], -- Array of allowed IP addresses
  ip_restriction_enabled BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours default
  require_mfa_for_sensitive_actions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin login attempts table for monitoring and lockout
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  mfa_required BOOLEAN DEFAULT false,
  mfa_success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin account lockouts table
CREATE TABLE IF NOT EXISTS admin_account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE,
  lockout_reason TEXT NOT NULL,
  failed_attempts_count INTEGER DEFAULT 0,
  locked_by_system BOOLEAN DEFAULT true,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlocked_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Create admin MFA tokens table for temporary tokens
CREATE TABLE IF NOT EXISTS admin_mfa_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token_hash TEXT NOT NULL,
  token_type VARCHAR(20) NOT NULL, -- 'setup', 'verification', 'backup'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend admin_sessions table with enhanced security fields
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN DEFAULT false;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 480;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS ip_locked BOOLEAN DEFAULT false;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard'; -- 'standard', 'high', 'critical'

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_security_settings_user_id ON admin_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_user_id ON admin_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_address ON admin_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_created_at ON admin_login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_account_lockouts_user_id ON admin_account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_account_lockouts_is_active ON admin_account_lockouts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_tokens_user_id ON admin_mfa_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_tokens_expires_at ON admin_mfa_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_activity ON admin_sessions(last_activity);

-- Row Level Security (RLS) policies

-- Admin security settings - users can only access their own settings
ALTER TABLE admin_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own security settings" ON admin_security_settings
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Super admins can view all security settings
CREATE POLICY "Super admins can view all security settings" ON admin_security_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role = 'super_admin'
    )
  );

-- Admin login attempts - admins can view their own, super admins can view all
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login attempts" ON admin_login_attempts
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

CREATE POLICY "Super admins can view all login attempts" ON admin_login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role = 'super_admin'
    )
  );

-- Admin account lockouts - similar access pattern
ALTER TABLE admin_account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lockouts" ON admin_account_lockouts
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

CREATE POLICY "Super admins can manage all lockouts" ON admin_account_lockouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role = 'super_admin'
    )
  );

-- Admin MFA tokens - users can only access their own tokens
ALTER TABLE admin_mfa_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own MFA tokens" ON admin_mfa_tokens
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Function to check if user account is locked
CREATE OR REPLACE FUNCTION is_admin_account_locked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM admin_account_lockouts
  WHERE user_id = p_user_id 
    AND is_active = true
    AND (locked_until IS NULL OR locked_until > NOW())
  ORDER BY locked_at DESC
  LIMIT 1;
  
  RETURN lockout_record IS NOT NULL;
END;
$$;

-- Function to lock admin account
CREATE OR REPLACE FUNCTION lock_admin_account(
  p_user_id UUID,
  p_reason TEXT,
  p_duration_minutes INTEGER DEFAULT 30,
  p_failed_attempts INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lockout_id UUID;
  locked_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate lockout end time
  locked_until_time := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Deactivate any existing lockouts
  UPDATE admin_account_lockouts 
  SET is_active = false 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Create new lockout
  INSERT INTO admin_account_lockouts (
    user_id,
    locked_until,
    lockout_reason,
    failed_attempts_count
  ) VALUES (
    p_user_id,
    locked_until_time,
    p_reason,
    p_failed_attempts
  ) RETURNING id INTO lockout_id;
  
  -- End all active admin sessions for this user
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Log the lockout
  PERFORM log_admin_action(
    'account_locked',
    'user',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'duration_minutes', p_duration_minutes,
      'failed_attempts', p_failed_attempts
    )
  );
  
  RETURN lockout_id;
END;
$$;

-- Function to unlock admin account
CREATE OR REPLACE FUNCTION unlock_admin_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all active lockouts
  UPDATE admin_account_lockouts 
  SET is_active = false, 
      unlocked_at = NOW(),
      unlocked_by = auth.uid()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Log the unlock
  PERFORM log_admin_action(
    'account_unlocked',
    'user',
    p_user_id,
    jsonb_build_object('unlocked_by', auth.uid())
  );
  
  RETURN true;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_admin_login_attempt(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_mfa_required BOOLEAN DEFAULT false,
  p_mfa_success BOOLEAN DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_id UUID;
  failed_attempts_count INTEGER;
  max_failed_attempts INTEGER := 5; -- Configurable
  lockout_duration INTEGER := 30; -- 30 minutes
BEGIN
  -- Record the login attempt
  INSERT INTO admin_login_attempts (
    user_id,
    email,
    ip_address,
    user_agent,
    success,
    failure_reason,
    mfa_required,
    mfa_success
  ) VALUES (
    p_user_id,
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason,
    p_mfa_required,
    p_mfa_success
  ) RETURNING id INTO attempt_id;
  
  -- If login failed, check if we need to lock the account
  IF NOT p_success AND p_user_id IS NOT NULL THEN
    -- Count recent failed attempts (last 15 minutes)
    SELECT COUNT(*) INTO failed_attempts_count
    FROM admin_login_attempts
    WHERE user_id = p_user_id 
      AND success = false
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Lock account if too many failed attempts
    IF failed_attempts_count >= max_failed_attempts THEN
      PERFORM lock_admin_account(
        p_user_id,
        'Too many failed login attempts',
        lockout_duration,
        failed_attempts_count
      );
    END IF;
  END IF;
  
  RETURN attempt_id;
END;
$$;

-- Function to validate IP address against allowlist
CREATE OR REPLACE FUNCTION validate_admin_ip_access(
  p_user_id UUID,
  p_ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  security_settings RECORD;
BEGIN
  -- Get user's security settings
  SELECT * INTO security_settings
  FROM admin_security_settings
  WHERE user_id = p_user_id;
  
  -- If no settings or IP restriction not enabled, allow access
  IF security_settings IS NULL OR NOT security_settings.ip_restriction_enabled THEN
    RETURN true;
  END IF;
  
  -- If allowlist is empty, deny access
  IF security_settings.ip_allowlist IS NULL OR array_length(security_settings.ip_allowlist, 1) = 0 THEN
    RETURN false;
  END IF;
  
  -- Check if IP is in allowlist
  RETURN p_ip_address = ANY(security_settings.ip_allowlist);
END;
$$;

-- Function to check session timeout
CREATE OR REPLACE FUNCTION is_admin_session_expired(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  timeout_minutes INTEGER;
BEGIN
  SELECT s.*, ss.session_timeout_minutes INTO session_record
  FROM admin_sessions s
  LEFT JOIN admin_security_settings ss ON s.user_id = ss.user_id
  WHERE s.id = p_session_id;
  
  IF session_record IS NULL THEN
    RETURN true; -- Session doesn't exist, consider expired
  END IF;
  
  -- Use custom timeout or default
  timeout_minutes := COALESCE(session_record.session_timeout_minutes, 480); -- 8 hours default
  
  -- Check if session has expired based on last activity
  RETURN session_record.last_activity < NOW() - (timeout_minutes || ' minutes')::INTERVAL;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_admin_session_activity(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_sessions 
  SET last_activity = NOW()
  WHERE id = p_session_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- End expired sessions
  WITH expired_sessions AS (
    SELECT s.id
    FROM admin_sessions s
    LEFT JOIN admin_security_settings ss ON s.user_id = ss.user_id
    WHERE s.is_active = true
      AND s.last_activity < NOW() - (COALESCE(ss.session_timeout_minutes, 480) || ' minutes')::INTERVAL
  )
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE id IN (SELECT id FROM expired_sessions);
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Function to setup MFA
CREATE OR REPLACE FUNCTION setup_admin_mfa(
  p_user_id UUID,
  p_secret TEXT,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_security_settings (
    user_id,
    mfa_secret,
    backup_codes,
    mfa_enabled
  ) VALUES (
    p_user_id,
    p_secret,
    p_backup_codes,
    false -- Will be enabled after verification
  )
  ON CONFLICT (user_id) DO UPDATE SET
    mfa_secret = EXCLUDED.mfa_secret,
    backup_codes = EXCLUDED.backup_codes,
    mfa_enabled = false,
    updated_at = NOW();
  
  RETURN true;
END;
$$;

-- Function to start enhanced admin session
CREATE OR REPLACE FUNCTION start_enhanced_admin_session(
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_mfa_verified BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  user_role public.app_role;
  security_settings RECORD;
BEGIN
  -- Check if user has admin privileges
  SELECT app_role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_role NOT IN ('admin', 'moderator', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges for admin session';
  END IF;
  
  -- Get user security settings
  SELECT * INTO security_settings
  FROM admin_security_settings
  WHERE user_id = auth.uid();
  
  -- End any existing active sessions
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Create new session with enhanced security fields
  INSERT INTO admin_sessions (
    user_id,
    ip_address,
    user_agent,
    mfa_verified,
    session_timeout_minutes,
    security_level
  ) VALUES (
    auth.uid(),
    p_ip_address,
    p_user_agent,
    p_mfa_verified,
    COALESCE(security_settings.session_timeout_minutes, 480),
    CASE 
      WHEN security_settings.mfa_enabled AND p_mfa_verified THEN 'high'
      WHEN security_settings.mfa_enabled THEN 'critical'
      ELSE 'standard'
    END
  ) RETURNING id INTO session_id;
  
  -- Log the admin login
  PERFORM log_admin_action(
    'admin_login',
    'session',
    session_id,
    jsonb_build_object(
      'ip_address', p_ip_address,
      'mfa_verified', p_mfa_verified,
      'security_level', CASE 
        WHEN security_settings.mfa_enabled AND p_mfa_verified THEN 'high'
        WHEN security_settings.mfa_enabled THEN 'critical'
        ELSE 'standard'
      END
    ),
    p_ip_address,
    p_user_agent
  );
  
  RETURN session_id;
END;
$$;

-- Function to get security metrics
CREATE OR REPLACE FUNCTION get_admin_security_metrics(p_days INTEGER DEFAULT 1)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_attempts INTEGER;
  failed_attempts INTEGER;
  success_rate NUMERIC;
  locked_accounts INTEGER;
  mfa_enabled_users INTEGER;
  ip_restricted_users INTEGER;
BEGIN
  -- Check if user has permission to view metrics
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND app_role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to view security metrics';
  END IF;
  
  -- Get total login attempts
  SELECT COUNT(*) INTO total_attempts
  FROM admin_login_attempts
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
  
  -- Get failed attempts
  SELECT COUNT(*) INTO failed_attempts
  FROM admin_login_attempts
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND success = false;
  
  -- Calculate success rate
  success_rate := CASE 
    WHEN total_attempts > 0 THEN 
      ((total_attempts - failed_attempts)::NUMERIC / total_attempts::NUMERIC) * 100
    ELSE 0
  END;
  
  -- Get locked accounts
  SELECT COUNT(DISTINCT user_id) INTO locked_accounts
  FROM admin_account_lockouts
  WHERE is_active = true
    AND (locked_until IS NULL OR locked_until > NOW());
  
  -- Get MFA enabled users
  SELECT COUNT(*) INTO mfa_enabled_users
  FROM admin_security_settings
  WHERE mfa_enabled = true;
  
  -- Get IP restricted users
  SELECT COUNT(*) INTO ip_restricted_users
  FROM admin_security_settings
  WHERE ip_restriction_enabled = true;
  
  -- Build result JSON
  result := json_build_object(
    'total_login_attempts', total_attempts,
    'failed_attempts', failed_attempts,
    'success_rate', success_rate,
    'locked_accounts', locked_accounts,
    'mfa_enabled_users', mfa_enabled_users,
    'ip_restricted_users', ip_restricted_users
  );
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin_account_locked TO authenticated;
GRANT EXECUTE ON FUNCTION lock_admin_account TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_admin_account TO authenticated;
GRANT EXECUTE ON FUNCTION record_admin_login_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION validate_admin_ip_access TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_session_expired TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_admin_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION setup_admin_mfa TO authenticated;
GRANT EXECUTE ON FUNCTION start_enhanced_admin_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_security_metrics TO authenticated;

-- Insert default security configuration
INSERT INTO admin_config (key, value, description) VALUES
  ('max_failed_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
  ('account_lockout_duration_minutes', '30', 'Duration of account lockout in minutes'),
  ('failed_attempts_window_minutes', '15', 'Time window for counting failed attempts'),
  ('default_admin_session_timeout_minutes', '480', 'Default admin session timeout (8 hours)'),
  ('mfa_required_for_super_admin', 'true', 'Require MFA for super admin accounts'),
  ('ip_restriction_enabled_by_default', 'false', 'Enable IP restrictions by default for new admin accounts')
ON CONFLICT (key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE admin_security_settings IS 'Enhanced security settings for admin users including MFA and IP restrictions';
COMMENT ON TABLE admin_login_attempts IS 'Comprehensive logging of all admin login attempts for security monitoring';
COMMENT ON TABLE admin_account_lockouts IS 'Tracks admin account lockouts due to security violations';
COMMENT ON TABLE admin_mfa_tokens IS 'Temporary tokens for MFA setup and verification processes';