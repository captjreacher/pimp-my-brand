-- Fix Mike's admin profile specifically
-- Run this in your Supabase SQL Editor

-- Step 1: Check if profile exists for Mike
SELECT 
    'Current profile for Mike:' as status,
    *
FROM public.profiles 
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 2: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create/update Mike's profile with admin privileges
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions,
    created_at,
    updated_at
) VALUES (
    'ee575bff-b1d7-428c-b02c-94a702692975',
    'mike@mikerobinson.co.nz',
    'Mike G Robinson',
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
ON CONFLICT (id) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    full_name = 'Mike G Robinson',
    email = 'mike@mikerobinson.co.nz',
    updated_at = NOW();

-- Alternative: Update by email if profile exists but with different ID
UPDATE public.profiles 
SET 
    id = 'ee575bff-b1d7-428c-b02c-94a702692975',
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    full_name = 'Mike G Robinson',
    updated_at = NOW()
WHERE email = 'mike@mikerobinson.co.nz';

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify Mike's profile is now correct
SELECT 
    'Mike profile after fix:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 6: Show all admin users
SELECT 
    'All admin users:' as status,
    email,
    app_role::text as role,
    admin_permissions
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;