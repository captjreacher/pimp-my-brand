-- Complete admin setup verification and fix
-- Run this in your Supabase SQL Editor

-- Step 1: Check if admin user exists and has correct role
SELECT 
    'Current admin users:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 2: Check if all required admin tables exist
SELECT 
    'Admin tables status:' as info,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'admin_audit_log',
    'admin_sessions', 
    'content_moderation_queue',
    'admin_config'
)
ORDER BY table_name;

-- Step 3: Check if required functions exist
SELECT 
    'Admin functions status:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'log_admin_action',
    'start_admin_session',
    'end_admin_session'
)
ORDER BY routine_name;

-- Step 4: Check RLS policies on profiles
SELECT 
    'RLS policies on profiles:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 5: If no admin user exists, create one
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
DO $$
BEGIN
    -- Check if any admin users exist
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE app_role IN ('admin', 'super_admin', 'moderator')
    ) THEN
        -- Temporarily disable RLS
        ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
        
        -- Remove foreign key constraint if it exists
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        
        -- Create admin user
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
        );
        
        -- Re-enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Admin user created successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- Step 6: Final verification
SELECT 
    'Final verification:' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN app_role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN app_role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN app_role = 'moderator' THEN 1 END) as moderators
FROM public.profiles;