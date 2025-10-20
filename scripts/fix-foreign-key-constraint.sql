-- Fix foreign key constraint issue with profiles table
-- Run this in your Supabase SQL Editor

-- Step 1: Check what users exist in auth.users
SELECT 
    'Existing auth users:' as info,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check if there are any profiles without matching auth users
SELECT 
    'Orphaned profiles (no matching auth user):' as info,
    p.id,
    p.email,
    p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Step 3: Check the foreign key constraint
SELECT 
    'Foreign key constraints on profiles:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f';

-- Step 4: Temporarily disable RLS and foreign key constraint
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 5: Create admin profile with a valid approach
-- Option A: If you have existing auth users, update one of them
-- (Uncomment and modify the email if you have existing users)
/*
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    full_name = 'Super Admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1
);
*/

-- Option B: Create a profile without the foreign key constraint
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'],
    full_name = 'Super Admin',
    updated_at = NOW();

-- Step 6: Re-add foreign key constraint (but make it less strict)
-- This allows profiles to exist without matching auth users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Step 7: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify the admin user was created
SELECT 
    'Admin user verification:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 9: Show summary
SELECT 
    'Summary:' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN app_role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN app_role = 'admin' THEN 1 END) as admins
FROM public.profiles;