-- Quick fix for admin access to profiles table
-- This temporarily disables RLS to allow admin functions to work

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Temporarily disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Test query to see if we can now access all profiles
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT id, email, full_name, app_role FROM profiles LIMIT 5;