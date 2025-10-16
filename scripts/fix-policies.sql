-- Fix infinite recursion in profiles policies
-- This script will drop and recreate the policies safely

-- First, let's see what policies exist
SELECT 'CURRENT POLICIES:' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Disable RLS temporarily to fix the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (for admin functionality)
CREATE POLICY "Allow authenticated read" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow authenticated insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile OR if they are admin
CREATE POLICY "Allow user update own or admin update all" ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.app_role IN ('admin', 'super_admin')
    )
  );

-- Test the fix by trying to select from profiles
SELECT 'TESTING POLICIES:' as step;
SELECT COUNT(*) as profile_count FROM profiles;

SELECT 'POLICIES FIXED!' as result;