-- Create admin user and fix RLS policies
-- Run this in your Supabase SQL Editor

-- Step 1: Temporarily disable RLS on profiles table to create admin
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create/update your admin profile
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    full_name = 'Super Admin',
    updated_at = NOW();

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Step 5: Create proper RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin')
        )
    );

-- Step 6: Verify the admin user was created
SELECT 
    'Admin user created:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 7: Test that RLS is working properly
SELECT 
    'RLS policies active:' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 8: Show all current policies
SELECT 
    'Current RLS policies:' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;