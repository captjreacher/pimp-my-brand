-- Ultra simple admin creation script
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Remove the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Delete any existing profile with your email (to avoid duplicates)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
DELETE FROM public.profiles WHERE email = 'your-email@example.com';

-- Step 4: Create admin user (simple INSERT without ON CONFLICT)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions
) VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
);

-- Step 5: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify admin user was created
SELECT 
    'SUCCESS - Admin user created:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions
FROM public.profiles 
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL