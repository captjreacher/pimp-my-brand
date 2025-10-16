-- Extend Profiles Table for Admin Features Migration
-- This migration adds admin-specific fields to the profiles table

-- Add admin-specific fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_admin_action TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_flags JSONB DEFAULT '{}';

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles(app_role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_by ON profiles(suspended_by);
CREATE INDEX IF NOT EXISTS idx_profiles_last_admin_action ON profiles(last_admin_action);

-- Function to suspend user
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_suspended_by UUID,
  p_suspension_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is already suspended
  IF user_record.suspended_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Suspend the user
  UPDATE profiles
  SET suspended_at = NOW(),
      suspended_by = p_suspended_by,
      suspension_reason = p_suspension_reason,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      last_admin_action = NOW()
  WHERE id = p_user_id;
  
  -- Log the suspension
  PERFORM log_admin_action(
    p_suspended_by,
    'USER_SUSPENDED',
    'user',
    p_user_id,
    jsonb_build_object(
      'user_email', user_record.email,
      'suspension_reason', p_suspension_reason,
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate/unsuspend user
CREATE OR REPLACE FUNCTION activate_user(
  p_user_id UUID,
  p_activated_by UUID,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  previous_suspension TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is suspended
  IF user_record.suspended_at IS NULL THEN
    RETURN false;
  END IF;
  
  previous_suspension := user_record.suspended_at;
  
  -- Activate the user
  UPDATE profiles
  SET suspended_at = NULL,
      suspended_by = NULL,
      suspension_reason = NULL,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      last_admin_action = NOW()
  WHERE id = p_user_id;
  
  -- Log the activation
  PERFORM log_admin_action(
    p_activated_by,
    'USER_ACTIVATED',
    'user',
    p_user_id,
    jsonb_build_object(
      'user_email', user_record.email,
      'previously_suspended_at', previous_suspension,
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change user role
CREATE OR REPLACE FUNCTION change_user_role(
  p_user_id UUID,
  p_new_role VARCHAR(20),
  p_changed_by UUID,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  old_role VARCHAR(20);
BEGIN
  -- Validate role
  IF p_new_role NOT IN ('user', 'moderator', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;
  
  -- Get user record
  SELECT * INTO user_record FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  old_role := user_record.app_role;
  
  -- Don't update if role is the same
  IF old_role = p_new_role THEN
    RETURN false;
  END IF;
  
  -- Update user role
  UPDATE profiles
  SET app_role = p_new_role,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      last_admin_action = NOW()
  WHERE id = p_user_id;
  
  -- Log the role change
  PERFORM log_admin_action(
    p_changed_by,
    'USER_ROLE_CHANGED',
    'user',
    p_user_id,
    jsonb_build_object(
      'user_email', user_record.email,
      'old_role', old_role,
      'new_role', p_new_role,
      'admin_notes', p_admin_notes
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add admin notes to user
CREATE OR REPLACE FUNCTION add_admin_notes(
  p_user_id UUID,
  p_admin_id UUID,
  p_notes TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  existing_notes TEXT;
  new_notes TEXT;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  existing_notes := user_record.admin_notes;
  
  -- Append new notes with timestamp and admin info
  new_notes := COALESCE(existing_notes, '') || 
    CASE WHEN existing_notes IS NOT NULL AND existing_notes != '' THEN E'\n\n' ELSE '' END ||
    '[' || NOW()::TEXT || ' by ' || p_admin_id || '] ' || p_notes;
  
  -- Update admin notes
  UPDATE profiles
  SET admin_notes = new_notes,
      last_admin_action = NOW()
  WHERE id = p_user_id;
  
  -- Log the notes addition
  PERFORM log_admin_action(
    p_admin_id,
    'USER_NOTES_ADDED',
    'user',
    p_user_id,
    jsonb_build_object(
      'user_email', user_record.email,
      'notes_added', p_notes
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin user list with filtering
CREATE OR REPLACE FUNCTION get_admin_user_list(
  p_search TEXT DEFAULT NULL,
  p_role_filter VARCHAR(20) DEFAULT NULL,
  p_status_filter VARCHAR(20) DEFAULT NULL, -- 'active', 'suspended', 'all'
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  app_role VARCHAR(20),
  subscription_tier VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  is_suspended BOOLEAN,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_by UUID,
  suspension_reason TEXT,
  admin_notes TEXT,
  last_admin_action TIMESTAMP WITH TIME ZONE,
  content_count BIGINT,
  total_generations INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    p.last_sign_in,
    (p.suspended_at IS NOT NULL) as is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    COALESCE(p.generations_used, 0) as total_generations
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
  WHERE (p_search IS NULL OR 
         p.email ILIKE '%' || p_search || '%' OR 
         p.full_name ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.app_role = p_role_filter)
    AND (p_status_filter IS NULL OR 
         (p_status_filter = 'active' AND p.suspended_at IS NULL) OR
         (p_status_filter = 'suspended' AND p.suspended_at IS NOT NULL) OR
         p_status_filter = 'all')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the trigger for profile changes (from the audit system)
CREATE TRIGGER trigger_audit_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_profile_changes();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Update RLS policies for profiles to include admin access
-- Admins can view all profiles
CREATE POLICY "Admin users can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Admins can update user profiles (for suspension, notes, etc.)
CREATE POLICY "Admin users can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.app_role IN ('admin', 'super_admin')
    )
  );

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  suspended_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT profiles.suspended_at INTO suspended_at
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN suspended_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user admin summary
CREATE OR REPLACE FUNCTION get_user_admin_summary(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  app_role VARCHAR(20),
  subscription_tier VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  is_suspended BOOLEAN,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_by UUID,
  suspension_reason TEXT,
  admin_notes TEXT,
  last_admin_action TIMESTAMP WITH TIME ZONE,
  total_brands BIGINT,
  total_cvs BIGINT,
  total_generations INTEGER,
  recent_activity JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    p.last_sign_in,
    (p.suspended_at IS NOT NULL) as is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) as total_brands,
    COALESCE(cv_count.count, 0) as total_cvs,
    COALESCE(p.generations_used, 0) as total_generations,
    jsonb_build_object(
      'recent_brands', COALESCE(recent_brands.brands, '[]'::jsonb),
      'recent_cvs', COALESCE(recent_cvs.cvs, '[]'::jsonb),
      'moderation_flags', COALESCE(mod_flags.flags, '[]'::jsonb)
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
    SELECT user_id, jsonb_agg(jsonb_build_object('id', id, 'title', title, 'created_at', created_at)) as brands
    FROM brands 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC 
    LIMIT 5
  ) recent_brands ON p.id = recent_brands.user_id
  LEFT JOIN (
    SELECT user_id, jsonb_agg(jsonb_build_object('id', id, 'title', title, 'created_at', created_at)) as cvs
    FROM cvs 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC 
    LIMIT 5
  ) recent_cvs ON p.id = recent_cvs.user_id
  LEFT JOIN (
    SELECT user_id, jsonb_agg(jsonb_build_object('id', id, 'status', status, 'flag_reason', flag_reason, 'created_at', created_at)) as flags
    FROM content_moderation_queue 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC 
    LIMIT 10
  ) mod_flags ON p.id = mod_flags.user_id
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;