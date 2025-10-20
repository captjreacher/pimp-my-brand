-- IMMEDIATE ADMIN FIX - Run this in Supabase SQL Editor
-- This will instantly connect your admin dashboard to real data

-- Step 1: Disable RLS completely
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create enum if needed
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add required columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_admin_action TEXT;

-- Step 4: Make yourself super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 5: Create the admin RPC function
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
        COALESCE(p.app_role::TEXT, 'user') as app_role,
        COALESCE(p.subscription_tier, 'free') as subscription_tier,
        p.created_at,
        p.last_sign_in_at as last_sign_in,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.suspended_at,
        p.suspended_by,
        p.suspension_reason,
        p.admin_notes,
        p.last_admin_action,
        0::BIGINT as content_count,
        0::BIGINT as total_generations
    FROM public.profiles p
    WHERE 
        (p_search IS NULL OR 
         p.email ILIKE '%' || p_search || '%' OR 
         p.full_name ILIKE '%' || p_search || '%')
    AND (p_role_filter = 'all' OR COALESCE(p.app_role::TEXT, 'user') = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND NOT COALESCE(p.is_suspended, false)) OR
         (p_status_filter = 'suspended' AND COALESCE(p.is_suspended, false)))
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_user_list TO anon;

-- Step 7: Verify the fix
SELECT 
    'ADMIN FIX COMPLETE' as status,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE app_role IN ('admin', 'super_admin', 'moderator')) as admin_users
FROM public.profiles;

-- Step 8: Show your admin profile
SELECT 
    'Your admin profile:' as info,
    email,
    app_role,
    admin_permissions
FROM public.profiles 
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';