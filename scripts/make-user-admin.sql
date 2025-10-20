-- Make User Admin Script
-- Run this in your Supabase SQL Editor

-- First, let's see what users exist
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Update the most recent user to be admin (replace with your actual user ID if needed)
-- You can get your user ID from the query above
UPDATE profiles 
SET 
  role = 'admin',
  app_role = 'admin'
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
);

-- Verify the update
SELECT p.id, u.email, p.role, p.app_role 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE p.role = 'admin';

-- If profiles table doesn't exist, create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  app_role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert profile for existing users if not exists
INSERT INTO profiles (id, email, role, app_role)
SELECT 
  u.id, 
  u.email, 
  'admin' as role,
  'admin' as app_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  app_role = 'admin';

-- Show final result
SELECT 'Admin setup complete!' as message;
SELECT p.id, u.email, p.role, p.app_role 
FROM profiles p 
JOIN auth.users u ON p.id = u.id;