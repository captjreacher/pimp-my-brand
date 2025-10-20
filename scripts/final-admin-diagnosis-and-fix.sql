-- Final comprehensive diagnosis and fix for Mike's admin access
-- Run this in your Supabase SQL Editor

-- Step 1: Check if app_role enum exists
SELECT 
    'App role enum check:' as info,
    typname as enum_name,
    enumlabel as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'app_role'
ORDER BY enumsortorder;

-- Step 2: Check profiles table structure
SELECT 
    'Profiles table structure:' as info,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check Mike's current profile data
SELECT 
    'Mike current profile (all columns):' as info,
    *
FROM public.profiles 
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 4: Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 5: Add app_role column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- Step 6: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 7: Update Mike's profile with all possible approaches
-- First try updating by ID
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
    role = 'admin',  -- Also set the old role column just in case
    full_name = COALESCE(full_name, 'Mike G Robinson'),
    updated_at = NOW()
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Also try updating by email in case there's a mismatch
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
    role = 'admin',
    full_name = COALESCE(full_name, 'Mike G Robinson'),
    updated_at = NOW()
WHERE email = 'mike@mikerobinson.co.nz';

-- Step 8: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify the update worked
SELECT 
    'Mike profile after comprehensive update:' as status,
    id,
    email,
    full_name,
    role,
    app_role::text as app_role_text,
    admin_permissions,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975' 
   OR email = 'mike@mikerobinson.co.nz';

-- Step 10: Show all profiles to see what we have
SELECT 
    'All profiles summary:' as info,
    id,
    email,
    COALESCE(app_role::text, 'NULL') as app_role,
    COALESCE(role, 'NULL') as old_role,
    admin_permissions
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- Step 11: Final verification - count admin users
SELECT 
    'Admin users count:' as info,
    COUNT(*) as total_admins
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
   OR role IN ('admin', 'super_admin', 'moderator');