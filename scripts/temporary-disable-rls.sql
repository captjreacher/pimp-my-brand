-- Temporary fix: Disable RLS on profiles table to allow admin access
-- WARNING: This removes security restrictions temporarily

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Disable RLS temporarily (ONLY for testing admin functions)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- NOTE: To re-enable RLS later, run:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;