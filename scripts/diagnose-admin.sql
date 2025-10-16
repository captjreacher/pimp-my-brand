-- DIAGNOSE ADMIN SETUP
-- This script checks what's currently in your database

-- Step 1: Check if app_role type exists
SELECT 
    'app_role type exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- Step 2: Check profiles table structure
SELECT 
    'profiles table columns' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check your specific profile
SELECT 
    'your profile data' as info,
    *
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 4: Check if admin tables exist
SELECT 
    'admin tables exist' as check_name,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'YES' ELSE 'NO' END as exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_audit_log', 'admin_sessions', 'content_moderation_queue', 'admin_config')
ORDER BY table_name;