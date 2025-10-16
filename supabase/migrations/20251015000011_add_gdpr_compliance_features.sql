-- GDPR Compliance and Data Management Features Migration
-- This migration adds data export, deletion, retention policies, and anonymization tools

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL, -- Admin who initiated the request
  request_type VARCHAR(20) NOT NULL, -- 'user_data', 'audit_logs', 'full_export'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  export_format VARCHAR(10) DEFAULT 'json', -- 'json', 'csv', 'xml'
  include_deleted BOOLEAN DEFAULT false,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  export_file_path TEXT, -- Path to generated export file
  export_file_size BIGINT, -- Size in bytes
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- When export file expires
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL, -- Admin who initiated the request
  deletion_type VARCHAR(20) NOT NULL, -- 'soft_delete', 'hard_delete', 'anonymize'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  preserve_audit_trail BOOLEAN DEFAULT true,
  preserve_analytics BOOLEAN DEFAULT false,
  deletion_reason TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE, -- When to execute deletion
  completed_at TIMESTAMP WITH TIME ZONE,
  rollback_data JSONB, -- Data needed for potential rollback
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(100) NOT NULL UNIQUE,
  data_type VARCHAR(50) NOT NULL, -- 'user_data', 'audit_logs', 'content', 'analytics'
  retention_period_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT false,
  anonymize_instead BOOLEAN DEFAULT true,
  policy_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anonymization log table
CREATE TABLE IF NOT EXISTS data_anonymization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Original user ID (may be null after anonymization)
  anonymized_user_id UUID, -- New anonymized ID
  data_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  fields_anonymized TEXT[], -- Array of field names that were anonymized
  anonymization_method VARCHAR(50) NOT NULL, -- 'hash', 'random', 'null', 'generic'
  performed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  reversible BOOLEAN DEFAULT false,
  reversal_key TEXT, -- Encrypted key for reversible anonymization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GDPR consent tracking table
CREATE TABLE IF NOT EXISTS gdpr_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  consent_type VARCHAR(50) NOT NULL, -- 'data_processing', 'marketing', 'analytics'
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  withdrawal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trail export table for compliance reporting
CREATE TABLE IF NOT EXISTS audit_trail_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_name VARCHAR(200) NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  user_filter UUID[], -- Array of user IDs to include (null = all users)
  action_filter VARCHAR(50)[], -- Array of action types to include
  export_format VARCHAR(10) DEFAULT 'json',
  file_path TEXT,
  file_size BIGINT,
  record_count INTEGER,
  exported_by UUID REFERENCES auth.users(id) NOT NULL,
  export_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_created_at ON data_export_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_scheduled_for ON data_deletion_requests(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_data_type ON data_retention_policies(data_type);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_is_active ON data_retention_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_data_anonymization_log_user_id ON data_anonymization_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_anonymization_log_created_at ON data_anonymization_log(created_at);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_log_user_id ON gdpr_consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_log_consent_type ON gdpr_consent_log(consent_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_exports_exported_by ON audit_trail_exports(exported_by);
CREATE INDEX IF NOT EXISTS idx_audit_trail_exports_status ON audit_trail_exports(status);

-- Row Level Security (RLS) policies

-- Data export requests - admins can view all, users can view their own
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all export requests" ON data_export_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own export requests" ON data_export_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Data deletion requests - similar pattern
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all deletion requests" ON data_deletion_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Data retention policies - only super admins
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage retention policies" ON data_retention_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role = 'super_admin'
    )
  );

-- Anonymization log - admins can view
ALTER TABLE data_anonymization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view anonymization log" ON data_anonymization_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- GDPR consent log - users can view their own, admins can view all
ALTER TABLE gdpr_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent log" ON gdpr_consent_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all consent logs" ON gdpr_consent_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Audit trail exports - admins only
ALTER TABLE audit_trail_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit exports" ON audit_trail_exports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

-- Function to create user data export
CREATE OR REPLACE FUNCTION create_user_data_export(
  p_user_id UUID,
  p_export_format VARCHAR(10) DEFAULT 'json',
  p_include_deleted BOOLEAN DEFAULT false,
  p_date_range_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_range_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  export_id UUID;
  admin_role public.app_role;
BEGIN
  -- Check if requester has admin privileges
  SELECT app_role INTO admin_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to create data export';
  END IF;
  
  -- Create export request
  INSERT INTO data_export_requests (
    user_id,
    requested_by,
    request_type,
    export_format,
    include_deleted,
    date_range_start,
    date_range_end,
    expires_at
  ) VALUES (
    p_user_id,
    auth.uid(),
    'user_data',
    p_export_format,
    p_include_deleted,
    p_date_range_start,
    p_date_range_end,
    NOW() + INTERVAL '30 days' -- Export expires in 30 days
  ) RETURNING id INTO export_id;
  
  -- Log the export request
  PERFORM log_admin_action(
    'data_export_requested',
    'user',
    p_user_id,
    jsonb_build_object(
      'export_id', export_id,
      'export_format', p_export_format,
      'include_deleted', p_include_deleted
    )
  );
  
  RETURN export_id;
END;
$$;

-- Function to create user data deletion request
CREATE OR REPLACE FUNCTION create_user_data_deletion(
  p_user_id UUID,
  p_deletion_type VARCHAR(20) DEFAULT 'soft_delete',
  p_preserve_audit_trail BOOLEAN DEFAULT true,
  p_preserve_analytics BOOLEAN DEFAULT false,
  p_deletion_reason TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deletion_id UUID;
  admin_role public.app_role;
BEGIN
  -- Check if requester has admin privileges
  SELECT app_role INTO admin_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to create data deletion request';
  END IF;
  
  -- Create deletion request
  INSERT INTO data_deletion_requests (
    user_id,
    requested_by,
    deletion_type,
    preserve_audit_trail,
    preserve_analytics,
    deletion_reason,
    scheduled_for
  ) VALUES (
    p_user_id,
    auth.uid(),
    p_deletion_type,
    p_preserve_audit_trail,
    p_preserve_analytics,
    p_deletion_reason,
    p_scheduled_for
  ) RETURNING id INTO deletion_id;
  
  -- Log the deletion request
  PERFORM log_admin_action(
    'data_deletion_requested',
    'user',
    p_user_id,
    jsonb_build_object(
      'deletion_id', deletion_id,
      'deletion_type', p_deletion_type,
      'scheduled_for', p_scheduled_for,
      'reason', p_deletion_reason
    )
  );
  
  RETURN deletion_id;
END;
$$;

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(
  p_user_id UUID,
  p_anonymization_method VARCHAR(50) DEFAULT 'hash',
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  anonymized_id UUID;
  admin_role public.app_role;
  log_id UUID;
BEGIN
  -- Check if requester has admin privileges
  SELECT app_role INTO admin_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to anonymize user data';
  END IF;
  
  -- Generate new anonymized ID
  anonymized_id := gen_random_uuid();
  
  -- Anonymize profile data
  UPDATE profiles SET
    full_name = 'Anonymous User',
    email = 'anonymous_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '@anonymized.local',
    avatar_url = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the anonymization
  INSERT INTO data_anonymization_log (
    user_id,
    anonymized_user_id,
    data_type,
    table_name,
    fields_anonymized,
    anonymization_method,
    performed_by,
    reason
  ) VALUES (
    p_user_id,
    anonymized_id,
    'profile',
    'profiles',
    ARRAY['full_name', 'email', 'avatar_url'],
    p_anonymization_method,
    auth.uid(),
    p_reason
  ) RETURNING id INTO log_id;
  
  -- Log the admin action
  PERFORM log_admin_action(
    'user_data_anonymized',
    'user',
    p_user_id,
    jsonb_build_object(
      'anonymized_id', anonymized_id,
      'method', p_anonymization_method,
      'log_id', log_id
    )
  );
  
  RETURN log_id;
END;
$$;

-- Function to create audit trail export
CREATE OR REPLACE FUNCTION create_audit_trail_export(
  p_export_name VARCHAR(200),
  p_date_range_start TIMESTAMP WITH TIME ZONE,
  p_date_range_end TIMESTAMP WITH TIME ZONE,
  p_user_filter UUID[] DEFAULT NULL,
  p_action_filter VARCHAR(50)[] DEFAULT NULL,
  p_export_format VARCHAR(10) DEFAULT 'json',
  p_export_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  export_id UUID;
  admin_role public.app_role;
  record_count INTEGER;
BEGIN
  -- Check if requester has admin privileges
  SELECT app_role INTO admin_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to create audit trail export';
  END IF;
  
  -- Count records that will be exported
  SELECT COUNT(*) INTO record_count
  FROM admin_audit_log
  WHERE created_at BETWEEN p_date_range_start AND p_date_range_end
    AND (p_user_filter IS NULL OR admin_user_id = ANY(p_user_filter))
    AND (p_action_filter IS NULL OR action_type = ANY(p_action_filter));
  
  -- Create export request
  INSERT INTO audit_trail_exports (
    export_name,
    date_range_start,
    date_range_end,
    user_filter,
    action_filter,
    export_format,
    record_count,
    exported_by,
    export_reason,
    expires_at
  ) VALUES (
    p_export_name,
    p_date_range_start,
    p_date_range_end,
    p_user_filter,
    p_action_filter,
    p_export_format,
    record_count,
    auth.uid(),
    p_export_reason,
    NOW() + INTERVAL '90 days' -- Audit exports expire in 90 days
  ) RETURNING id INTO export_id;
  
  -- Log the export request
  PERFORM log_admin_action(
    'audit_trail_export_requested',
    'audit',
    NULL,
    jsonb_build_object(
      'export_id', export_id,
      'export_name', p_export_name,
      'record_count', record_count,
      'date_range_start', p_date_range_start,
      'date_range_end', p_date_range_end
    )
  );
  
  RETURN export_id;
END;
$$;

-- Function to get GDPR compliance status for a user
CREATE OR REPLACE FUNCTION get_user_gdpr_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  has_active_consent BOOLEAN;
  last_export_date TIMESTAMP WITH TIME ZONE;
  pending_deletion BOOLEAN;
  data_anonymized BOOLEAN;
BEGIN
  -- Check if requester has admin privileges or is the user themselves
  IF NOT (
    auth.uid() = p_user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('admin', 'super_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to view GDPR status';
  END IF;
  
  -- Check for active consent
  SELECT EXISTS (
    SELECT 1 FROM gdpr_consent_log
    WHERE user_id = p_user_id
      AND consent_type = 'data_processing'
      AND consent_given = true
    ORDER BY created_at DESC
    LIMIT 1
  ) INTO has_active_consent;
  
  -- Get last export date
  SELECT MAX(completed_at) INTO last_export_date
  FROM data_export_requests
  WHERE user_id = p_user_id
    AND status = 'completed';
  
  -- Check for pending deletion
  SELECT EXISTS (
    SELECT 1 FROM data_deletion_requests
    WHERE user_id = p_user_id
      AND status IN ('pending', 'processing')
  ) INTO pending_deletion;
  
  -- Check if data has been anonymized
  SELECT EXISTS (
    SELECT 1 FROM data_anonymization_log
    WHERE user_id = p_user_id
  ) INTO data_anonymized;
  
  -- Build result
  result := json_build_object(
    'user_id', p_user_id,
    'has_active_consent', has_active_consent,
    'last_export_date', last_export_date,
    'pending_deletion', pending_deletion,
    'data_anonymized', data_anonymized,
    'compliance_status', CASE
      WHEN data_anonymized THEN 'anonymized'
      WHEN pending_deletion THEN 'deletion_pending'
      WHEN has_active_consent THEN 'compliant'
      ELSE 'consent_required'
    END
  );
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_data_export TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_data_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_trail_export TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gdpr_status TO authenticated;

-- Insert default retention policies
INSERT INTO data_retention_policies (policy_name, data_type, retention_period_days, auto_delete, anonymize_instead, policy_description, created_by) VALUES
  ('User Data Retention', 'user_data', 2555, false, true, 'Retain user data for 7 years, then anonymize', auth.uid()),
  ('Audit Log Retention', 'audit_logs', 2555, false, false, 'Retain audit logs for 7 years for compliance', auth.uid()),
  ('Content Retention', 'content', 1095, false, true, 'Retain user content for 3 years, then anonymize', auth.uid()),
  ('Analytics Retention', 'analytics', 730, true, true, 'Retain analytics data for 2 years, then auto-delete', auth.uid())
ON CONFLICT (policy_name) DO NOTHING;

-- Insert default GDPR configuration
INSERT INTO admin_config (key, value, description) VALUES
  ('gdpr_data_export_retention_days', '30', 'How long to keep data export files available'),
  ('gdpr_audit_export_retention_days', '90', 'How long to keep audit trail export files available'),
  ('gdpr_deletion_grace_period_days', '7', 'Grace period before executing data deletion requests'),
  ('gdpr_anonymization_method', '"hash"', 'Default method for data anonymization'),
  ('gdpr_consent_required', 'true', 'Whether explicit GDPR consent is required'),
  ('gdpr_auto_export_on_deletion', 'true', 'Automatically create data export before deletion')
ON CONFLICT (key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE data_export_requests IS 'GDPR-compliant user data export requests and processing';
COMMENT ON TABLE data_deletion_requests IS 'GDPR right to be forgotten - user data deletion requests';
COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies for different data types';
COMMENT ON TABLE data_anonymization_log IS 'Log of all data anonymization operations for audit trail';
COMMENT ON TABLE gdpr_consent_log IS 'GDPR consent tracking and withdrawal history';
COMMENT ON TABLE audit_trail_exports IS 'Compliance audit trail exports for regulatory reporting';