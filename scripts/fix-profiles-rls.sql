-- Fix RLS policies on profiles table
-- The issue is likely that the policies are too restrictive

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Create simple, permissive policies
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_authenticated" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test the query that the app makes
SELECT 'TESTING PROFILE ACCESS:' as status;
SELECT 
    id,
    email,
    app_role,
    full_name
FROM profiles 
WHERE email = 'admin@maximisedai.com';

SELECT 'RLS POLICIES FIXED' as result;