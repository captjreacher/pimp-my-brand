-- Simple script to create admin user
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS to create the admin user
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create your admin profile
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions
) VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
)
ON CONFLICT (email) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    full_name = 'Super Admin';

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify the admin user was created
SELECT 
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;