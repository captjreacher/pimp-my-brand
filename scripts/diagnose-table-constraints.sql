-- Diagnose table constraints and structure
-- Run this in your Supabase SQL Editor to understand the current state

-- Step 1: Check table structure
SELECT 
    'Profiles table columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check all constraints on profiles table
SELECT 
    'Constraints on profiles table:' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Step 3: Check indexes on profiles table
SELECT 
    'Indexes on profiles table:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- Step 4: Check current profiles data
SELECT 
    'Current profiles:' as info,
    COUNT(*) as total_profiles
FROM public.profiles;

-- Step 5: Show sample profiles (if any)
SELECT 
    'Sample profiles:' as info,
    id,
    email,
    COALESCE(app_role::text, 'NULL') as app_role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;