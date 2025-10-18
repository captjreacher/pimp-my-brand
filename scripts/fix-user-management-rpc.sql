-- Fix the get_admin_user_list function to use correct column names
-- The issue is that auth.users.last_sign_in_at doesn't exist

-- Drop and recreate the function with correct column references
DROP FUNCTION IF EXISTS get_admin_user_list;

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
    p.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    p.updated_at as last_sign_in, -- Use updated_at as proxy for last activity
    p.is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    0::BIGINT as total_generations -- Set to 0 for now since we don't have this column
  FROM profiles p
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
     p.email ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.app_role = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND p.is_suspended = false) OR
         (p_status_filter = 'suspended' AND p.is_suspended = true))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Also fix the get_user_admin_summary function
DROP FUNCTION IF EXISTS get_user_admin_summary;

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
    p.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    p.updated_at as last_sign_in, -- Use updated_at as proxy for last activity
    p.is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    0::BIGINT as total_generations, -- Set to 0 for now
    COALESCE(brand_count.count, 0) as total_brands,
    COALESCE(cv_count.count, 0) as total_cvs,
    jsonb_build_object(
      'recent_brands', COALESCE(recent_brands.brands, '[]'::jsonb),
      'recent_cvs', COALESCE(recent_cvs.cvs, '[]'::jsonb)
    ) as recent_activity
  FROM profiles p
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
  WHERE p.id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_summary TO authenticated;