-- Test profiles table access for admin user
-- Run this in Supabase SQL Editor

-- First, check if the admin user exists in auth.users
SELECT 'AUTH USER CHECK:' as section;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admin@maximisedai.com';

-- Check if profile exists
SELECT 'PROFILE CHECK:' as section;
SELECT 
    id,
    email,
    app_role,
    full_name,
    created_at
FROM profiles 
WHERE email = 'admin@maximisedai.com';

-- Check RLS policies on profiles table
SELECT 'RLS POLICIES:' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test if we can query profiles as the admin user would
-- This simulates what happens when the app tries to query after login
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@maximisedai.com';
    
    RAISE NOTICE 'SIMULATED APP QUERY:';
    RAISE NOTICE 'Admin ID: %', admin_id;
    
    -- Test the actual query the app makes
    PERFORM id, email, app_role, full_name
    FROM profiles 
    WHERE id = admin_id;
    
    RAISE NOTICE 'Query executed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Query failed with error: %', SQLERRM;
END $$;