-- User Management API Functions
-- These functions provide the backend API for admin user management operations

-- Function to get admin user list with filtering and pagination
CREATE OR REPLACE FUNCTION get_admin_user_list(
  p_search TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  app_role TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  is_suspended BOOLEAN,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT,
  admin_notes TEXT,
  last_admin_action TEXT,
  content_count BIGINT,
  total_generations BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    au.last_sign_in_at as last_sign_in,
    (p.suspended_at IS NOT NULL) as is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    COALESCE(p.total_generations, 0) as total_generations
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM brands 
    GROUP BY user_id
  ) brand_count ON p.id = brand_count.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM cvs 
    GROUP BY user_id
  ) cv_count ON p.id = cv_count.user_id
  WHERE 
    (p_search IS NULL OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.app_role = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND p.suspended_at IS NULL) OR
         (p_status_filter = 'suspended' AND p.suspended_at IS NOT NULL))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get detailed user summary for admin view
CREATE OR REPLACE FUNCTION get_user_admin_summary(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  app_role TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  is_suspended BOOLEAN,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT,
  admin_notes TEXT,
  last_admin_action TEXT,
  content_count BIGINT,
  total_generations BIGINT,
  total_brands BIGINT,
  total_cvs BIGINT,
  recent_activity JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    au.last_sign_in_at as last_sign_in,
    (p.suspended_at IS NOT NULL) as is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    COALESCE(p.total_generations, 0) as total_generations,
    COALESCE(brand_count.count, 0) as total_brands,
    COALESCE(cv_count.count, 0) as total_cvs,
    jsonb_build_object(
      'recent_brands', COALESCE(recent_brands.brands, '[]'::jsonb),
      'recent_cvs', COALESCE(recent_cvs.cvs, '[]'::jsonb),
      'recent_logins', COALESCE(recent_sessions.sessions, '[]'::jsonb)
    ) as recent_activity
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM brands 
    WHERE user_id = p_user_id
    GROUP BY user_id
  ) brand_count ON p.id = brand_count.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM cvs 
    WHERE user_id = p_user_id
    GROUP BY user_id
  ) cv_count ON p.id = cv_count.user_id
  LEFT JOIN (
    SELECT user_id, jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as brands
    FROM brands 
    WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
    LIMIT 5
  ) recent_brands ON p.id = recent_brands.user_id
  LEFT JOIN (
    SELECT user_id, jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as cvs
    FROM cvs 
    WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
    LIMIT 5
  ) recent_cvs ON p.id = recent_cvs.user_id
  LEFT JOIN (
    SELECT user_id, jsonb_agg(
      jsonb_build_object(
        'session_start', session_start,
        'ip_address', ip_address
      ) ORDER BY session_start DESC
    ) as sessions
    FROM admin_sessions 
    WHERE user_id = p_user_id
    AND session_start >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
    LIMIT 10
  ) recent_sessions ON p.id = recent_sessions.user_id
  WHERE p.id = p_user_id;
END;
$$;

-- Function to suspend a user
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_suspended_by UUID,
  p_suspension_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if the suspending user has admin privileges
  SELECT app_role INTO v_admin_role
  FROM profiles
  WHERE id = p_suspended_by;
  
  IF v_admin_role NOT IN ('admin', 'moderator', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to suspend user';
  END IF;
  
  -- Update the user profile
  UPDATE profiles
  SET 
    suspended_at = NOW(),
    suspended_by = p_suspended_by,
    suspension_reason = p_suspension_reason,
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 
                  '[' || NOW()::TEXT || '] SUSPENDED: ' || p_suspension_reason ||
                  CASE WHEN p_admin_notes IS NOT NULL THEN E'\nNotes: ' || p_admin_notes ELSE '' END,
    last_admin_action = 'suspended'
  WHERE id = p_user_id;
  
  -- Log the action in audit trail
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_suspended_by,
    'user_suspended',
    'user',
    p_user_id,
    jsonb_build_object(
      'suspension_reason', p_suspension_reason,
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to activate/unsuspend a user
CREATE OR REPLACE FUNCTION activate_user(
  p_user_id UUID,
  p_activated_by UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if the activating user has admin privileges
  SELECT app_role INTO v_admin_role
  FROM profiles
  WHERE id = p_activated_by;
  
  IF v_admin_role NOT IN ('admin', 'moderator', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to activate user';
  END IF;
  
  -- Update the user profile
  UPDATE profiles
  SET 
    suspended_at = NULL,
    suspended_by = NULL,
    suspension_reason = NULL,
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 
                  '[' || NOW()::TEXT || '] ACTIVATED' ||
                  CASE WHEN p_admin_notes IS NOT NULL THEN E'\nNotes: ' || p_admin_notes ELSE '' END,
    last_admin_action = 'activated'
  WHERE id = p_user_id;
  
  -- Log the action in audit trail
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_activated_by,
    'user_activated',
    'user',
    p_user_id,
    jsonb_build_object(
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to change user role
CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id UUID,
  p_new_role TEXT,
  p_changed_by UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_old_role TEXT;
BEGIN
  -- Check if the changing user has admin privileges
  SELECT app_role INTO v_admin_role
  FROM profiles
  WHERE id = p_changed_by;
  
  IF v_admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to change user role';
  END IF;
  
  -- Only super_admin can create other admins
  IF p_new_role IN ('admin', 'super_admin') AND v_admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admin can assign admin roles';
  END IF;
  
  -- Validate role
  IF p_new_role NOT IN ('user', 'moderator', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Get old role for logging
  SELECT app_role INTO v_old_role
  FROM profiles
  WHERE id = p_user_id;
  
  -- Update the user profile
  UPDATE profiles
  SET 
    app_role = p_new_role,
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 
                  '[' || NOW()::TEXT || '] ROLE CHANGED: ' || v_old_role || ' → ' || p_new_role ||
                  CASE WHEN p_admin_notes IS NOT NULL THEN E'\nNotes: ' || p_admin_notes ELSE '' END,
    last_admin_action = 'role_changed'
  WHERE id = p_user_id;
  
  -- Log the action in audit trail
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_changed_by,
    'user_role_changed',
    'user',
    p_user_id,
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_new_role,
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to add admin notes to user
CREATE OR REPLACE FUNCTION add_admin_notes(
  p_user_id UUID,
  p_admin_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if the user has admin privileges
  SELECT app_role INTO v_admin_role
  FROM profiles
  WHERE id = p_admin_id;
  
  IF v_admin_role NOT IN ('admin', 'moderator', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to add admin notes';
  END IF;
  
  -- Update the user profile with new notes
  UPDATE profiles
  SET 
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 
                  '[' || NOW()::TEXT || '] ' || p_notes,
    last_admin_action = 'notes_added'
  WHERE id = p_user_id;
  
  -- Log the action in audit trail
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    'admin_notes_added',
    'user',
    p_user_id,
    jsonb_build_object(
      'notes', p_notes
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suspended_at TIMESTAMPTZ;
BEGIN
  SELECT suspended_at INTO v_suspended_at
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_suspended_at IS NOT NULL;
END;
$$;

-- Grant execute permissions to authenticated users (admin middleware will handle authorization)
GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_summary TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION activate_user TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_notes TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_suspended TO authenticated;