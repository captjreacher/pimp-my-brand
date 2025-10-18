-- Emergency fix for missing profiles table
-- Run this in Supabase SQL Editor

-- First, check what tables exist
SELECT 'EXISTING TABLES:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check if profiles table exists
SELECT 'PROFILES TABLE STATUS:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'MISSING - WILL CREATE'
    END as status;

-- Create profiles table if missing
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    app_role TEXT NOT NULL DEFAULT 'user' CHECK (app_role IN ('user', 'admin', 'super_admin')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create simple policies
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Check if admin user exists in auth.users
SELECT 'ADMIN USER CHECK:' as info;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@maximisedai.com';

-- Create profile for admin user
INSERT INTO profiles (id, email, app_role, full_name)
SELECT 
    u.id,
    u.email,
    'super_admin',
    COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User')
FROM auth.users u
WHERE u.email = 'admin@maximisedai.com'
ON CONFLICT (id) DO UPDATE SET
    app_role = 'super_admin',
    email = EXCLUDED.email,
    updated_at = NOW();

-- Final verification
SELECT 'FINAL STATUS:' as info;
SELECT 
    p.id,
    p.email,
    p.app_role,
    p.full_name,
    u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'admin@maximisedai.com';

SELECT 'SETUP COMPLETE - Try logging in now' as result;