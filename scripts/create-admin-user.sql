-- Create admin user directly in database
-- This bypasses the signup flow and creates the user with admin privileges

-- First, let's check what tables exist
SELECT 'CHECKING TABLES:' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'users');

-- Check auth schema tables
SELECT 'CHECKING AUTH TABLES:' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- Check if profiles table exists and its structure
SELECT 'PROFILES TABLE STRUCTURE:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Try to create a profile directly (if the table exists)
-- We'll use a dummy UUID for now
INSERT INTO profiles (id, email, app_role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@funkmybrand.com',
  'super_admin',
  now(),
  now()
) 
ON CONFLICT (email) DO UPDATE SET 
  app_role = 'super_admin',
  updated_at = now();

-- Check the result
SELECT 'RESULT:' as step;
SELECT id, email, app_role, created_at 
FROM profiles 
WHERE email = 'admin@funkmybrand.com';