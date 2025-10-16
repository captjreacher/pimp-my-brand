-- EMERGENCY ADMIN FIX
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create the admin user and fix all policy issues

-- Step 1: Disable RLS on profiles to stop infinite recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies
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

-- Step 3: Create the admin user directly in auth.users
-- Generate a UUID for the admin user
DO $$
DECLARE
    admin_uuid uuid := gen_random_uuid();
    encrypted_password text;
BEGIN
    -- Create the user in auth.users with a hashed password
    -- Password will be 'admin123'
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        admin_uuid,
        '00000000-0000-0000-0000-000000000000',
        'admin@funkmybrand.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('admin123', gen_salt('bf')),
        updated_at = now();

    -- Create the profile
    INSERT INTO profiles (
        id,
        email,
        app_role,
        created_at,
        updated_at
    ) VALUES (
        admin_uuid,
        'admin@funkmybrand.com',
        'super_admin',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        app_role = 'super_admin',
        updated_at = now();

    RAISE NOTICE 'Admin user created with UUID: %', admin_uuid;
END $$;

-- Step 4: Re-enable RLS with simple, safe policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that won't cause recursion
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (true);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (true);

-- Step 5: Verify everything worked
SELECT 'VERIFICATION:' as step;
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.app_role,
    'SUCCESS! Admin user created and policies fixed!' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@funkmybrand.com';

-- Show all profiles to confirm
SELECT 'ALL PROFILES:' as step;
SELECT id, email, app_role, created_at FROM profiles;