-- Force connection to real data and create your profile
-- This will ensure you exist in the database and have admin access

-- First, let's see what's in the database
SELECT 'Current profiles in database:' as info;
SELECT id, email, app_role, created_at FROM profiles LIMIT 10;

-- Check if you exist in auth.users
SELECT 'Auth users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- Create your profile if it doesn't exist (using your current auth session)
INSERT INTO profiles (id, email, app_role, created_at, updated_at)
SELECT 
  auth.uid(),
  auth.email(),
  'admin',
  now(),
  now()
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
ON CONFLICT (id) DO UPDATE SET
  app_role = 'admin',
  updated_at = now();

-- Verify the result
SELECT 
  'Your profile after creation:' as info,
  id,
  email, 
  app_role,
  created_at
FROM profiles 
WHERE id = auth.uid();