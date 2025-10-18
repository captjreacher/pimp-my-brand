-- SQL script to verify that the app_role fix worked
-- Run this in your Supabase SQL Editor

-- Step 1: Check if app_role enum exists
SELECT 
    'app_role enum values:' as check_type,
    enumlabel as value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'app_role'
ORDER BY enumsortorder;

-- Step 2: Check profiles table structure for app_role column
SELECT 
    'profiles table columns:' as check_type,
    column_name as value,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('app_role', 'admin_permissions', 'last_admin_login', 'admin_notes')
ORDER BY column_name;

-- Step 3: Count profiles by role
SELECT 
    'profile counts by role:' as check_type,
    COALESCE(app_role::text, 'NULL') as role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY app_role
ORDER BY count DESC;

-- Step 4: Show admin users (if any)
SELECT 
    'admin users:' as check_type,
    email,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 5: Test inserting a profile with app_role (will be rolled back)
BEGIN;

-- Try to insert a test profile
INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    app_role, 
    admin_permissions
) VALUES (
    gen_random_uuid(),
    'test-verification@example.com',
    'Test User',
    'user'::public.app_role,
    '{}'::text[]
);

-- Check if it worked
SELECT 
    'test insert result:' as check_type,
    'SUCCESS - app_role column working' as result
WHERE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = 'test-verification@example.com'
);

-- Roll back the test insert
ROLLBACK;

-- Final summary
SELECT 
    'verification summary:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'app_role'
            AND table_schema = 'public'
        ) THEN '✅ app_role column exists'
        ELSE '❌ app_role column missing'
    END as result;

SELECT 
    'enum check:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = 'app_role'
        ) THEN '✅ app_role enum exists'
        ELSE '❌ app_role enum missing'
    END as result;