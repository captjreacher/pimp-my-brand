-- Create admin using existing auth user
-- Run this in your Supabase SQL Editor

-- Step 1: Check what auth users exist
SELECT 
    'Available auth users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create/update profile for existing auth user
-- IMPORTANT: Replace 'your-email@example.com' with your actual email from auth.users
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions
) 
SELECT 
    u.id,
    u.email,
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    full_name = 'Super Admin',
    updated_at = NOW();

-- Alternative: Update by email if profile already exists
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    full_name = 'Super Admin',
    updated_at = NOW()
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify admin user was created
SELECT 
    'Admin user created/updated:' as status,
    p.id,
    p.email,
    p.full_name,
    p.app_role::text as role,
    p.admin_permissions,
    CASE WHEN u.id IS NOT NULL THEN 'Has auth user' ELSE 'No auth user' END as auth_status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY p.created_at DESC;