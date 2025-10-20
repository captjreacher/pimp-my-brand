-- Fix RLS policies causing infinite recursion on profiles table
-- This is the root cause of the admin login issue

-- First, let's see what policies exist
SELECT 'CURRENT POLICIES ON PROFILES:' as step;
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop all existing policies on profiles to fix recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Verify policies are fixed
SELECT 'NEW POLICIES ON PROFILES:' as step;
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'RLS POLICIES FIXED - Try logging in now!' as result;