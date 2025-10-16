-- TEST DATABASE SCRIPT
-- This script checks what's actually in your database

-- Step 1: Check if app_role type exists
SELECT 
    'app_role type check' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as result;

-- Step 2: Check profiles table structure
SELECT 
    'profiles table structure' as test,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Try to select your profile with app_role
SELECT 
    'your profile with app_role' as test,
    id,
    display_name,
    app_role,
    created_at
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 4: If that fails, try without app_role
SELECT 
    'your profile without app_role' as test,
    id,
    display_name,
    created_at
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';