-- SIMPLE ADMIN FIX - Step by step approach
-- Run each section separately if needed

-- Step 1: Fix the policies first
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated read" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON profiles;
DROP POLICY IF EXISTS "Allow user update own or admin update all" ON profiles;

-- Step 2: Create simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated" ON profiles
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 3: Just create the profile directly (skip auth.users for now)
INSERT INTO profiles (
    id,
    email,
    app_role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@funkmybrand.com',
    'super_admin',
    now(),
    now()
);

-- Step 4: Check if it worked
SELECT 'RESULT:' as step;
SELECT id, email, app_role, created_at 
FROM profiles 
WHERE email = 'admin@funkmybrand.com';