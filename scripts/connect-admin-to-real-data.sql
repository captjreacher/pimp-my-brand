-- Connect Admin Dashboard to Real Data
-- Run this in Supabase Dashboard -> SQL Editor

-- Step 1: Temporarily disable RLS to allow admin access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure app_role enum exists
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add admin columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_admin_action TEXT;

-- Step 4: Update your profile to be super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    full_name = COALESCE(full_name, 'Admin User'),
    updated_at = NOW()
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 5: Create admin RPC functions for user management
CREATE OR REPLACE FUNCTION get_admin_user_list(
    p_search TEXT DEFAULT NULL,
    p_role_filter TEXT DEFAULT 'all',
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
        p.app_role::TEXT,
        COALESCE(p.subscription_tier, 'free') as subscription_tier,
        p.created_at,
        p.last_sign_in_at as last_sign_in,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.suspended_at,
        p.suspended_by,
        p.suspension_reason,
        p.admin_notes,
        p.last_admin_action,
        COALESCE(
            (SELECT COUNT(*) FROM brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM cvs WHERE user_id = p.id), 
            0
        ) as content_count,
        COALESCE(
            (SELECT COUNT(*) FROM brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM cvs WHERE user_id = p.id), 
            0
        ) as total_generations
    FROM public.profiles p
    WHERE 
        (p_search IS NULL OR 
         p.email ILIKE '%' || p_search || '%' OR 
         p.full_name ILIKE '%' || p_search || '%')
    AND (p_role_filter = 'all' OR p.app_role::TEXT = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND NOT COALESCE(p.is_suspended, false)) OR
         (p_status_filter = 'suspended' AND COALESCE(p.is_suspended, false)))
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 6: Create user summary function
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
        p.app_role::TEXT,
        COALESCE(p.subscription_tier, 'free') as subscription_tier,
        p.created_at,
        p.last_sign_in_at as last_sign_in,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.suspended_at,
        p.suspended_by,
        p.suspension_reason,
        p.admin_notes,
        p.last_admin_action,
        COALESCE(
            (SELECT COUNT(*) FROM brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM cvs WHERE user_id = p.id), 
            0
        ) as content_count,
        COALESCE(
            (SELECT COUNT(*) FROM brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM cvs WHERE user_id = p.id), 
            0
        ) as total_generations,
        COALESCE((SELECT COUNT(*) FROM brands WHERE user_id = p.id), 0) as total_brands,
        COALESCE((SELECT COUNT(*) FROM cvs WHERE user_id = p.id), 0) as total_cvs,
        '{"recent_logins": [], "recent_content": []}'::JSONB as recent_activity
    FROM public.profiles p
    WHERE p.id = p_user_id;
END;
$$;

-- Step 7: Create user management functions
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
BEGIN
    UPDATE public.profiles 
    SET 
        is_suspended = true,
        suspended_at = NOW(),
        suspended_by = p_suspended_by,
        suspension_reason = p_suspension_reason,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        last_admin_action = 'suspended',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION activate_user(
    p_user_id UUID,
    p_activated_by UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        is_suspended = false,
        suspended_at = NULL,
        suspended_by = NULL,
        suspension_reason = NULL,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        last_admin_action = 'activated',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

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
BEGIN
    UPDATE public.profiles 
    SET 
        app_role = p_new_role::public.app_role,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        last_admin_action = 'role_changed_to_' || p_new_role,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION add_admin_notes(
    p_user_id UUID,
    p_admin_id UUID,
    p_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        admin_notes = CASE 
            WHEN admin_notes IS NULL OR admin_notes = '' THEN p_notes
            ELSE admin_notes || E'\n---\n' || p_notes
        END,
        last_admin_action = 'notes_added',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_suspended BOOLEAN;
BEGIN
    SELECT COALESCE(is_suspended, false) INTO user_suspended
    FROM public.profiles 
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_suspended, false);
END;
$$;

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_summary TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION activate_user TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_notes TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_suspended TO authenticated;

-- Step 9: Verify the setup
SELECT 
    'Setup verification:' as status,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE app_role IN ('admin', 'super_admin', 'moderator')) as admin_users,
    COUNT(*) FILTER (WHERE email = 'mike@mikerobinson.co.nz') as your_profile_count
FROM public.profiles;

-- Step 10: Show your admin profile
SELECT 
    'Your admin profile:' as info,
    id,
    email,
    full_name,
    app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';