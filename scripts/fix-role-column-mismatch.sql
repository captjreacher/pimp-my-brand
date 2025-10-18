-- Fix role column mismatch
-- Your database has 'role' but the admin system expects 'app_role'
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table structure
SELECT 
    'Current profiles table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('role', 'app_role')
ORDER BY column_name;

-- Step 2: Show current data
SELECT 
    'Current profiles data:' as info,
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Add app_role column and copy data from role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role public.app_role;

-- Step 5: Copy data from role to app_role column
UPDATE public.profiles 
SET app_role = CASE 
    WHEN role = 'admin' THEN 'admin'::public.app_role
    WHEN role = 'super_admin' THEN 'super_admin'::public.app_role
    WHEN role = 'moderator' THEN 'moderator'::public.app_role
    ELSE 'user'::public.app_role
END
WHERE app_role IS NULL;

-- Step 6: Add other required admin columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Step 7: Update admin permissions for existing admin users
UPDATE public.profiles 
SET admin_permissions = ARRAY[
    'manage_users',
    'moderate_content', 
    'manage_billing',
    'view_analytics',
    'manage_system',
    'view_audit_logs'
]
WHERE app_role IN ('admin', 'super_admin') 
AND (admin_permissions IS NULL OR admin_permissions = '{}');

-- Step 8: Create index on app_role
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON public.profiles(app_role);

-- Step 9: Verify the fix
SELECT 
    'After fix - profiles with admin roles:' as status,
    id,
    email,
    full_name,
    role as old_role,
    app_role::text as new_app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 10: Show summary
SELECT 
    'Summary:' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN app_role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN app_role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN app_role = 'moderator' THEN 1 END) as moderators,
    COUNT(CASE WHEN app_role = 'user' THEN 1 END) as regular_users
FROM public.profiles;