-- Comprehensive diagnostic for profiles table and app_role issues

-- Check if app_role enum type exists
SELECT 
    typname as enum_name,
    enumlabel as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'app_role'
ORDER BY enumsortorder;

-- Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if profiles table exists and has data
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN app_role IS NOT NULL THEN 1 END) as profiles_with_role,
    COUNT(CASE WHEN app_role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN app_role = 'super_admin' THEN 1 END) as super_admin_count
FROM public.profiles;

-- Show sample profiles data
SELECT 
    id,
    email,
    full_name,
    COALESCE(app_role::text, 'NULL') as app_role,
    admin_permissions,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;

-- Check for any constraints or indexes on app_role
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexdef LIKE '%app_role%';

-- Check RLS policies that might reference app_role
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';